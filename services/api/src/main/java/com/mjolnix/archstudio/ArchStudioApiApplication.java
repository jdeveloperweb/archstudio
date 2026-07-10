package com.mjolnix.archstudio;

import com.mjolnix.archstudio.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * ArchStudio SaaS API entry point.
 */
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class ArchStudioApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ArchStudioApiApplication.class, args);
    }
}
