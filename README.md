# AI Interview Coach & Simulator

![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-E10098?style=for-the-badge&logo=langchain&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white)

A realistic, **real-time** technical interview simulator powered by **Multi-Agent Orchestration** and **WebSocket Streaming**.

This application simulates high-pressure job interviews by orchestrating a complex interaction between a **Next.js Frontend** and a **FastAPI Backend**. It leverages **WebSockets** for low-latency audio streaming, **Voice Activity Detection (VAD)** for natural turn-taking, and **LangGraph** to manage conversation state. It is designed to be modular, scalable, and fully containerized via **Docker**.

---

##  Key Technical Features

#### Tri-Modal Interview Experience
The application supports three distinct ways to practice, catering to different environments and stress levels:
1. **Text Mode:** Classic chat interface for quiet environments or focusing strictly on technical definitions.
2. **Voice-PTT (Push-to-Talk):** Uses HTTP REST. You control exactly when to record and send your audio, giving you time to think.
3. **Voice-Live (Real-Time):** Uses WebSockets and browser-based **VAD**. It listens automatically and detects when you stop speaking, creating a hands-free, zero-click conversational flow with ultra-low latency.

#### Intelligent Core
- **Context-Awareness:** The system adapts its persona based on the Job Role, Industry, and a parsed Job Description.
- **Adaptive Interview Flow (LangGraph):** Built on a state machine. The agent can clarify questions if you don't understand, rather than blindly moving to the next script line.

#### Multi-Agent Architecture
- **Interviewer Agent:** Role-plays as a hiring manager, adapting tone based on the selected industry.
- **Evaluator Agent:** A separate agent that silently analyzes the entire transcript after the interview to generate a structured scorecard.

---

## Architecture Diagram

The system operates on a Human-in-the-loop agentic workflow managed by LangGraph.

```mermaid
graph TD
    User((User)) <-->|Microphone/Speaker| Frontend[Next.js Frontend]
    
    subgraph "Real-Time Layer (WebSocket)"
        Frontend -- "Audio Stream (Bytes)" --> WS_Endpoint[FastAPI WebSocket]
        WS_Endpoint -- "VAD Signals" --> Frontend
        WS_Endpoint <-->|Stream| Brain{LLM Core}
    end

    subgraph "Logic Layer (LangGraph)"
        Brain --> Interviewer[Interviewer Agent]
        Interviewer -- "Context Update" --> Check{Analyze Intent}
        Check -- "Next Question" --> Interviewer
        Interviewer -- "Session End" --> Evaluator[Evaluator Agent]
    end

    subgraph "Audio Services"
        WS_Endpoint -- "Audio Buffer" --> Whisper[OpenAI Whisper]
        Brain -- "Text Stream" --> TTS[OpenAI TTS]
        TTS -- "Audio Stream" --> WS_Endpoint
    end
    
    Evaluator -->|JSON Report| DB[(Database/State)]
```

---

## Tech Stack

| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Infrastructure** | **Docker & Compose** | Containerization of Frontend and Backend for consistent dev/prod environments. |
| **AI & Orchestration** | **LangChain** | Core framework for managing LLM chains, prompts, and memory. |
| | **LangGraph** | Orchestrates the stateful, cyclic workflow between Interviewer and Evaluator agents. |
| | **OpenAI Whisper** | High-accuracy Speech-to-Text (STT) model for transcribing candidate audio. |
| | **Google Gemini** | The core "Brain" (LLM) responsible for generating context-aware questions and evaluation reports. |
| | **OpenAI TTS** | Text-to-Speech engine for generating natural-sounding interviewer voice. |
| **Backend** | **FastAPI** | High-performance, async Python framework for serving REST endpoints. |
| | **Uvicorn** | The ASGI server running the FastAPI application. |
| | **Pydantic** | Enforces strict data validation and ensures structured JSON outputs for the UI. |
| **Frontend** | **Next.js 14** | React framework (App Router) for building the interactive UI. |
| | **Axios** | Handling HTTP requests, optimized for multipart audio uploads. |
| | **TypeScript** | Ensures type safety for component props and API responses. |
| | **Tailwind CSS** | Utility-first CSS framework for rapid and responsive UI styling. |
| **Communication** | **WebSockets & REST** | Hybrid API approach for different interaction modes. |
| | **VAD (Voice Activity Detection)** | Handles turn-taking logic automatically in Live mode. |



