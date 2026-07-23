package com.mjolnix.archstudio.collab;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

/**
 * Registers the collaboration WebSocket at {@code /ws/collab}. Origins are open
 * because the endpoint is gated by the invite token (validated on handshake) and,
 * in production, everything is same-origin behind nginx.
 */
@Configuration
@EnableWebSocket
public class CollabWebSocketConfig implements WebSocketConfigurer {

    private final CollabHandler handler;

    public CollabWebSocketConfig(CollabHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/collab").setAllowedOrigins("*");
    }

    /** Diagrams can be large — raise the text frame limit well above the default 8 KB. */
    @Bean
    public ServletServerContainerFactoryBean webSocketContainer() {
        ServletServerContainerFactoryBean c = new ServletServerContainerFactoryBean();
        c.setMaxTextMessageBufferSize(1024 * 1024); // 1 MB
        c.setMaxSessionIdleTimeout(3_600_000L);     // 1 h idle
        return c;
    }
}
