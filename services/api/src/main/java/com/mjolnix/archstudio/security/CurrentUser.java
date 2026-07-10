package com.mjolnix.archstudio.security;

import com.mjolnix.archstudio.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Convenience accessor for the currently authenticated {@link AuthUser}.
 * Use inside controllers/services that require authentication.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    /**
     * @return the authenticated principal.
     * @throws ApiException {@code UNAUTHORIZED} (401) if there is no authenticated user.
     */
    public static AuthUser get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUser user) {
            return user;
        }
        throw new ApiException("UNAUTHORIZED", HttpStatus.UNAUTHORIZED, "Autenticação necessária");
    }
}