---

## Installation & Setup

Prerequisites: `Docker Desktop` installed and a Google Cloud Project with Vertex AI API enabled.

**1. Clone the Repository:**

```bash
git clone https://github.com/berkyalkn/adaptive-interview-agent
cd adaptive-interview-agent
```

**2. Google Cloud Credentials:**

- Go to the Google Cloud Console > IAM & Admin > Service Accounts.

- Create a Service Account with Vertex AI User role.

- Create a new Key (JSON) and download it.

- Rename the file to `google_credentials.json` and move it into the `backend/` directory.

**3. Configure Environment:**

Create a `.env` file in the `backend/` directory with the following variables:


```bash
# OpenAI API Key (For Whisper STT & TTS)
OPENAI_API_KEY="sk-..."

# Google Cloud Configuration (Vertex AI)
GOOGLE_CLOUD_PROJECT="your-project-id"
GOOGLE_APPLICATION_CREDENTIALS="google_credentials.json"
```

- **Note:** Since we are using Docker, placing the JSON file in backend/ ensures it is mounted correctly into the container.

**4. Run with Docker:**

```bash
docker-compose up --build
```


**5. Access the Application:**

 - **Web Interface:** `http://localhost:3000`

 - **API Documentation:** ` http://localhost:8000/docs`



---


## Usage Guide

### 1. The Lobby (Configuration)
Customize your simulation before starting:
-   **Target Job Role:** Enter the specific position (e.g., *Senior Java Developer*).
-   **Industry Context:** Select the domain (e.g., *Fintech / Banking* to focus on security/transactions).
-   **Job Description (Optional):** Paste a real job listing text. The AI will parse this to ask specific questions about the requirements mentioned in the ad.
-   **Select Mode:** Choose between **Text Interview**, **Voice (Push-to-Talk)** or **Voice (Live)**.

### 2. The Interview Session
The experience adapts based on your chosen mode:

#### Text Mode (Classic)
-   **Interface:** A standard chat interface similar to messaging apps.
-   **Interaction:** Read the AI's question, type your response, and press Send.
-   **Best For:** Practicing technical definitions, coding logic, or when you are in a quiet environment and cannot speak.

#### Voice Mode (Push-to-Talk)
-   **Interface:** A specialized UI focused on audio interaction.
-   **Interaction:**
    1.  **Listen:** The AI verbally introduces itself and asks questions.
    2.  **Speak:** Click (or hold) the **Microphone Button** to record your answer.
    3.  **Response:** The system transcribes your audio, processes the answer, and responds verbally using TTS.
-   **Best For:** Simulating real interview pressure, improving fluency, and practicing spoken English.

#### Voice-Live Mode (Real-Time)
-   **Interface:** Interface: A minimal, immersive UI featuring a dynamic audio visualizer that reacts to speech, removing text distractions to focus purely on the conversation.
-   **Interaction:** A hands-free experience. The system listens automatically. When you finish your sentence, the **VAD** detects the silence and instantly streams your answer to the backend.
-   **Best For:** Simulating the exact pressure, pace, and natural flow of a real video interview (Zoom/Meet).

### 3. The Evaluation (Report Card)
Regardless of the mode, the **Evaluator Agent** analyzes the entire transcript after the final question:
-   **Score:** A 0-100 rating based on technical accuracy and communication skills.
-   **Feedback:** Detailed breakdown of **Key Strengths** and **Areas for Improvement**.
-   **Result:** A final "Hiring Recommendation" (Strong Hire / No Hire) displayed on the Feedback Card.