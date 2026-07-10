package com.mjolnix.archstudio.web;

import org.springframework.http.ResponseCookie;

import java.time.Duration;

/** Builds the session cookie (httpOnly, SameSite=Lax, path=/). */
public final class CookieUtil {
    private CookieUtil() {}

    public static ResponseCookie build(String name, String value, int maxAgeDays, boolean secure) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(maxAgeDays))
                .build();
    }

    public static ResponseCookie clear(String name, boolean secure) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }
}
