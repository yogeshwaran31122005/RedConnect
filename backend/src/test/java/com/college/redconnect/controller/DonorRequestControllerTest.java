package com.college.redconnect.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end donor request workflow:
 * patient creates request → donor accepts/rejects via
 * PUT /api/donor-requests/{id}/accept|reject → patient sees donor details.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DonorRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private void register(String email, String password, String role) throws Exception {
        MvcResult existing = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andReturn();
        if (existing.getResponse().getStatus() == 200) {
            return;
        }
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "fullName": "Workflow User",
                                    "email": "%s",
                                    "password": "%s",
                                    "bloodGroup": "O+",
                                    "phone": "+91 98000 33333",
                                    "city": "Chennai",
                                    "role": "%s"
                                }
                                """.formatted(email, password, role)))
                .andExpect(status().isCreated());
    }

    private String login(String email, String password) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(login.getResponse().getContentAsString());
        return "Bearer " + body.path("data").path("token").asText();
    }

    private long sendDonorRequest(String patientBearer, String donorEmail) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/data/requests/to-donor")
                        .header("Authorization", patientBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"donorEmail\":\"" + donorEmail + "\",\"units\":1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.path("data").path("id").asLong();
    }

    @Test
    void donorAcceptWorkflow_shouldReturn200AndExposeDonorToPatient() throws Exception {
        String patientEmail = "workflow-patient@example.com";
        String donorEmail = "workflow-donor@example.com";
        register(patientEmail, "password123", "PATIENT");
        register(donorEmail, "password123", "DONOR");
        String patientBearer = login(patientEmail, "password123");
        String donorBearer = login(donorEmail, "password123");

        long requestId = sendDonorRequest(patientBearer, donorEmail);

        // Donor clicks AVAILABLE / ACCEPT REQUEST — must be HTTP 200, not 404
        mockMvc.perform(put("/api/donor-requests/" + requestId + "/accept")
                        .header("Authorization", donorBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.requestId").value((int) requestId));

        // Patient sees the accepted donor details (real DB data, no dummies)
        mockMvc.perform(get("/api/data/requests")
                        .header("Authorization", patientBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data[0].donorEmail").value(donorEmail))
                .andExpect(jsonPath("$.data[0].donorPhone").value("+91 98000 33333"));

        // Patient was notified about the acceptance
        mockMvc.perform(get("/api/data/notifications")
                        .header("Authorization", patientBearer))
                .andExpect(status().isOk());
    }

    @Test
    void donorRejectWorkflow_shouldReturn200WithRejected() throws Exception {
        String patientEmail = "workflow-patient2@example.com";
        String donorEmail = "workflow-donor2@example.com";
        register(patientEmail, "password123", "PATIENT");
        register(donorEmail, "password123", "DONOR");
        String patientBearer = login(patientEmail, "password123");
        String donorBearer = login(donorEmail, "password123");

        long requestId = sendDonorRequest(patientBearer, donorEmail);

        mockMvc.perform(put("/api/donor-requests/" + requestId + "/reject")
                        .header("Authorization", donorBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
    }

    @Test
    void acceptUnknownRequest_shouldReturn404() throws Exception {
        String donorEmail = "workflow-donor3@example.com";
        register(donorEmail, "password123", "DONOR");
        String donorBearer = login(donorEmail, "password123");

        mockMvc.perform(put("/api/donor-requests/999999/accept")
                        .header("Authorization", donorBearer))
                .andExpect(status().isNotFound());
    }
}
