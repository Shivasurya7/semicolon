package com.semicolan.api.config;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;

/**
 * Fails startup, naming every missing key, when a required setting is absent
 * (Implementation_Plan 0.1). Spring Boot's binder would otherwise pass an unresolved
 * {@code ${DB_URL}} through as literal text and fail later with an unrelated message.
 *
 * <p>Each later phase adds its required keys to {@link #REQUIRED} and to {@code .env.example}.
 */
public class RequiredConfigurationCheck implements EnvironmentPostProcessor {

    /** Spring property → the environment variable that normally supplies it. */
    static final Map<String, String> REQUIRED = Map.of(
            "spring.datasource.url", "DB_URL",
            "spring.datasource.username", "DB_USER",
            "spring.datasource.password", "DB_PASSWORD");

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        List<String> missing = new ArrayList<>();
        REQUIRED.forEach((property, envKey) -> {
            String value;
            try {
                value = environment.getProperty(property);
            } catch (IllegalArgumentException unresolvedPlaceholder) {
                value = null;
            }
            if (value == null || value.isBlank()) {
                missing.add(envKey + " (" + property + ")");
            }
        });
        if (!missing.isEmpty()) {
            missing.sort(null);
            throw new IllegalStateException("Missing required configuration: " + String.join(", ", missing));
        }
    }
}
