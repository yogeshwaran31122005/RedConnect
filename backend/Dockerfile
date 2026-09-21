# RedConnect backend - Render Docker build
# NOTE: pom.xml uses Java 25, so both stages use Temurin 25 (not 17).
# This repo has no mvnw wrapper, so we use `mvn` from the Maven image.

# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-25 AS build

WORKDIR /app

# Cache dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Then build
COPY src src
RUN mvn clean package -DskipTests -B

# ---------- Run stage ----------
FROM eclipse-temurin:25-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Render injects $PORT (default 10000). Spring reads it via server.port=${PORT:...}
EXPOSE 10000

ENTRYPOINT ["java", "-jar", "app.jar"]
