package com.mjolnix.archstudio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Typed access to the {@code app.*} configuration block (see application.yml).
 * Bound via constructor binding; registered through {@code @EnableConfigurationProperties}
 * on the application class.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String jwtSecret,
        String encKey,
        String publicUrl,
        boolean cookieSecure,
        String cookieName,
        int jwtTtlDays,
        boolean mailEnabled,
        String mailFrom
) {
}
