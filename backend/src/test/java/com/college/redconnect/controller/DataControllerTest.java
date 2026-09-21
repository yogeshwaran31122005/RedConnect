package com.college.redconnect.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DataControllerTest {

    private static final String EMAIL = "data-user@example.com";
    private static final String PASSWORD = "password123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "data-user@example.com",
                                    "password": "password123"
                                }
                                """))
                .andReturn();

        if (login.getResponse().getStatus() == 401) {
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                        "fullName": "Data User",
                                        "email": "data-user@example.com",
                                        "password": "password123",
                                        "bloodGroup": "B+",
                                        "phone": "+91 98000 11111",
                                        "city": "Chennai"
                                    }
                                    """))
                    .andExpect(status().isCreated());

            login = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                        "email": "data-user@example.com",
                                        "password": "password123"
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andReturn();
        }

        JsonNode body = objectMapper.readTree(login.getResponse().getContentAsString());
        token = body.path("data").path("token").asText();
    }

    private String bearer() {
        return "Bearer " + token;
    }

    @Test
    void profile_getAndUpdateShouldPersist() throws Exception {
        mockMvc.perform(get("/api/data/profile")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(EMAIL))
                .andExpect(jsonPath("$.data.bloodGroup").value("B+"));

        mockMvc.perform(put("/api/data/profile")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "fullName": "Data User Updated",
                                    "bloodGroup": "A-",
                                    "phone": "+91 98000 22222",
                                    "city": "Mumbai"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Data User Updated"))
                .andExpect(jsonPath("$.data.bloodGroup").value("A-"))
                .andExpect(jsonPath("$.data.city").value("Mumbai"));
    }

    @Test
    void requests_crudShouldPersistForOwner() throws Exception {
        mockMvc.perform(post("/api/data/requests")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "bloodGroup": "O+",
                                    "units": 2,
                                    "urgency": "Emergency",
                                    "location": "Chennai",
                                    "hospitalName": "Apollo Hospital",
                                    "notes": "ICU patient"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        mockMvc.perform(get("/api/data/requests")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].bloodGroup").value("O+"));
    }

    @Test
    void donationsAndNotificationsShouldPersist() throws Exception {
        mockMvc.perform(post("/api/data/donations")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "bloodGroup": "B+",
                                    "units": 1,
                                    "location": "Chennai",
                                    "hospital": "Apollo Blood Bank"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/data/notifications")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "type": "info",
                                    "title": "Welcome",
                                    "message": "Your account is active."
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/data/notifications")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Welcome"));

        mockMvc.perform(patch("/api/data/notifications/read")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk());
    }

    @Test
    void dataEndpoints_shouldRequireAuth() throws Exception {
        mockMvc.perform(get("/api/data/profile"))
                .andExpect(status().isUnauthorized());
    }
}