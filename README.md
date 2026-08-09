# 🩸 RedConnect

RedConnect is a simple Java-based blood donation system that connects patients with suitable blood donors through blood group and location matching.

## Features

* Donor Registration
* Patient Blood Request
* Blood Group Matching
* Location Matching
* Donor Management
* Patient Management
* Admin Management

## Technology

* Java
* SQLite
* JDBC

## Project Structure

```text
RedConnect/
│
├── src/
│   ├── Main.java
│   ├── Login.java
│   ├── Register.java
│   ├── Donor.java
│   ├── Patient.java
│   ├── Admin.java
│   ├── BloodRequest.java
│   ├── Matching.java
│   └── Database.java
│
├── database/
│   └── redconnect.db
│
├── README.md
└── .gitignore
```

## System Modules

```text
RedConnect
│
├── Donor
│   ├── Register
│   ├── Login
│   ├── Profile
│   └── Availability
│
├── Patient
│   ├── Blood Request
│   ├── Search Blood
│   └── Find Donor
│
├── Matching
│   ├── Blood Group Matching
│   └── Location Matching
│
└── Admin
    ├── Manage Donors
    ├── Manage Patients
    └── Manage Requests
```

## Project Goal

To help patients quickly find suitable blood donors during emergency situations.

## Author

**Yogeshwaran S**
