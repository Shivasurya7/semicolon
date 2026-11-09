package com.semicolan.api.config;

import java.time.Clock;
import java.time.ZoneOffset;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The single injectable {@link Clock}. Code never calls {@code Instant.now()} or
 * {@code LocalDateTime.now()} without it, so tests can move time instead of sleeping.
 */
@Configuration(proxyBeanMethods = false)
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.tickMillis(ZoneOffset.UTC);
    }
}
