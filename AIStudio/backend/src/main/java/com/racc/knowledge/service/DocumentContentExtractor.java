package com.racc.knowledge.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.openxml4j.util.ZipSecureFile;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.util.Locale;
import java.util.Set;

/**
 * Office/PDF 正文提取器。
 *
 * 知识库上传默认按纯文本读取，遇到二进制的 Word/PDF 会得到乱码。
 * 本组件按扩展名将 .docx / .doc / .pdf 的正文抽取为纯文本，供入库、全文索引与检索使用。
 *
 * - .docx → Apache POI XWPF（poi-ooxml）
 * - .doc  → Apache POI HWPF（poi-scratchpad）
 * - .pdf  → Apache PDFBox
 */
@Component
public class DocumentContentExtractor {

    static {
        // 合法的大型 docx（大量表格/重复内容）压缩比可能极高，会触发 POI 默认 0.01 的
        // "Zip bomb" 误报（解压放大超过 100 倍即拒绝）。本平台的上传均为内部可信文档，
        // 将阈值放宽到 0.0001（放大 1 万倍以内放行），兼顾安全与可用性。
        ZipSecureFile.setMinInflateRatio(0.0001);
    }

    private static final Set<String> EXTRACTABLE = Set.of("docx", "doc", "pdf");

    /**
     * 判断文件名是否为可提取正文的二进制文档类型。
     */
    public boolean isExtractable(String fileName) {
        return EXTRACTABLE.contains(ext(fileName));
    }

    /**
     * 按扩展名提取正文文本。失败时抛出 RuntimeException（由调用方转为用户可读错误）。
     */
    public String extract(String fileName, byte[] bytes) {
        String e = ext(fileName);
        try {
            switch (e) {
                case "docx":
                    return extractDocx(bytes);
                case "doc":
                    return extractDoc(bytes);
                case "pdf":
                    return extractPdf(bytes);
                default:
                    throw new IllegalArgumentException("不支持的文档类型: " + e);
            }
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception ex) {
            throw new RuntimeException("解析文档失败（" + fileName + "）: " + ex.getMessage(), ex);
        }
    }

    private String extractDocx(byte[] bytes) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(bytes));
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return normalize(extractor.getText());
        }
    }

    private String extractDoc(byte[] bytes) throws Exception {
        try (HWPFDocument doc = new HWPFDocument(new ByteArrayInputStream(bytes));
             WordExtractor extractor = new WordExtractor(doc)) {
            return normalize(extractor.getText());
        }
    }

    private String extractPdf(byte[] bytes) throws Exception {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(new ByteArrayInputStream(bytes)))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return normalize(stripper.getText(doc));
        }
    }

    /** 压缩多余空行/首尾空白，保持入库文本整洁。 */
    private String normalize(String text) {
        if (text == null) return "";
        return text.replaceAll("[\\t ]+", " ")
                   .replaceAll("(\\s*\\n){3,}", "\n\n")
                   .trim();
    }

    private String ext(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) return "";
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
