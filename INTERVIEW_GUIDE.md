# 🎯 NexusAI RAG Chatbot — Technical Interview & Project Presentation Guide

This guide equips you with everything you need to confidently present, explain, and defend **NexusAI RAG Chatbot** in technical job interviews, system design discussions, resume deep dives, and live coding demos.

---

## ⚡ 1. The 30-Second Elevator Pitch

> *"I built **NexusAI**, an enterprise-grade AI Knowledge Workspace and Retrieval-Augmented Generation (RAG) assistant. It allows users to upload unstructured documents—like PDFs, TXT, or Word files—and query them in natural language.*
>
> *Unlike standard LLMs that hallucinate, NexusAI extracts document text, chunks it page-by-page, generates 3072-dimensional vector embeddings using Google Gemini, and performs high-speed cosine similarity search in a FAISS vector database. It returns strictly grounded answers streamed live in real-time via Server-Sent Events (SSE), complete with exact page-number source citations."*

---

## 🏗️ 2. The 2-Minute In-Depth Technical Architecture Overview

When interviewers ask: *"Can you walk me through the system architecture?"*

### Architecture Pitch Points:
1. **Decoupled Modern Stack:**
   * **Frontend:** Built with **Next.js 15 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, and **WebGL/Three.js** for an interactive 3D mascot UI, deployed on **Vercel CDN**.
   * **Backend:** Built with **FastAPI (Python 3.11+)**, asynchronous **Uvicorn**, and **Pydantic v2** for strict data validation, deployed as a containerized Web Service on **Render**.

2. **AI & Vector Pipeline:**
   * **Embedding Engine:** Converts document chunks into high-density **`3072-dimensional`** vectors using `models/gemini-embedding-001` (`text-embedding-004`).
   * **Dual Vector Database Provider:** Local CPU **FAISS** index for zero-cost instant retrieval, with a factory pattern enabling seamless fallback to managed cloud **Pinecone**.
   * **LLM Answer Engine:** Powered by **Google Gemini 2.5 Flash** with custom prompt injection defenses and strict grounding system instructions.

3. **Multi-Tenant Security & Isolation:**
   * Uses an `X-User-ID` session middleware header to ensure micro-tenant data isolation. Vector search candidate matches are filtered by `user_id`, guaranteeing **zero cross-tenant data leakage**.

---

## 🧠 3. Key Engineering Challenges Solved (Your "Star" Stories)

Use these stories when asked: *"What was the hardest technical challenge you faced?"*

### Challenge 1: Eliminating LLM Hallucinations & Ensuring Factuality
* **Problem:** Off-the-shelf LLMs tend to invent facts or use pre-trained knowledge instead of sticking to user documents.
* **Solution:** Designed a **strict two-pass RAG prompt wrapper**. First, candidate chunks are scored; any chunk with similarity `< 0.30` is filtered out. Second, context is isolated inside strict XML `<context>` tags with system instructions forcing the LLM to return *"I cannot determine the answer from the uploaded documents"* if facts are missing.

### Challenge 2: Reducing Latency for Instant User Feedback
* **Problem:** Synchronous LLM generation introduced a 4-to-6 second lag before users saw any response.
* **Solution:** Re-architected the generation endpoint to use **Server-Sent Events (SSE)** (`POST /api/v1/ask/stream`). The backend streams Gemini tokens token-by-token live to the Next.js frontend with typethrough animations, reducing perceived latency from 6s to **under 300ms**.

### Challenge 3: Multi-Tenant Vector Workspace Isolation
* **Problem:** In shared vector indexes, User A could potentially query vectors belonging to User B.
* **Solution:** Implemented client-side session identity generation (`localStorage` + `X-User-ID` header) paired with backend similarity search filtering (`doc.user_id == requesting_user_id`). Candidate vectors are filtered *before* being scored.

---

## 🔄 4. Step-by-Step RAG Pipeline Execution Flow

If asked: *"Walk me through what happens when a user types a question."*

```text
User Query ➔ [1. X-User-ID Middleware] ➔ [2. Gemini Embedding API (3072d)] ➔ [3. FAISS Cosine Similarity Search (Top-K=5)] ➔ [4. Relevance Score Filtering (>= 0.30)] ➔ [5. Grounded Prompt Assembly] ➔ [6. Gemini 2.5 Flash LLM] ➔ [7. Real-Time SSE Token Stream + Source Citations UI]
```

