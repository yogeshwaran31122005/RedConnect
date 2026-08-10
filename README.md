# 🩸 RedConnect

RedConnect is a Java-based blood donation system that connects patients with suitable blood donors. This repository contains the **login and user registration module** — a Spring Boot REST API backed by SQLite with a glassmorphism frontend.

## Features

* User registration (email + password) — stored securely with BCrypt hashing
* User login with email (User ID) and password
* JWT token issued on successful login
* Glassmorphism login and register pages (HTML + CSS + JavaScript)
* Passwords never stored in plain text

## Technology

* **Backend:** Spring Boot 3.5 (Java 25)
* **Frontend:** HTML, CSS (glassmorphism), JavaScript
* **Database:** SQLite (file-based, no server installation needed)
* **Security:** Spring Security + JWT + BCrypt

## Folder Structure

```text
RedConnect/
│
├── src/
│   ├── main/
│   │   ├── java/com/college/redconnect/
│   │   │   ├── RedconnectApplication.java   (entry point)
│   │   │   ├── config/
│   │   │   │   └── SecurityConfig.java      (JWT + Spring Security)
│   │   │   │   └── security/
│   │   │   │       ├── JwtUtil.java         (token generation/validation)
│   │   │   │       └── JwtAuthFilter.java   (token filter)
│   │   │   ├── controller/
│   │   │   │   └── AuthController.java      (REST endpoints)
│   │   │   ├── service/
│   │   │   │   └── AuthService.java         (business logic)
│   │   │   ├── repository/
│   │   │   │   └── UserRepository.java      (Spring Data JPA)
│   │   │   ├── model/entity/
│   │   │   │   └── User.java                (JPA entity)
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   └── RegisterRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── ApiResponse.java
│   │   │   │       ├── ErrorResponse.java
│   │   │   │       └── LoginResponse.java
│   │   │   └── exception/
│   │   │       └── GlobalExceptionHandler.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/
│   │           ├── index.html        (redirects to login)
│   │           ├── login.html
│   │           ├── register.html
│   │           ├── style.css
│   │           └── script.js
│   └── test/java/com/college/redconnect/   (unit tests)
│
├── .env.example
├── pom.xml
└── README.md
```

## Setup

### 1. Run the application

```bash
mvn spring-boot:run
```

The app starts at <http://localhost:8080> and the SQLite database file (`redconnect.db`) is created automatically in the project root — **no database server or configuration needed**.

* Login page: <http://localhost:8080/login.html>
* Register page: <http://localhost:8080/register.html>

> Opening <http://localhost:8080/> redirects to the login page.
> To use a custom JWT secret, set the `JWT_SECRET` environment variable (see `.env.example`).

## API Endpoints

| Method | Endpoint            | Description                        |
|--------|---------------------|------------------------------------|
| POST   | `/api/auth/register`| Create a new user (email, password)|
| POST   | `/api/auth/login`   | Login and receive a JWT token      |

### Example — Register

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Example — Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

Successful login returns:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "id": 1,
    "email": "john@example.com"
  }
}
```

## System Modules (Roadmap)

```text
RedConnect
│
├── Login / Register          (implemented)
├── Donor                     (register, login, profile, availability)
├── Patient                   (blood request, search blood, find donor)
├── Matching                  (blood group + location matching)
└── Admin                     (manage donors, patients, requests)
```

## Author

**Yogeshwaran S**
