package com.mjolnix.archstudio.security;

import com.mjolnix.archstudio.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and verifies HS256 JWTs used as the session token inside the
 * {@code as_session} cookie. The signing key is derived from
 * {@code app.jwt-secret} (must be >= 32 bytes for HS256).
 */
@Service
public class JwtService {

    private static final String CLAIM_EMAIL = "email";

    private final SecretKey key;
    private final long ttlDays;

    public JwtService(AppProperties props) {
        this.key = Keys.hmacShaKeyFor(props.jwtSecret().getBytes(StandardCharsets.UTF_8));
        this.ttlDays = props.jwtTtlDays();
    }

    /**
     * Issue a signed token for the given user. {@code sub} = user id,
     * plus an {@code email} claim. Expires {@code app.jwt-ttl-days} from now.
     */
    public String issue(UUID userId, String email) {
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofDays(ttlDays));
        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_EMAIL, email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Parse and verify a token, returning its claims.
     *
     * @throws io.jsonwebtoken.JwtException if the token is malformed, tampered or expired.
     */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
