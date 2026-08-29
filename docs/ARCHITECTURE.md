# 🏗️ NexusAI RAG Chatbot — Comprehensive System Architecture

Welcome to the technical architecture guide for **NexusAI RAG Chatbot** — an enterprise-grade AI Knowledge Workspace powered by Retrieval-Augmented Generation (RAG).

This document serves as the single source of truth for the system design, data flows, security boundaries, and includes master prompts for AI visual diagram generators alongside native, renderable Mermaid.js diagrams.

---

## 📑 Table of Contents

1. [Master Architecture Prompt for AI Generators](#-1-master-architecture-prompt-for-ai-generators)
2. [High-Level End-to-End System Architecture (Mermaid)](#-2-high-level-end-to-end-system-architecture)
3. [Document Ingestion Pipeline (Mermaid Flow)](#-3-document-ingestion-pipeline)
4. [Real-Time RAG Query & Streaming Pipeline (Mermaid Sequence)](#-4-real-time-rag-query--streaming-pipeline)
5. [Multi-Tenant Data Isolation & Security Architecture](#-5-multi-tenant-data-isolation--security-architecture)
6. [Component & Subsystem Technical Breakdown](#-6-component--subsystem-technical-breakdown)
7. [Cloud Infrastructure & Deployment Topology](#-7-cloud-infrastructure--deployment-topology)

---

## 📋 1. Master Architecture Prompt for AI Generators

> **Tip:** You can copy and paste the prompt below into AI tools (such as **ChatGPT**, **Claude**, **Eraser.io**, or **Whimsical**) to generate diagrams, whitepapers, or slide decks.

```text
Act as a Principal Cloud & AI Solutions Architect. Generate a comprehensive system architecture diagram for "NexusAI RAG Chatbot" — a production-grade, multi-tenant Retrieval-Augmented Generation (RAG) knowledge workspace.

### 🎨 Visual & Theme Guidelines:
- Style: Modern Dark Studio Glassmorphic UI (Slate #0f172a, Cyan #06b6d4, Purple #8b5cf6, Pink #ec4899, Emerald #10b981, Amber #f59e0b).
- Layout: Multi-Tiered Distributed Architecture (Client Tier -> API Gateway / Backend -> AI RAG Orchestration -> Storage Layer -> External AI Cloud).

### 🧱 Architectural Layers & Components:

1. CLIENT PRESENTATION TIER (Deployed on Vercel CDN):
   - Tech: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion.
   - Core Subsystems:
     * Interactive 3D Mascot Avatar (`Nexus_Bot` with WebGL/Three.js)
     * Knowledge Base Drawer (Upload, Process Status, Delete, Snippet Inspector)
     * Real-Time Chat Engine (Server-Sent Events streaming listener)
     * Onboarding & User Identity Manager (`localStorage` user profile & `X-User-ID`)
     * Session Storage (Client-side conversation persistence & cache clearance)

2. API GATEWAY & BACKEND TIER (FastAPI on Render Web Service):
   - Tech: FastAPI (Python 3.11+), Uvicorn Asynchronous ASGI Server, Pydantic v2.
   - Core Modules:
     * User Context Middleware (`middleware/user_context.py` enforcing `X-User-ID`)
     * File Upload Security Guard (`sanitize_filename`, MIME check, Whitelist: .pdf, .txt, .docx)
     * Intent Router (`is_casual_greeting()` bypass vs. grounded RAG query)
     * SSE Streaming Controller (`POST /api/v1/ask/stream`)
     * Document & Metrics API (`GET/DELETE /api/v1/documents`, `GET /api/v1/metrics`)

3. DOCUMENT INGESTION PIPELINE:
   - Extractor Engine: Format-aware parsers (PDF via PyPDF, TXT, DOCX via docx2txt) with exact page tracking.
   - Text Chunker: `RecursiveCharacterTextSplitter` (1,000 characters, 150-character overlap).
   - Batch Vectorizer: Google Gemini Embeddings (`models/gemini-embedding-001` / `text-embedding-004` producing 3072d vectors).
   - Vector Indexer: Metadata tagging (`user_id`, `document_id`, `page_number`, `chunk_id`).

4. RETRIEVAL-AUGMENTED GENERATION (RAG) ENGINE:
   - Query Ingestion: Attaches client session `X-User-ID`.
   - Real-Time Query Vectorizer: 3072-dimensional embedding via Gemini API.
   - Dual Vector Factory: Local CPU FAISS Index (L2-normalized Cosine) / Pinecone Cloud Serverless Index.
   - Pre-Filtering & Search: Cosine Similarity Top-K (k=5) scoped to requesting `user_id`.
   - Relevance Thresholding: Dynamic pruning discarding chunks with similarity score < 0.30.
   - Prompt Synthesis & Grounding: Isolation within `<context>` blocks + Anti-Hallucination system rules.
   - LLM Generation: Google Gemini 2.5 Flash (`gemini-2.5-flash`).
   - Output Protocol: Server-Sent Events (SSE) token typethrough stream with clickable citation sources.

5. STORAGE & INFRASTRUCTURE TIER:
   - Vector Databases: Local FAISS CPU Index (`/faiss_index/`) & Pinecone Cloud.
   - Persistent Metadata: Local JSON store on Render persistent disk (`/data/documents.json`).
   - Hosting: Vercel Global Edge CDN (Frontend) & Render Docker Web Service (Backend).
   - External Services: Google AI Studio (LLM & Embeddings API).
   - CI/CD: GitHub Actions (Flake8 linter, 57 Pytest test suite).
```

---

## 🌐 2. High-Level End-to-End System Architecture

```mermaid
flowchart TB
    %% Styling Classes
    classDef client fill:#0f172a,stroke:#06b6d4,stroke-width:2px,color:#fff;
    classDef backend fill:#0f172a,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef rag fill:#0f172a,stroke:#ec4899,stroke-width:2px,color:#fff;
    classDef ai fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef db fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef storage fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fff;

    %% Client Presentation Tier
    subgraph TIER_CLIENT ["💻 1. CLIENT TIER (Next.js 15 on Vercel CDN)"]
        direction TB
        UI_HERO["🤖 3D Mascot Avatar<br/>(WebGL / Three.js)"]:::client
        UI_CHAT["💬 RAG Chat Interface<br/>(SSE Streaming Client)"]:::client
        UI_KB["📁 Knowledge Base Drawer<br/>(Uploader & File Manager)"]:::client
        UI_CITATION["🔍 Source Citation Modal<br/>(Snippet & Score Inspector)"]:::client
        UI_STORE["🔒 Session Manager<br/>(localStorage X-User-ID)"]:::client
    end

    %% Backend API Tier
    subgraph TIER_BACKEND ["⚡ 2. API GATEWAY TIER (FastAPI on Render)"]
        direction TB
        MW_USER["🛡️ User Context Middleware<br/>(Enforces X-User-ID Isolation)"]:::backend
        SEC_FILE["🔒 File Upload & Sanitizer<br/>(Whitelist & Directory Traversal Defense)"]:::backend
        ROUTER_INTENT["🔀 Intent Classifier<br/>(Casual Greeting vs. Document Query)"]:::backend
        API_SSE["📡 SSE Streaming Engine<br/>(POST /api/v1/ask/stream)"]:::backend
        API_DOCS["📄 Document Management API<br/>(GET/DELETE /api/v1/documents, /metrics)"]:::backend
    end

    %% Ingestion & Chunking
    subgraph TIER_INGEST ["📥 3. DOCUMENT INGESTION PIPELINE"]
        direction TB
        EXTRACT["📑 Page-Aware Extractor<br/>(PDF, TXT, DOCX)"]:::rag
        CHUNKER["✂️ Recursive Text Chunker<br/>(1,000 Chars, 150 Overlap)"]:::rag
        INGEST_EMBED["⚡ Batch Embedding Engine<br/>(Gemini Embedding 001)"]:::rag
    end

    %% Retrieval & Grounding
    subgraph TIER_RAG ["🧠 4. RETRIEVAL & GROUNDING ENGINE"]
        direction TB
        QUERY_EMBED["⚡ Query Embedder<br/>(3072d Dense Vector)"]:::rag
        COSINE_SEARCH["🔍 Cosine Top-K Search<br/>(Pre-filtered by user_id, k=5)"]:::rag
        SIM_FILTER["🎯 Relevance Threshold<br/>(Score >= 0.30 Filter)"]:::rag
        PROMPT_BUILDER["🛡️ Grounded Prompt Builder<br/>(XML Context & Anti-Hallucination)"]:::rag
    end

    %% Vector Store Layer
    subgraph TIER_VECTOR ["🗄️ 5. VECTOR STORAGE LAYER"]
        direction TB
        FACTORY["🏭 VectorStoreFactory"]:::db
        FAISS_STORE["⚡ FAISS Vector Store<br/>(Local CPU / L2-Normalized)"]:::db
        PINECONE_STORE["☁️ Pinecone Serverless<br/>(Managed Cloud Vector Index)"]:::db
    end

    %% External AI Cloud
    subgraph TIER_AI ["🤖 6. GOOGLE GEMINI AI CLOUD"]
        direction TB
        API_EMBED["🌐 Google Gemini Embeddings<br/>(models/gemini-embedding-001)"]:::ai
        API_LLM["🧠 Google Gemini 2.5 Flash<br/>(gemini-2.5-flash)"]:::ai
    end

    %% Persistent Storage
    subgraph TIER_STORAGE ["💾 7. PERSISTENT STORAGE"]
        direction TB
        DOC_STORE["📄 Persistent Document Registry<br/>(/data/documents.json on Render Disk)"]:::storage
    end

    %% Edge Connections - Client to Backend
    UI_KB -->|"Multipart Upload + X-User-ID"| SEC_FILE
    UI_CHAT -->|"POST /ask/stream + X-User-ID"| MW_USER
    MW_USER --> ROUTER_INTENT

    %% Ingestion Flow
    SEC_FILE --> EXTRACT
    EXTRACT --> CHUNKER
    CHUNKER --> INGEST_EMBED
    INGEST_EMBED <-->|"Batch Embedding Request"| API_EMBED
    INGEST_EMBED -->|"Index Chunks + Metadata"| FACTORY
    SEC_FILE -->|"Register Metadata"| DOC_STORE

    %% Query Flow
    ROUTER_INTENT -->|"Casual Greeting (hi, who are you)"| API_SSE
    ROUTER_INTENT -->|"Document Query"| QUERY_EMBED
    QUERY_EMBED <-->|"Embed Query (3072d)"| API_EMBED
    QUERY_EMBED --> COSINE_SEARCH
    COSINE_SEARCH --> FACTORY
    FACTORY --> FAISS_STORE
    FACTORY --> PINECONE_STORE
    COSINE_SEARCH -->|"Candidate Chunks"| SIM_FILTER
    SIM_FILTER -->|"Relevant Grounding Context"| PROMPT_BUILDER
    PROMPT_BUILDER -->|"Strict Prompt + Context"| API_LLM
    API_LLM -->|"Live Token Stream"| API_SSE
    API_SSE -->|"SSE Chunk Stream"| UI_CHAT
    UI_CHAT -.->|"Inspect Raw Chunks"| UI_CITATION
    API_DOCS <--> DOC_STORE
```

---

## 📥 3. Document Ingestion Pipeline

When a user uploads a PDF, TXT, or DOCX document:

```mermaid
flowchart TD
    classDef step fill:#0f172a,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef decision fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef success fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef error fill:#0f172a,stroke:#ef4444,stroke-width:2px,color:#fff;

    A["User Uploads Document (.pdf, .txt, .docx)"]:::step --> B["Security Validation<br/>(Whitelist, MIME check, sanitize_filename)"]:::step
    B --> C{"Is File Valid?"}:::decision
    C -->|No| D["Return 400 Bad Request"]:::error
    C -->|Yes| E["Extract Text with Page Tracking<br/>(PyPDF / docx2txt / UTF-8)"]:::step
    E --> F["Recursive Character Chunking<br/>(Size: 1000 chars, Overlap: 150 chars)"]:::step
    F --> G["Batch Vector Embedding API<br/>(Google Gemini 3072d text-embedding-004)"]:::step
    G --> H["Attach Metadata<br/>(user_id, document_id, filename, page_number)"]:::step
    H --> I["Insert Vectors into Active Vector Store<br/>(FAISS L2 / Pinecone)"]:::step
    I --> J["Save Document Registry Record<br/>(/data/documents.json)"]:::step
    J --> K["Return 200 Indexing Success to Client"]:::success
```

---

## ⚡ 4. Real-Time RAG Query & Streaming Pipeline

When a user submits a natural language question in the chat interface:

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Frontend as 💻 Next.js 15 UI
    participant Backend as ⚡ FastAPI Backend
    participant Intent as 🔀 Intent Router
    participant GeminiEmb as ⚡ Gemini Embeddings
    participant VectorDB as 🗄️ Vector Store (FAISS/Pinecone)
    participant GeminiLLM as 🧠 Gemini 2.5 Flash

    User->>Frontend: Types question & hits Enter
    Frontend->>Backend: POST /api/v1/ask/stream (Headers: X-User-ID)
    Backend->>Intent: Check is_casual_greeting(query)
    
    alt Casual Greeting (e.g., "Hello", "Who are you?")
        Intent-->>Backend: Casual Greeting Detected
        Backend->>Frontend: Stream friendly Nexus_Bot greeting via SSE
    else Document Query
        Intent->>GeminiEmb: Embed Query Text (3072 dimensions)
        GeminiEmb-->>Intent: Returns 3072d Float Vector
        Intent->>VectorDB: Query Cosine Similarity (Top-K=5, filter: user_id)
        VectorDB-->>Intent: Return Top-5 Vector Chunks with Metadata & Scores
        
        alt All Chunks < 0.30 Relevance Threshold
            Intent->>Backend: No relevant documents found
            Backend->>Frontend: Stream fallback: "I cannot find relevant info in uploaded docs."
        else Relevant Chunks Found (Score >= 0.30)
            Intent->>Intent: Build strict XML <context> Prompt & Anti-Hallucination Prompt
            Intent->>GeminiLLM: Stream grounded prompt to gemini-2.5-flash
            loop Token Generation
                GeminiLLM-->>Backend: Yield token chunk
                Backend-->>Frontend: SSE event: data: {"token": "..."}
                Frontend-->>User: Real-time typethrough rendering
            end
            Backend-->>Frontend: SSE event: data: {"sources": [{"filename", "page", "score"}]}
            Frontend-->>User: Render Citation Badges & Snippet Inspector Modal
        end
    end
```

---

## 🔒 5. Multi-Tenant Data Isolation & Security Architecture

NexusAI uses a strict **Session-Scoped Micro-Tenant Architecture** to ensure complete workspace data isolation:

```mermaid
flowchart LR
    classDef client fill:#0f172a,stroke:#06b6d4,stroke-width:2px,color:#fff;
    classDef middleware fill:#0f172a,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef isol fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef leak fill:#0f172a,stroke:#ef4444,stroke-width:2px,color:#fff;

    subgraph CLIENTS ["Multi-Tenant Clients"]
        U1["User A (Session ID: usr_123)"]:::client
        U2["User B (Session ID: usr_456)"]:::client
    end

    subgraph MIDDLEWARE ["FastAPI Security Middleware"]
        MW["UserContextMiddleware<br/>Extracts & Validates X-User-ID"]:::middleware
    end

    subgraph ISOLATION ["Vector Store Pre-Filter Engine"]
        F1["Filter: user_id == 'usr_123'"]:::isol
        F2["Filter: user_id == 'usr_456'"]:::isol
    end

    subgraph SHARED_DB ["Shared Vector Database (FAISS / Pinecone)"]
        D1[("User A Vectors Only")]:::isol
        D2[("User B Vectors Only")]:::isol
    end

    U1 -->|"X-User-ID: usr_123"| MW
    U2 -->|"X-User-ID: usr_456"| MW
    MW --> F1
    MW --> F2
    F1 --> D1
    F2 --> D2
    F1 -.->|"BLOCKED Cross-Tenant Access"| D2
    F2 -.->|"BLOCKED Cross-Tenant Access"| D1
```

---

## 🧩 6. Component & Subsystem Technical Breakdown

| Layer | Subsystem / File | Technical Role & Specification |
| :--- | :--- | :--- |
| **Frontend** | `components/3d/` | WebGL / Three.js 3D mascot avatar (`Nexus_Bot`) with cyan visor animations. |
| **Frontend** | `components/chat/rag-chat.tsx` | Main chat controller managing real-time SSE token typethrough and message history. |
| **Frontend** | `components/chat/ReasoningDrawer.tsx` | Collapsible sidebar displaying raw chunk text, cosine scores, and source pages. |
| **Frontend** | `components/documents/` | Drag-and-drop document uploader with status badges (`Uploaded` ➔ `Indexing` ➔ `Indexed`). |
| **Backend** | `middleware/user_context.py` | FastAPI middleware intercepting `X-User-ID` to ensure tenant isolation. |
| **Backend** | `api/upload.py` | Validates file extensions, MIME types, prevents directory traversal attacks, and triggers indexing. |
| **Backend** | `api/rag.py` | Exposes `POST /api/v1/ask/stream` returning Server-Sent Events (SSE). |
| **Backend** | `services/extractor.py` | Format-specific extractors for `.pdf`, `.txt`, and `.docx` with page number tracking. |
| **Backend** | `services/chunker.py` | `RecursiveCharacterTextSplitter` with 1,000 char chunk size and 150 char overlap. |
| **Backend** | `services/embedding.py` | Converts text chunks into 3,072-dimensional vectors using `models/gemini-embedding-001`. |
| **Backend** | `services/vector_store_factory.py` | Factory pattern toggling between local CPU FAISS and cloud Pinecone. |
| **Backend** | `services/llm.py` | Interacts with `gemini-2.5-flash` with system prompt grounding and prompt injection defenses. |

---

## ☁️ 7. Cloud Infrastructure & Deployment Topology

```mermaid
flowchart TD
    classDef cloud fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef host fill:#0f172a,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef ext fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;

    subgraph VERCEL ["🌐 Vercel Edge Network (Frontend)"]
        FE_APP["Next.js 15 Production Build<br/>https://nexusai-sage-beta.vercel.app/"]:::cloud
    end

    subgraph RENDER ["⚡ Render Cloud (Backend Web Service)"]
        BE_APP["FastAPI Container (Python 3.11+ / Uvicorn)<br/>https://nexusai-1xq9.onrender.com"]:::host
        DISK["Persistent Disk Mount (/data)<br/>Stores documents.json & local FAISS files"]:::host
        BE_APP <--> DISK
    end

    subgraph AI_STUDIO ["🧠 Google AI Studio"]
        GEMINI_LLM_API["Gemini 2.5 Flash API"]:::ext
        GEMINI_EMB_API["Gemini text-embedding-004 API"]:::ext
    end

    subgraph PINECONE ["☁️ Pinecone Cloud (Optional)"]
        PINECONE_INDEX["Managed Serverless Vector DB"]:::ext
    end

    FE_APP -->|"HTTPS API Calls & SSE Stream"| BE_APP
    BE_APP -->|"Embeddings & Text Generation"| GEMINI_LLM_API
    BE_APP -->|"Batch Vector Generation"| GEMINI_EMB_API
    BE_APP -.->|"Optional Cloud Vector Store"| PINECONE_INDEX
```
