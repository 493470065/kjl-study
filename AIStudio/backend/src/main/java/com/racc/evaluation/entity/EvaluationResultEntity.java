package com.racc.evaluation.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 评估结果表。
 */
@Entity
@Table(name = "evaluation_results")
public class EvaluationResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "evaluator_name", nullable = false, length = 64)
    private String evaluatorName;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String answer;

    @Column(nullable = false)
    private Double score;

    @Column(nullable = false)
    private Double threshold = 0.5;

    @Column(nullable = false)
    private Boolean passed = false;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String explanation;

    @Column(columnDefinition = "LONGTEXT")
    private String details;

    @Column(columnDefinition = "LONGTEXT")
    private String context;

    @Column(name = "ground_truth", columnDefinition = "LONGTEXT")
    private String groundTruth;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEvaluatorName() { return evaluatorName; }
    public void setEvaluatorName(String evaluatorName) { this.evaluatorName = evaluatorName; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getThreshold() { return threshold; }
    public void setThreshold(Double threshold) { this.threshold = threshold; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }

    public String getGroundTruth() { return groundTruth; }
    public void setGroundTruth(String groundTruth) { this.groundTruth = groundTruth; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}