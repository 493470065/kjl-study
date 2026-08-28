package com.racc.knowledge.service;

import com.racc.knowledge.entity.KnowledgeDocumentEntity;
import com.racc.knowledge.repository.KnowledgeDocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 链接抓取服务：从 URL 获取文档内容并入库（sourceType='link'）。
 * 使用 JDK 内置 HttpClient，无需额外依赖；HTML 正文通过标签剥离 + 实体解码提取。
 */
@Service
public class LinkFetchService {

    private static final Logger log = LoggerFactory.getLogger(LinkFetchService.class);

    private final KnowledgeService knowledgeService;
    private final KnowledgeDocumentRepository repository;

    private static final Pattern TAG_PATTERN = Pattern.compile("<[^>]+>", Pattern.DOTALL);
    private static final Pattern SCRIPT_PATTERN = Pattern.compile(
            "(?is)<(script|style|head|noscript|svg|iframe)[^>]*>.*?</\\1>");
    private static final Pattern BODY_PATTERN = Pattern.compile(
            "(?is)<body[^>]*>(.*?)</body>");
    private static final Pattern ENTITY_PATTERN = Pattern.compile("&([a-zA-Z]+|#\\d+);");
    private static final int MAX_CONTENT = 80_000;

    public LinkFetchService(KnowledgeService knowledgeService, KnowledgeDocumentRepository repository) {
        this.knowledgeService = knowledgeService;
        this.repository = repository;
    }

    /**
     * 抓取并入库。返回入库后的文档 Map（由 KnowledgeService 统一处理嵌入与 FTS）。
     */
    public Map<String, Object> fetchAndIngest(String url, String fetchMode,
                                               String category, String tags,
                                               String productLine, String module, String functionPoint) {
        String html = fetch(url);
        String text = "auto".equalsIgnoreCase(fetchMode) ? extractMainText(html) : stripTags(html);
        if (text.length() > MAX_CONTENT) text = text.substring(0, MAX_CONTENT);

        String title = extractTitle(html);
        if ((title == null || title.isBlank()) && url != null) {
            title = url.replaceAll("^https?://", "").split("/")[0];
        }

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("title", title);
        body.put("content", text);
        body.put("category", category);
        body.put("tags", tags);
        body.put("sourceType", "link");
        body.put("sourceUrl", url);
        body.put("productLine", productLine);
        body.put("module", module);
        body.put("functionPoint", functionPoint);

        return knowledgeService.uploadDocument(body);
    }

    // ===================== 抓取 =====================

    private String fetch(String url) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("User-Agent", "RACC-KnowledgeBot/1.0")
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 400) {
                throw new RuntimeException("HTTP " + response.statusCode());
            }
            return response.body();
        } catch (Exception e) {
            throw new RuntimeException("抓取失败: " + e.getMessage(), e);
        }
    }

    // ===================== 正文提取 =====================

    private String extractMainText(String html) {
        if (html == null) return "";
        // 去除无关注点
        String cleaned = SCRIPT_PATTERN.matcher(html).replaceAll(" ");
        // 优先取 body 区域
        Matcher bodyM = BODY_PATTERN.matcher(cleaned);
        String region = bodyM.find() ? bodyM.group(1) : cleaned;
        return stripTags(region);
    }

    private String stripTags(String html) {
        if (html == null) return "";
        String text = TAG_PATTERN.matcher(html).replaceAll(" ");
        text = decodeEntities(text);
        text = text.replaceAll("[ \\t]+", " ")
                  .replaceAll("\\n\\s*\\n\\s*\\n+", "\n\n")
                  .trim();
        return text;
    }

    private String extractTitle(String html) {
        if (html == null) return null;
        Matcher m = Pattern.compile("(?is)<title[^>]*>(.*?)</title>").matcher(html);
        if (m.find()) {
            return decodeEntities(m.group(1).trim());
        }
        return null;
    }

    private String decodeEntities(String text) {
        Matcher m = ENTITY_PATTERN.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String enc = m.group(1);
            String decoded = switch (enc) {
                case "amp" -> "&";
                case "lt" -> "<";
                case "gt" -> ">";
                case "quot" -> "\"";
                case "apos" -> "'";
                case "nbsp" -> " ";
                case "copy" -> "©";
                default -> {
                    if (enc.startsWith("#")) {
                        try {
                            int code = enc.startsWith("#x") || enc.startsWith("#X")
                                    ? Integer.parseInt(enc.substring(2), 16)
                                    : Integer.parseInt(enc.substring(1));
                            yield String.valueOf((char) code);
                        } catch (NumberFormatException e) {
                            yield m.group(0);
                        }
                    }
                    yield m.group(0);
                }
            };
            m.appendReplacement(sb, Matcher.quoteReplacement(decoded));
        }
        m.appendTail(sb);
        return sb.toString();
    }
}
