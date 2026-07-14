package com.mjolnix.archstudio.web;

import org.springframework.http.HttpStatus;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;

/**
 * SSRF protection for user-supplied outbound URLs (the "custom" AI provider endpoint).
 * Rejects non-http(s) schemes and any host that resolves to a loopback, private,
 * link-local (incl. cloud metadata 169.254.169.254), CGNAT or reserved address.
 * Enforced both when saving settings and immediately before each outbound call
 * (defends against DNS-rebinding and values stored before this guard existed).
 */
public final class SsrfGuard {
    private SsrfGuard() {}

    public static void checkPublicHttpUrl(String url) {
        URI u;
        try {
            u = URI.create(url.trim());
        } catch (Exception e) {
            throw bad("URL do endpoint inválida.");
        }
        String scheme = u.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            throw bad("O endpoint deve usar http(s).");
        }
        String host = u.getHost();
        if (host == null || host.isBlank()) {
            throw bad("URL do endpoint sem host.");
        }
        InetAddress[] addrs;
        try {
            addrs = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw bad("Não foi possível resolver o host do endpoint.");
        }
        for (InetAddress a : addrs) {
            if (isBlocked(a)) {
                throw bad("Endereços internos/privados não são permitidos como endpoint de IA.");
            }
        }
    }

    private static boolean isBlocked(InetAddress a) {
        if (a.isLoopbackAddress() || a.isAnyLocalAddress() || a.isLinkLocalAddress()
                || a.isSiteLocalAddress() || a.isMulticastAddress()) {
            return true;
        }
        byte[] b = a.getAddress();
        if (b.length == 4) {
            int f = b[0] & 0xff, s = b[1] & 0xff;
            if (f == 0 || f == 127 || f == 10) return true;                 // this-net, loopback, private
            if (f == 172 && s >= 16 && s <= 31) return true;               // 172.16/12
            if (f == 192 && s == 168) return true;                         // 192.168/16
            if (f == 169 && s == 254) return true;                         // link-local / cloud metadata
            if (f == 100 && s >= 64 && s <= 127) return true;              // CGNAT 100.64/10
        } else if (b.length == 16) {
            if ((b[0] & 0xfe) == 0xfc) return true;                        // ULA fc00::/7
        }
        return false;
    }

    private static ApiException bad(String msg) {
        return new ApiException("BAD_ENDPOINT", HttpStatus.BAD_REQUEST, msg);
    }
}
