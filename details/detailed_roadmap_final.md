# The Tracient Project: A Refined & Actionable Roadmap

This document outlines a comprehensive, step-by-step roadmap for developing the Tracient system. The plan is structured into three main phases, prioritizing a rapid, functional prototype first, followed by a feature-rich MVP, and finally a production-ready application.

---

## Phase 1: Foundation & Local Proof of Concept (PoC)
**Timeline:** Months 1-2

**Primary Goal:** To build a fully local, functional prototype that validates the core concept: a wage can be recorded on a blockchain, and an AI model can classify income based on that data.

**Key Outcome:** A single, integrated web application running on your local machine where you can:
1.  Input a wage payment.
2.  See the transaction recorded on a local Hyperledger Fabric network.
3.  Receive an immediate BPL/APL classification from a basic AI model.

### **Step-by-Step Tasks for Phase 1:**

1.  **Environment Setup:**
    *   **Action:** Install all prerequisites: Go (1.20+), Node.js (18+), Python (3.9+), Docker, Docker Compose, and Git.
    *   **Action:** Create the project directory structure: `blockchain/`, `ai-model/`, `backend/`, `frontend/`.

2.  **Launch Hyperledger Fabric Test Network:**
    *   **Action:** Download the official Fabric binaries and samples into the `blockchain` directory.
    *   **Action:** Use the provided scripts to start the `test-network`. This gives you a running blockchain without having to configure it from scratch.
    *   **Deliverable:** A running local Fabric network with one channel ("mychannel").

3.  **Deploy & Interact with Sample Chaincode:**
    *   **Action:** Deploy the sample `asset-transfer-basic` chaincode (available in Go) onto your test network.
    *   **Action:** Use the command line to learn how to invoke its functions (e.g., `CreateAsset`, `ReadAsset`). This teaches you the fundamentals of chaincode interaction.

4.  **Develop a Basic AI/ML Model:**
    *   **Action:** In the `ai-model` folder, create a simple Python script using `scikit-learn`.
    *   **Model:** Implement a basic Logistic Regression or a simple rule-based classifier that takes an income amount and outputs a "BPL" or "APL" status based on a fixed threshold.
    *   **Action:** Expose this model via a simple Flask API so it can be called over HTTP.

5.  **Develop a Minimal Backend API:**
    *   **Action:** In the `backend` folder, set up a Node.js server with Express.js.
    *   **Endpoints:**
        *   `POST /record-wage`: This endpoint will receive wage data from the frontend.
        *   It will then call the Fabric chaincode to record the wage.
        *   After a successful recording, it will call the AI model's API to get the BPL/APL status.
        *   It will return the result to the frontend.

6.  **Develop a Simple Frontend UI:**
    *   **Action:** In the `frontend` folder, create a basic React application.
    *   **Components:**
        *   A simple form to input `workerID`, `employerID`, and `amount`.
        *   A "Submit" button that sends the data to the backend API.
        *   A display area to show the response (e.g., "Wage recorded successfully. Status: APL").

7.  **Local Integration:**
    *   **Action:** Ensure all components (Frontend -> Backend -> Blockchain & AI) are communicating correctly on your local machine.

---

## Phase 2: MVP Development & Integration
**Timeline:** Months 3-4

**Primary Goal:** To evolve the PoC into a structured Minimum Viable Product (MVP) with distinct, containerized services and more realistic features.

**Key Outcome:** A multi-container application managed by Docker Compose. It will feature custom-built chaincode and basic user role distinctions.

### **Step-by-Step Tasks for Phase 2:**

1.  **Containerize All Services:**
    *   **Action:** Create a `Dockerfile` for the frontend, backend, and AI model.
    *   **Action:** Create a `docker-compose.yml` file at the project root to orchestrate all services, including the Hyperledger Fabric network.

2.  **Write Custom Chaincode in Go:**
    *   **Action:** In the `blockchain` folder, develop your own chaincode based on the roadmap.
    *   **Functions:**
        *   `recordWage(workerID, employerID, amount, timestamp)`
        *   `queryWageHistory(workerID)`
    *   **Action:** Deploy this custom chaincode to your Fabric network.

3.  **Implement User Roles & Basic Authentication:**
    *   **Action:** Enhance the backend to include basic logic for "workers" and "employers". This is not a full identity system yet, but a simulation of different roles.
    *   **Action:** Add simple API key or JWT-based authentication to protect endpoints.

4.  **Enhance the AI Model:**
    *   **Action:** Improve the model to handle more features, such as `jobType` or `seasonality`.
    *   **Model:** Move from a simple classifier to a Linear Regression model to *estimate* annual income, then classify based on that estimate.

5.  **Build Out Frontend Dashboards:**
    *   **Action:** Create separate views/dashboards for the worker and the employer.
    *   **Worker View:** Can see their own wage history.
    *   **Employer View:** Can submit wages for their workers.

---

## Phase 3: Security, Scalability & Deployment Prep
**Timeline:** Months 5-6

**Primary Goal:** To harden the MVP by implementing critical security, privacy, and testing features, making it ready for a controlled pilot deployment.

**Key Outcome:** A secure, robust, and well-documented application ready for deployment on a cloud provider like AWS or GCP.

### **Step-by-Step Tasks for Phase 3:**

1.  **Implement Privacy-Preserving Features:**
    *   **Action:** Do not store raw IDs (Aadhaar/PAN) on the blockchain. Instead, use a secure hashing algorithm (like SHA-256) on the backend before sending data to the chaincode.
    *   **Action:** Explore concepts of Zero-Knowledge Proofs (ZKPs) for future implementation, where status can be proven without revealing raw income data.

2.  **Conduct Security & Performance Testing:**
    *   **Action:** Write unit tests for the backend API, AI model, and chaincode functions.
    *   **Action:** Write integration tests to ensure the entire workflow is correct.
    *   **Action:** Perform basic stress testing to see how the system handles concurrent requests.

3.  **Refine the Blockchain Network:**
    *   **Action:** Move from the `test-network` to a more customized network topology. Define your own organizations (e.g., `GovOrg`, `EmployerOrg`).
    *   **Action:** Implement proper access control policies in the chaincode (e.g., only registered employers can call `recordWage`).

4.  **Prepare for Cloud Deployment:**
    *   **Action:** Research deploying Hyperledger Fabric on cloud services (e.g., using Kubernetes).
    *   **Action:** Ensure your Docker setup is environment-agnostic (uses environment variables for configuration).

5.  **Create Comprehensive Documentation:**
    *   **Action:** Write a `README.md` for each service.
    *   **Action:** Document the API endpoints.
    *   **Action:** Create a final system architecture diagram.
