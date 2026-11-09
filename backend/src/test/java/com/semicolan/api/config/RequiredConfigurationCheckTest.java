package com.semicolan.api.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

class RequiredConfigurationCheckTest {

    private final RequiredConfigurationCheck check = new RequiredConfigurationCheck();

    @Test
    void namesEveryMissingKey() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("spring.datasource.url", "${DB_URL}")
                .withProperty("spring.datasource.username", "root");

        assertThatThrownBy(() -> check.postProcessEnvironment(env, new SpringApplication()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DB_URL")
                .hasMessageContaining("DB_PASSWORD")
                .hasMessageNotContaining("DB_USER");
    }

    @Test
    void passesWhenAllKeysArePresent() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("spring.datasource.url", "jdbc:mysql://localhost:3306/semicolan_mvp")
                .withProperty("spring.datasource.username", "root")
                .withProperty("spring.datasource.password", "root");

        assertThatCode(() -> check.postProcessEnvironment(env, new SpringApplication())).doesNotThrowAnyException();
    }
}