1. **Query Ingestion:** User sends a query string (e.g., *"What are the project specs?"*).
2. **Session Scoping:** Middleware intercepts request and attaches the user's `X-User-ID`.
3. **Vector Embedding:** The query is converted into a 3072-dimensional vector by `text-embedding-004`.
4. **FAISS Search:** The vector engine computes Cosine Similarity against all indexed document vectors for that user ID, returning Top-5 matching text chunks.
5. **Relevance Thresholding:** Chunks below `0.30` similarity are discarded to eliminate noise.
6. **Grounded Synthesis:** The remaining chunks are packaged into a grounded prompt for `gemini-2.5-flash`.
7. **Token Streaming:** Answer tokens are streamed live over SSE to the frontend, displaying source filename and page numbers.

---

## ❓ 5. Top 10 Technical Interview Questions & Winning Answers

### Q1: Why did you choose FAISS over Pinecone for the vector database?
> **Answer:** *"I implemented a Factory Pattern (`VectorStoreFactory`) supporting both. FAISS runs locally in RAM/CPU, providing zero-latency vector searches at $0 infrastructure cost, which is ideal for fast local execution and unit testing. Pinecone is integrated as a cloud provider toggle when horizontal scaling across distributed nodes is required."*

### Q2: How do you handle large documents that exceed context limits?
> **Answer:** *"I used page-aware chunking via `RecursiveCharacterTextSplitter` with a chunk size of 1,000 characters and 150-character overlap. Overlap preserves semantic continuity between chunk boundaries, and page numbers are stored in metadata for precise source citation."*

### Q3: How do you handle casual greetings vs. document queries?
> **Answer:** *"I implemented a intent-routing helper (`is_casual_greeting()`). If a user says 'hi' or 'who are you', the system bypasses document retrieval and responds warmly as Nexus_Bot instead of incorrectly stating 'I cannot determine the answer from documents'."*

### Q4: How is security handled for file uploads?
> **Answer:** *"We enforce a 3-layer security check: extension whitelist (`.pdf`, `.txt`, `.docx`), MIME-type validation, and regex filename sanitization (`sanitize_filename()`) to prevent directory traversal (`../`) attacks. Uploaded files are processed in isolated temporary directories and cleaned up immediately in execution `finally` blocks."*

### Q5: How is code quality maintained across the repository?
> **Answer:** *"We enforce strict PEP8 compliance on the Python backend using `flake8` with a line-length limit of 88 characters. We have a suite of 57 `pytest` unit/integration tests running on every pull request via GitHub Actions CI."*

---

## 💻 6. Live Screen-Share Demo Strategy

When demonstrating the project live during an interview:

1. **Open Landing Page:** Show the 3D dark studio design at **[https://nexusai-sage-beta.vercel.app/](https://nexusai-sage-beta.vercel.app/)**.
2. **Navigate to Chat:** Click **Start Chatting** to enter `/chat`. Show the **First-Time User Onboarding Popup** (*"What should we call you?"*).
3. **Upload a Sample Document:** Click the **`+` button** to upload a PDF or TXT file live. Point out the instant FAISS vector indexing notice.
4. **Ask a Specific Question:** Type a question grounded in the uploaded file. Highlight:
   * Real-time SSE token typethrough streaming.
   * The **Grounded Answer** badge.
   * Click **"View Sources"** to open the raw vector snippet modal displaying page number and similarity score.
5. **Show Workspace Settings:** Open `/settings` to highlight telemetry metrics (Active Vector Provider, Document Count, Storage Used).

---

## 🏆 Project Summary Matrix (Quick Reference)

| Category | Specification |
| :--- | :--- |
| **Project Name** | NexusAI RAG Chatbot |
| **Frontend URL** | `https://nexusai-sage-beta.vercel.app/` |
| **Backend API URL** | `https://nexusai-1xq9.onrender.com` |
| **GitHub Repo** | `https://github.com/Ganu39/nexusAI-rag-chat-bot` |
| **LLM Model** | Google Gemini 2.5 Flash (`gemini-2.5-flash`) |
| **Embedding Model** | Gemini Embeddings (`models/gemini-embedding-001` / 3072d) |
| **Vector DB** | FAISS (Local CPU) + Pinecone (Cloud Factory) |
| **Streaming Protocol** | Server-Sent Events (SSE) |
| **Test Coverage** | 57 Pytest Tests (100% Passed) |
