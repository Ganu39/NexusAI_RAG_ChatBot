# NexusAI RAG Chatbot 🧠⚡

> **Enterprise AI Knowledge Workspace & RAG Chatbot powered by Retrieval-Augmented Generation**

[![Version](https://img.shields.io/badge/Version-v1.4.0-indigo.svg)](https://github.com/Ganu39/nexusAI-rag-chat-bot/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Production Frontend](https://img.shields.io/badge/Frontend-Next.js_15-black?logo=next.js)](https://nexusai-sage-beta.vercel.app/)
[![Production Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://nexusai-1xq9.onrender.com)
[![Model](https://img.shields.io/badge/Model-Gemini_2.5_Flash-4285F4?logo=google)](https://aistudio.google.com/)

**Stop searching documents. Start asking questions.**  
*Upload PDF, TXT, or DOCX files ➔ Instant FAISS Vector Indexing ➔ Real-Time Token Streaming with Source Citations.*

---

### 📍 Quick Navigation

[Getting Started](#-quick-start-local-setup) · [How It Works](#-end-to-end-rag-pipeline-workflow) · [Features](#-key-features) · [Tech Stack](#-technology-stack) · [Live Demo](https://nexusai-sage-beta.vercel.app/)

---

## 🔄 End-to-End RAG Pipeline Workflow

NexusAI processes every document Q&A query through a structured 6-stage pipeline:

```mermaid
flowchart TD
    A["👤 User Input Query<br/>(e.g., 'What are the specs?')"] --> B["1️⃣ Query Ingest & Session Scoping<br/>(Attaches X-User-ID context & sanitizes input)"]
    B --> C["2️⃣ Embedding Generation<br/>(Gemini text-embedding-004 ➔ 3072d Vector)"]
    C --> D["3️⃣ Vector Similarity Search<br/>(FAISS / Pinecone Database ➔ Top-K Chunks, default k=5)"]
    D --> E["4️⃣ Relevance Filtering & Context Isolation<br/>(Filters low-scoring chunks & formats prompt)"]
    E --> F["5️⃣ Gemini 2.5 Flash LLM Generation<br/>(Strictly grounded system instructions)"]
    F --> G["6️⃣ SSE Token Streaming & Citation Attribution<br/>(Streams answer + attaches source badges)"]
```

### Execution Stage Matrix

| Stage # | Pipeline Phase | Technical Operation | Output / Result |
| :---: | :--- | :--- | :--- |
| **1** | **Query Ingest** | Validates query text, scopes request to user session (`X-User-ID`), and routes casual greetings vs. document queries. | Clean query string |
| **2** | **Vector Embedding** | Passes query to Google Gemini Embedding API (`text-embedding-004`) to convert text into semantic numerical vectors. | `3072-dimensional` vector array |
| **3** | **FAISS / Pinecone Search** | Performs high-speed Cosine Similarity search across document chunks stored in FAISS / Pinecone vector index. | Top-K (e.g. 5) most relevant document chunks |
| **4** | **Context Building** | Filters out weak matches (similarity < 0.30), formats text chunks into structured context blocks with filename & page numbers. | Isolated document context payload |
| **5** | **Gemini 2.5 Flash** | Sends isolated context + strict grounding prompt + user question to `gemini-2.5-flash`. | Streamed response tokens |
| **6** | **Citations & UI** | Streams tokens live via Server-Sent Events (SSE), marks response as **Grounded Answer**, and attaches clickable source citation cards. | Formatted answer + source chips |

---

## 🌟 Key Features

* **3D Interactive Mascot (`Nexus_Bot`)** — WebGL-powered 3D robot mascot avatar with dark-mode obsidian glassmorphism UI.
* **First-Time User Onboarding Popup** — Interactive *"What should we call you?"* modal with persistent user identity memory.
* **Grounded Answer Generation** — Answers derived strictly from uploaded documents with zero speculation.
* **Spacious Markdown Formatting** — Formatted bullet lists, cyan headers, and inline skill badges.
* **Real-Time Token Streaming (SSE)** — Fast typethrough streaming powered by Server-Sent Events.
* **Multi-Format Extraction** — Full support for PDF, TXT, and DOCX document formats with page-number tracking.
* **Dual Vector Database Engine** — Local CPU **FAISS** index by default, with optional cloud **Pinecone** integration.
* **Workspace Data Isolation** — `X-User-ID` session header ensuring zero cross-tenant data leakage between users.
* **Interactive Source Citations** — Clickable citation badges with raw text snippet modal inspection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend API** | FastAPI, Python 3.11+, Pydantic v2, Uvicorn |
| **AI & RAG** | Google Gemini (`gemini-2.5-flash`), Gemini Embeddings (`text-embedding-004`), FAISS, Pinecone |
| **Deployments** | Vercel (Frontend), Render (Backend), GitHub Actions CI |

---

## 🚀 Quick Start (Local Setup)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

<p align="center">Built with ❤️ by the NexusAI Team</p>
