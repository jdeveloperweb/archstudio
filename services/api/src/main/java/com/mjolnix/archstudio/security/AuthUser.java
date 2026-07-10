package com.mjolnix.archstudio.security;

import java.util.UUID;

/**
 * Authenticated principal stored in the Spring SecurityContext.
 * Derived solely from the verified JWT — no DB lookup per request.
 */
public record AuthUser(UUID id, String email) {
}
