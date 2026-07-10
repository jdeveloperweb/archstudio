package com.mjolnix.archstudio.auth;

import com.mjolnix.archstudio.config.AppProperties;
import com.mjolnix.archstudio.domain.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends verification / reset emails. When {@code app.mail-enabled=false} the
 * links are logged at INFO (bootstrap/dev), so the flow is fully testable
 * without SMTP credentials.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final AppProperties props;
    private final JavaMailSender sender;

    public MailService(AppProperties props, JavaMailSender sender) {
        this.props = props;
        this.sender = sender;
    }

    public void sendVerification(User user, String link) {
        String subject = "Confirme seu e-mail — ArchStudio";
        String body = "Olá " + user.getName() + ",\n\n"
                + "Confirme seu e-mail para ativar sua conta no ArchStudio:\n" + link
                + "\n\nSe você não criou esta conta, ignore este e-mail.";
        send(user.getEmail(), subject, body, "VERIFY");
    }

    public void sendPasswordReset(User user, String link) {
        String subject = "Redefinir senha — ArchStudio";
        String body = "Olá " + user.getName() + ",\n\n"
                + "Use o link abaixo para redefinir sua senha (válido por 2 horas):\n" + link
                + "\n\nSe não foi você, ignore este e-mail.";
        send(user.getEmail(), subject, body, "RESET");
    }

    private void send(String to, String subject, String body, String kind) {
        if (!props.mailEnabled()) {
            log.info("[MAIL:{}] to={} link/body-below:\n{}", kind, to, body);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(props.mailFrom());
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            sender.send(msg);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail para {}: {}", to, e.getMessage());
        }
    }
}
