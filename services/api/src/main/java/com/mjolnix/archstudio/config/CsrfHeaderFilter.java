package com.mjolnix.archstudio.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Lightweight CSRF defense: state-changing requests under /api must carry the
 * custom header {@code X-Requested-With} (which cross-site form posts cannot set
 * without a CORS preflight we do not grant). Combined with SameSite=Lax cookies.
 */
public class CsrfHeaderFilter extends OncePerRequestFilter {

    private static final Set<String> MUTATING = Set.of("POST", "PUT", "DELETE", "PATCH");

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String path = req.getRequestURI();
        if (path.startsWith("/api/") && MUTATING.contains(req.getMethod())) {
            if (req.getHeader("X-Requested-With") == null) {
                res.setStatus(403);
                res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                res.getWriter().write("{\"error\":\"CSRF\",\"message\":\"Requisição inválida.\"}");
                return;
            }
        }
        chain.doFilter(req, res);
    }
}
