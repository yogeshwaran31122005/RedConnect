package com.college.redconnect;

import java.net.URI;
import java.net.URISyntaxException;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RedconnectApplication {

    public static void main(String[] args) {
        normalizeRenderEnvironment();
        SpringApplication.run(RedconnectApplication.class, args);
    }

    static void normalizeRenderEnvironment() {
        String databaseUrl = firstNonBlank(
                System.getenv("DATABASE_URL"),
                System.getProperty("DATABASE_URL")
        );

        if (databaseUrl != null) {
            String normalizedDbUrl = normalizeDatabaseUrl(databaseUrl);
            if (firstNonBlank(System.getProperty("DB_URL"), System.getenv("DB_URL")) == null) {
                System.setProperty("DB_URL", normalizedDbUrl);
            }

            String[] credentials = extractCredentialsFromDatabaseUrl(databaseUrl);
            if (credentials[0] != null && firstNonBlank(System.getProperty("DB_USERNAME"), System.getenv("DB_USERNAME")) == null) {
                System.setProperty("DB_USERNAME", credentials[0]);
            }
            if (credentials[1] != null && firstNonBlank(System.getProperty("DB_PASSWORD"), System.getenv("DB_PASSWORD")) == null) {
                System.setProperty("DB_PASSWORD", credentials[1]);
            }
        }

        String dbUser = firstNonBlank(
                System.getenv("DB_USER"),
                System.getProperty("DB_USER"),
                System.getenv("DB_USERNAME"),
                System.getProperty("DB_USERNAME")
        );
        if (dbUser != null && firstNonBlank(System.getProperty("DB_USERNAME"), System.getenv("DB_USERNAME")) == null) {
            System.setProperty("DB_USERNAME", dbUser);
        }

        String dbPassword = firstNonBlank(
                System.getenv("DB_PASS"),
                System.getProperty("DB_PASS"),
                System.getenv("DB_PASSWORD"),
                System.getProperty("DB_PASSWORD")
        );
        if (dbPassword != null && firstNonBlank(System.getProperty("DB_PASSWORD"), System.getenv("DB_PASSWORD")) == null) {
            System.setProperty("DB_PASSWORD", dbPassword);
        }
    }

    private static String normalizeDatabaseUrl(String databaseUrl) {
        String value = databaseUrl.trim();
        if (value.startsWith("jdbc:")) {
            return value;
        }

        try {
            URI uri = new URI(value);
            String host = uri.getHost();
            int port = uri.getPort() == -1 ? 5432 : uri.getPort();
            String path = uri.getPath();
            if (path == null || path.isBlank()) {
                path = "/";
            }
            String normalizedPath = path.startsWith("/") ? path.substring(1) : path;
            String query = uri.getQuery() == null ? "" : uri.getQuery();
            if (!query.isEmpty() && !query.contains("sslmode=")) {
                query += "&sslmode=require";
            } else if (query.isEmpty()) {
                query = "sslmode=require";
            }
            return "jdbc:postgresql://" + host + ":" + port + "/" + normalizedPath + (query.isEmpty() ? "" : "?" + query);
        } catch (URISyntaxException e) {
            return value;
        }
    }

    private static String[] extractCredentialsFromDatabaseUrl(String databaseUrl) {
        try {
            URI uri = new URI(databaseUrl);
            String userInfo = uri.getUserInfo();
            if (userInfo == null || userInfo.isBlank()) {
                return new String[]{null, null};
            }
            String[] parts = userInfo.split("\\:", 2);
            return new String[]{parts[0], parts.length > 1 ? parts[1] : null};
        } catch (URISyntaxException e) {
            return new String[]{null, null};
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value;
            }
        }
        return null;
    }
}
