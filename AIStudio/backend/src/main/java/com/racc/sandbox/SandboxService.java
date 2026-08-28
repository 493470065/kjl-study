package com.racc.sandbox;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 沙箱服务。
 * 当前为占位实现，默认关闭。
 */
@Service
public class SandboxService {

    private final boolean sandboxEnabled;

    public SandboxService(@Value("${racc.sandbox.enabled:false}") boolean sandboxEnabled) {
        this.sandboxEnabled = sandboxEnabled;
    }

    public Map<String, Object> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("enabled", sandboxEnabled);
        return status;
    }

    public List<Map<String, Object>> listActive() {
        return Collections.emptyList();
    }

    public void destroySandbox(String taskId) {
        // 占位：实际销毁逻辑由后续实现
    }
}