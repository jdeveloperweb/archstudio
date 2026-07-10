package com.mjolnix.archstudio.config;

import com.mjolnix.archstudio.security.AuthUser;
import com.mjolnix.archstudio.security.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/** Reads the session cookie, validates the JWT and populates the SecurityContext. Never blocks. */
public class JwtCookieAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final String cookieName;

    public JwtCookieAuthFilter(JwtService jwt, AppProperties props) {
        this.jwt = jwt;
        this.cookieName = props.cookieName();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String token = readCookie(req);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims c = jwt.parse(token);
                AuthUser user = new AuthUser(UUID.fromString(c.getSubject()), c.get("email", String.class));
                var auth = new UsernamePasswordAuthenticationToken(user, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ignored) {
                // invalid/expired token -> stay anonymous
            }
        }
        chain.doFilter(req, res);
    }

    private String readCookie(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie c : cookies) {
            if (cookieName.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}
