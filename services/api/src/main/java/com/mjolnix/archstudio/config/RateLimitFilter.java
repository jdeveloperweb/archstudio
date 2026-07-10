package com.mjolnix.archstudio.config;

import com.mjolnix.archstudio.security.AuthUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/** Minimal in-memory fixed-window rate limiter for /auth (per IP) and /ai (per user/IP). */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;
    private static final int AUTH_LIMIT = 10;
    private static final int AI_LIMIT = 30;

    private final ConcurrentHashMap<String, long[]> windows = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String path = req.getRequestURI();
        String key = null;
        int limit = 0;
        if (path.startsWith("/api/v1/auth/")) {
            key = "auth:" + clientIp(req);
            limit = AUTH_LIMIT;
        } else if (path.startsWith("/api/v1/ai/")) {
            key = "ai:" + principalOrIp(req);
            limit = AI_LIMIT;
        }
        if (key != null && !allow(key, limit)) {
            res.setStatus(429);
            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
            res.getWriter().write("{\"error\":\"RATE_LIMITED\",\"message\":\"Muitas requisições. Tente novamente em instantes.\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    private boolean allow(String key, int limit) {
        long now = System.currentTimeMillis();
        long[] w = windows.computeIfAbsent(key, k -> new long[]{now, 0});
        synchronized (w) {
            if (now - w[0] >= WINDOW_MS) {
                w[0] = now;
                w[1] = 0;
            }
            w[1]++;
            return w[1] <= limit;
        }
    }

    private String principalOrIp(HttpServletRequest req) {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getPrincipal() instanceof AuthUser u) {
            return u.id().toString();
        }
        return clientIp(req);
    }

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
