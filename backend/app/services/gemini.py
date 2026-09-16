import logging
from typing import List, Optional
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger("faztnotes.gemini")


class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.gemini_api_key
        self.configured = False
        if self.api_key and self.api_key != "tu_clave_de_gemini":
            try:
                genai.configure(api_key=self.api_key)
                self.configured = True
                logger.info("[FAZTNOTES-GEMINI] SDK de Gemini configurado correctamente.")
            except Exception as exc:
                logger.error(f"[FAZTNOTES-GEMINI] Error al configurar Gemini SDK: {exc}")
                self.configured = False
        else:
            logger.warning(
                "[FAZTNOTES-GEMINI] Clave GEMINI_API_KEY no configurada o valor por defecto detectado."
            )

    def is_configured(self) -> bool:
        return self.configured and bool(self.api_key)

    def generate_embedding(self, text: str) -> List[float]:
        if not self.is_configured():
            raise RuntimeError(
                "GEMINI_API_KEY no configurada en el entorno. No es posible generar embeddings."
            )

        clean_text = text.strip()
        if not clean_text:
            clean_text = "nota vacia"

        try:
            result = genai.embed_content(
                model=settings.embedding_model,
                content=clean_text,
                task_type="retrieval_document"
            )
            embedding = result.get("embedding")
            if not embedding:
                raise ValueError("Respuesta de embedding vacia recibida de Gemini.")
            return embedding
        except Exception as exc:
            logger.error(f"[FAZTNOTES-GEMINI] Fallo al generar embedding: {exc}")
            raise RuntimeError(f"Error al generar embedding con Gemini: {str(exc)}") from exc

    def generate_query_embedding(self, query: str) -> List[float]:
        if not self.is_configured():
            raise RuntimeError(
                "GEMINI_API_KEY no configurada en el entorno. No es posible generar embedding de consulta."
            )

        try:
            result = genai.embed_content(
                model=settings.embedding_model,
                content=query.strip(),
                task_type="retrieval_query"
            )
            embedding = result.get("embedding")
            if not embedding:
                raise ValueError("Respuesta de embedding vacia recibida de Gemini.")
            return embedding
        except Exception as exc:
            logger.error(f"[FAZTNOTES-GEMINI] Fallo al generar query embedding: {exc}")
            raise RuntimeError(f"Error al generar query embedding con Gemini: {str(exc)}") from exc

    def generate_nexo_response(self, query: str, context: str) -> str:
        if not self.is_configured():
            raise RuntimeError(
                "GEMINI_API_KEY no configurada en el entorno. No es posible ejecutar Nexo."
            )

        system_instruction = (
            "Eres Nexo, el asistente ejecutivo del sistema FaztNotes. "
            "Tu personalidad es puramente ejecutiva, objetiva y estricta.\n"
            "Reglas operativas mandatorias:\n"
            "1. Responde exclusivamente utilizando el contexto recuperado de las notas provistas.\n"
            "2. Si el contexto provisto no contiene la informacion necesaria para responder la pregunta, "
            "debes declarar de forma exacta y explicita: 'No hay información en las notas sobre este tema.'\n"
            "3. Debes citar obligatoriamente el titulo o ID de la nota fuente de cada afirmacion "
            "utilizando el formato: [Fuente: Titulo (ID)].\n"
            "4. Cero emojis en toda la respuesta bajo cualquier circunstancia.\n"
            "5. Cero AI Slop: Sin saludos condescendientes, sin introducciones decorativas, "
            "sin florituras linguisticas y sin despedidas. Ve directo a los hechos tecnicos con alta densidad informativa."
        )

        user_prompt = (
            f"CONTEXTO DE NOTAS RECUPERADAS:\n{context}\n\n"
            f"CONSULTA DEL USUARIO:\n{query}"
        )

        try:
            model = genai.GenerativeModel(
                model_name=settings.llm_model,
                system_instruction=system_instruction
            )
            response = model.generate_content(
                user_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=1024,
                )
            )
            if not response or not response.text:
                return "No hay información en las notas sobre este tema."
            return response.text.strip()
        except Exception as exc:
            logger.error(f"[FAZTNOTES-GEMINI] Fallo al invocar modelo Nexo: {exc}")
            raise RuntimeError(f"Error al ejecutar inferencia con Nexo: {str(exc)}") from exc


gemini_service = GeminiService()
