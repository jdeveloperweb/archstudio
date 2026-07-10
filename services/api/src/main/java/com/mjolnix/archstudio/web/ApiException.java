package com.mjolnix.archstudio.web;

import org.springframework.http.HttpStatus;

/** Application error carrying a stable machine code + HTTP status + human message. */
public class ApiException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public ApiException(String code, HttpStatus status, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String getCode() { return code; }
    public HttpStatus getStatus() { return status; }
}
