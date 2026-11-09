package com.semicolan.api;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Entry point of the Semicolan API.
 *
 * <p>The in-memory user that Spring Boot generates by default is excluded: authentication is
 * stateless JWT only (TRD), built in Phase 1.1.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
public class SemicolanApplication {

    public static void main(String[] args) {
        // Everything is UTC (Backend_Schema R5), even when the host is not.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(SemicolanApplication.class, args);
    }
}
