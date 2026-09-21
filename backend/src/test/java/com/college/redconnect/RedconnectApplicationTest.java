package com.college.redconnect;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RedconnectApplicationTest {

    @BeforeEach
    void setUp() {
        clearProperties();
    }

    @AfterEach
    void tearDown() {
        clearProperties();
    }

    @Test
    void normalizeRenderEnvironment_convertsRenderDatabaseUrlAndCredentials() {
        System.setProperty("DATABASE_URL", "postgresql://redconnect_user:secret@dpg-example:5432/redconnect");
        System.setProperty("DB_USER", "redconnect_user");
        System.setProperty("DB_PASS", "secret");

        RedconnectApplication.normalizeRenderEnvironment();

        assertEquals("jdbc:postgresql://dpg-example:5432/redconnect?sslmode=require", System.getProperty("DB_URL"));
        assertEquals("redconnect_user", System.getProperty("DB_USERNAME"));
        assertEquals("secret", System.getProperty("DB_PASSWORD"));
    }

    private void clearProperties() {
        System.clearProperty("DB_URL");
        System.clearProperty("DATABASE_URL");
        System.clearProperty("DB_USERNAME");
        System.clearProperty("DB_USER");
        System.clearProperty("DB_PASSWORD");
        System.clearProperty("DB_PASS");
    }
}
