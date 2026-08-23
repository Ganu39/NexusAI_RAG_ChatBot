"""RAG orchestration service for NexusAI."""

from typing import Iterator, Optional, Tuple
from models.rag import AskRequest, AskResponse, AskSource
from services.embedding import BaseEmbeddingProvider, GeminiEmbeddingProvider
from services.vector_store import BaseVectorStore
from services.vector_store_factory import get_vector_store
from services.llm import BaseLLMProvider, GeminiLLMProvider
from services.context_builder import ContextBuilder
from services.prompts import RAG_SYSTEM_INSTRUCTION, build_rag_user_prompt

CASUAL_GREETINGS = {
    "hi",
    "hello",
    "hey",
    "hiya",
    "howdy",
    "greetings",
    "good morning",
    "good afternoon",
    "good evening",
    "who are you",
    "who are u",
    "what is your name",
    "what's your name",
    "how are you",
    "how are u",
    "thanks",
    "thank you",
    "help",
    "ping",
}


def is_casual_greeting(question: str) -> bool:
    """Check if question is a casual greeting or pleasantry."""
    clean = question.strip().lower().rstrip(".!?,")
    return clean in CASUAL_GREETINGS


class RAGService:
    """Orchestrates RAG search, context building, and LLM generation."""

    def __init__(
        self,
        embedding_provider: Optional[BaseEmbeddingProvider] = None,
        vector_store: Optional[BaseVectorStore] = None,
        llm_provider: Optional[BaseLLMProvider] = None,
        context_builder: Optional[ContextBuilder] = None,
    ):
        """Initialize RAGService components."""
        self.embedding_provider = (
            embedding_provider
            if embedding_provider is not None
            else GeminiEmbeddingProvider()
        )
        self.vector_store = (
            vector_store
            if vector_store is not None
            else get_vector_store()
        )
        self.llm_provider = (
            llm_provider
            if llm_provider is not None
            else GeminiLLMProvider()
        )
        self.context_builder = (
            context_builder
            if context_builder is not None
            else ContextBuilder()
        )

    def answer_question(self, request: AskRequest) -> AskResponse:
        """Process user question through RAG pipeline."""
        query_vector = self.embedding_provider.embed_query(request.question)
        raw_results = self.vector_store.similarity_search(
            query_vector, top_k=request.top_k, user_id=request.user_id
        )
        filtered_results = self.context_builder.filter_results(raw_results)

        if not filtered_results:
            if is_casual_greeting(request.question):
                greeting_text = (
                    "Hello! 👋 I am Nexus_Bot, your AI document intelligence assistant. "
                    "How can I help you analyze your documents today?"
                )
                return AskResponse(
                    question=request.question,
                    answer=greeting_text,
                    sources=[],
                    retrieved_chunks=0,
                    grounded=True,
                )

            return AskResponse(
                question=request.question,
                answer=(
                    "I couldn't find enough information in the uploaded "
                    "documents to answer that question."
                ),
                sources=[],
                retrieved_chunks=0,
                grounded=False,
            )

        context_text = self.context_builder.build_context(filtered_results)
        user_prompt = build_rag_user_prompt(request.question, context_text)

        answer_text = self.llm_provider.generate(
            prompt=user_prompt,
            system_instruction=RAG_SYSTEM_INSTRUCTION,
        )

        sources: list[AskSource] = []
        for res in filtered_results:
            filename = res.metadata.get("filename", "Unknown Document")
            sources.append(
                AskSource(
                    chunk_id=res.chunk_id,
                    document_id=res.document_id,
                    filename=filename,
                    page_number=res.page_number,
                    score=res.score,
                    metadata=res.metadata,
                    text_snippet=res.text,
                )
            )

        return AskResponse(
            question=request.question,
            answer=answer_text,
            sources=sources,
            retrieved_chunks=len(sources),
            grounded=True,
        )

    def answer_question_stream(
        self, request: AskRequest
    ) -> Tuple[list[AskSource], bool, Iterator[str]]:
        """Process user question returning citations and token stream."""
        query_vector = self.embedding_provider.embed_query(request.question)
        raw_results = self.vector_store.similarity_search(
            query_vector, top_k=request.top_k, user_id=request.user_id
        )
        filtered_results = self.context_builder.filter_results(raw_results)

        if not filtered_results:
            if is_casual_greeting(request.question):
                greeting_text = (
                    "Hello! 👋 I am Nexus_Bot, your AI document intelligence assistant. "
                    "How can I help you analyze your documents today?"
                )
                def greeting_gen():
                    yield greeting_text

                return [], True, greeting_gen()

            def fallback_gen():
                yield (
                    "I couldn't find enough information in the uploaded "
                    "documents to answer that question."
                )

            return [], False, fallback_gen()

        context_text = self.context_builder.build_context(filtered_results)
        user_prompt = build_rag_user_prompt(request.question, context_text)

        sources: list[AskSource] = []
        for res in filtered_results:
            filename = res.metadata.get("filename", "Unknown Document")
            sources.append(
                AskSource(
                    chunk_id=res.chunk_id,
                    document_id=res.document_id,
                    filename=filename,
                    page_number=res.page_number,
                    score=res.score,
                    metadata=res.metadata,
                    text_snippet=res.text,
                )
            )

        token_stream = self.llm_provider.generate_stream(
            prompt=user_prompt,
            system_instruction=RAG_SYSTEM_INSTRUCTION,
        )

        return sources, True, token_stream
