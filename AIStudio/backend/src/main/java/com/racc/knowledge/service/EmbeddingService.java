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
 * 优先使用 Spring AI 注入的 EmbeddingModel（配置了 embedding 端点即远程向量化）；
 * 未配置或调用失败时，自动降级为「本地特征哈希向量化」——字符 n-gram 哈希到固定维度，
 * 无任何外部依赖，保证平台在「无 LLM / 网关无 embedding 端点」环境下向量检索始终可用。
 */
@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    /** 本地向量化维度（所有本地向量统一此维度，保证余弦可比） */
    public static final int LOCAL_DIM = 256;

    private final ObjectProvider<EmbeddingModel> embeddingModelProvider;

    public EmbeddingService(ObjectProvider<EmbeddingModel> embeddingModelProvider) {
        this.embeddingModelProvider = embeddingModelProvider;
    }

    /** 是否具备远程向量化能力（已注入可用的 EmbeddingModel） */
    public boolean hasRemoteModel() {
        return embeddingModelProvider.getIfAvailable() != null;
    }

    /** 向量检索是否可用：远程模型或本地兜底任一存在即 true（本地兜底恒可用） */
    public boolean isAvailable() {
        return true;
    }

    /** 当前向量化来源描述（供知识库状态展示） */
    public String providerName() {
        return hasRemoteModel() ? "远程模型" : "本地向量化";
    }

    /**
     * 将文本转为向量。优先远程模型，失败或未配置时本地兜底。
     */
    public float[] embed(String text) {
        if (text == null || text.isBlank()) return null;
        EmbeddingModel model = embeddingModelProvider.getIfAvailable();
        if (model != null) {
            try {
                float[] vector = model.embed(text);
                if (vector != null && vector.length > 0) return vector;
            } catch (Exception e) {
                log.warn("远程文本向量化失败，降级本地向量化：{}", e.getMessage());
            }
        }
        return localEmbed(text);
    }

    /**
     * 本地向量化：字符 unigram + bigram 特征哈希（hashing trick，带符号位抑制碰撞偏移），
     * TF 加权后 L2 归一化。中文 bigram 区分度好，余弦相似度对近义/包含关系有合理的排序能力。
     */
    public static float[] localEmbed(String text) {
        if (text == null || text.isBlank()) return null;
        String t = text.toLowerCase().replaceAll("\\s+", " ");
        float[] vec = new float[LOCAL_DIM];
        for (int i = 0; i < t.length(); i++) {
            addFeature(vec, t.charAt(i), 1.0f);
            if (i + 1 < t.length()) {
                addFeature(vec, t.charAt(i), t.charAt(i + 1), 1.6f);
            }
        }
        double norm = 0;
        for (float v : vec) norm += v * v;
        if (norm > 0) {
            float inv = (float) (1.0 / Math.sqrt(norm));
            for (int i = 0; i < LOCAL_DIM; i++) vec[i] *= inv;
        }
        return vec;
    }

    /** 单字特征 */
    private static void addFeature(float[] vec, char c, float weight) {
        int h = c * 31 + 7;
        vec[Math.floorMod(h, LOCAL_DIM)] += signOf(h) * weight;
    }

    /** 二元组特征（char bigram） */
    private static void addFeature(float[] vec, char a, char b, float weight) {
        int h = a * 1315423911 + b * 31 + 17;
        vec[Math.floorMod(h, LOCAL_DIM)] += signOf(h) * weight;
    }

    /** 由哈希值派生稳定符号位，减少特征碰撞带来的向量偏移 */
    private static float signOf(int h) {
        return ((h >>> 16) & 1) == 0 ? 1f : -1f;
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
