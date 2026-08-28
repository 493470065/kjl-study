package com.racc.knowledge.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.Arrays;

/**
 * 文本向量化服务（语义检索的底层能力）。
 *
 * 基于 Spring AI 的 EmbeddingModel；当未配置可用的 LLM Provider（无嵌入模型）时，
 * 返回 null，上层检索自动降级为关键词检索，保证平台在「无 LLM」环境下仍可正常使用。
 */
@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    private final ObjectProvider<EmbeddingModel> embeddingModelProvider;

    public EmbeddingService(ObjectProvider<EmbeddingModel> embeddingModelProvider) {
        this.embeddingModelProvider = embeddingModelProvider;
    }

    /** 是否具备向量化能力（已注入可用的 EmbeddingModel） */
    public boolean isAvailable() {
        return embeddingModelProvider.getIfAvailable() != null;
    }

    /**
     * 将文本转为向量。失败或未配置时返回 null。
     */
    public float[] embed(String text) {
        if (text == null || text.isBlank()) return null;
        EmbeddingModel model = embeddingModelProvider.getIfAvailable();
        if (model == null) return null;
        try {
            float[] vector = model.embed(text);
            return (vector != null && vector.length > 0) ? vector : null;
        } catch (Exception e) {
            log.warn("文本向量化失败（可能未配置嵌入模型）：{}", e.getMessage());
            return null;
        }
    }

    /**
     * 将向量序列化为 JSON 数组字符串，便于存入 SQLite TEXT 列。
     */
    public static String toJson(float[] vector) {
        if (vector == null) return null;
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(vector[i]);
        }
        sb.append(']');
        return sb.toString();
    }

    /**
     * 将 JSON 数组字符串解析回向量。
     */
    public static float[] fromJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            String inner = json.trim();
            if (inner.startsWith("[")) inner = inner.substring(1);
            if (inner.endsWith("]")) inner = inner.substring(0, inner.length() - 1);
            String[] parts = inner.split(",");
            float[] result = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                result[i] = Float.parseFloat(parts[i].trim());
            }
            return result;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 余弦相似度。任一向量为空时返回 0。
     */
    public static float cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length == 0 || a.length != b.length) return 0f;
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na == 0 || nb == 0) return 0f;
        return (float) (dot / (Math.sqrt(na) * Math.sqrt(nb)));
    }

    /** 调试用：打印向量维度和前若干维 */
    public static String describe(float[] v) {
        if (v == null) return "null";
        return "dim=" + v.length + " head=" + Arrays.toString(Arrays.copyOfRange(v, 0, Math.min(5, v.length)));
    }
}
