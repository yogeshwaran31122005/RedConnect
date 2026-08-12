# 🩸 RedConnect

RedConnect is a blood donation platform that connects patients with suitable blood donors. It is a Spring Boot REST API backed by **PostgreSQL** with a React (Vite) glassmorphism frontend. Every feature — registration, donor profile, blood requests, notifications and donation history — stores its rows line-by-line in PostgreSQL.

## Features

* User registration with name, blood group, phone, city, DOB and gender (stored in PostgreSQL)
* User login with email (User ID) and password
* JWT token issued on successful login
* Donor profile (name, blood group, contact, availability)
* Find blood / search donors by blood group and location
* Emergency blood requests + request status tracking
* Notifications and donation history
* Passwords never stored in plain text (BCrypt hashing)

## Technology

* **Backend:** Spring Boot 3.5 (Java 25), Spring Data JPA, Spring Security
* **Frontend:** React 19 + Vite (glassmorphism UI)
* **Database:** PostgreSQL (all data stored in tables, row per record)
* **Security:** Spring Security + JWT + BCrypt

## Folder Structure

```text
RedConnect/
│
├── backend/                          (Spring Boot REST API)
│   ├── src/main/java/com/college/redconnect/
│   │   ├── RedconnectApplication.java
│   │   ├── config/                   (SecurityConfig, JWT)
│   │   ├── controller/               (AuthController, DataController)
│   │   ├── service/                  (AuthService, DataService)
│   │   ├── repository/               (JPA repositories)
│   │   ├── model/entity/             (User, BloodRequest, Donation, Notification)
│   │   ├── dto/                      (request/response records)
│   │   └── exception/                (global error handling)
│   ├── src/main/resources/application.properties
│   ├── src/test/                     (unit + integration tests)
│   └── pom.xml
│
└── frontend/                         (React + Vite SPA)
    └── src/
        ├── pages/                    (LoginPage, RegisterPage, HomePage)
        ├── api/                      (auth.js, data.js, mock.js fallback)
        └── components/               (GlassLayout, FormField, Toast)
```

## Setup

### 1. Create the PostgreSQL database

```sql
CREATE DATABASE redconnect;
```

Set the connection details (defaults in `application.properties`):

| Env var        | Default                                |
|----------------|----------------------------------------|
| `DB_URL`       | `jdbc:postgresql://localhost:5432/redconnect` |
| `DB_USERNAME`  | `postgres`                             |
| `DB_PASSWORD`  | `postgres`                             |
| `JWT_SECRET`   | (change in production)                 |

The `users`, `blood_requests`, `donations` and `notifications` tables are created
automatically by Hibernate (`ddl-auto=update`).

### 2. Run the backend

```bash
cd backend
mvn spring-boot:run
```

API starts at <http://localhost:8080>.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at <http://localhost:5173> and proxies `/api` to the backend.

### 4. Tests

```bash
cd backend
mvn test        # runs against in-memory H2 in PostgreSQL compatibility mode
```

## API Endpoints

### Auth

| Method | Endpoint            | Description                                    |
|--------|---------------------|------------------------------------------------|
| POST   | `/api/auth/register`| Create a user (name, email, password, blood group, ...) |
| POST   | `/api/auth/login`   | Login and receive a JWT token                  |
| GET    | `/api/auth/me`      | Current user's profile (requires token)        |

### Data (all require `Authorization: Bearer <token>`)

| Method | Endpoint                 | Description                            |
|--------|--------------------------|----------------------------------------|
| GET    | `/api/data/profile`      | Get own profile                        |
| PUT    | `/api/data/profile`      | Update profile fields                  |
| GET    | `/api/data/requests`     | List own blood requests                |
| POST   | `/api/data/requests`     | Create a blood request                 |
| PATCH  | `/api/data/requests/{id}/status` | Update request status           |
| GET    | `/api/data/donations`    | List own donation history              |
| POST   | `/api/data/donations`    | Record a donation                      |
| GET    | `/api/data/notifications`| List own notifications                 |
| POST   | `/api/data/notifications`| Create a notification                  |
| PATCH  | `/api/data/notifications/read` | Mark all notifications as read   |

### Example — Register

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@example.com","password":"password123","bloodGroup":"O+","phone":"+91 98410 00000","city":"Chennai"}'
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
    "email": "john@example.com",
    "fullName": "John Doe",
    "bloodGroup": "O+",
    "phone": "+91 98410 00000",
    "city": "Chennai"
  }
}
```

## System Modules

```text
RedConnect
│
├── Login / Register        (implemented - PostgreSQL backed)
├── Donor                   (register, profile, availability)
├── Patient                 (blood request, search blood, find donor)
├── Matching                (blood group + location matching)
└── Admin                   (manage donors, patients, requests)
```

> Donor search and blood-bank availability are reference datasets rendered from the frontend; profile, requests, notifications and donation history are fully persisted in PostgreSQL.

## Author

**Yogeshwaran S**