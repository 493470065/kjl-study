package com.racc.tfs;

/** TFS 桥接业务异常：message 对用户可见，可直接透传前端 */
public class TfsBridgeException extends RuntimeException {
    public TfsBridgeException(String message) { super(message); }
    public TfsBridgeException(String message, Throwable cause) { super(message, cause); }
}
