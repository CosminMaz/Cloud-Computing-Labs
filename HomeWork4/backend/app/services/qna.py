import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class QnAService:
    """Thin wrapper over the Custom Question Answering REST API.
    Routes never call CQA directly — they call ask() on this class."""

    API_VERSION = "2021-10-01"
    NO_ANSWER = "Sorry, I don't have an answer for that. Please reach out directly."

    def __init__(self, endpoint: str, key: str, project: str, deployment: str):
        if not endpoint or not key or not project:
            raise RuntimeError(
                "Custom Question Answering is not configured "
                "(AZURE_LANGUAGE_ENDPOINT / AZURE_LANGUAGE_KEY / AZURE_LANGUAGE_PROJECT)"
            )
        self._endpoint = endpoint.rstrip("/")
        self._key = key
        self._project = project
        self._deployment = deployment

    def ask(self, question: str, confidence_threshold: float = 0.3) -> dict:
        """Sends a question to the deployed knowledge base.
        Returns {answer, confidence}. If no answer clears the threshold, returns
        a friendly fallback with confidence=0."""
        url = f"{self._endpoint}/language/:query-knowledgebases"
        params = {
            "projectName": self._project,
            "api-version": self.API_VERSION,
            "deploymentName": self._deployment,
        }
        body = {
            "question": question,
            "top": 1,
            "confidenceScoreThreshold": confidence_threshold,
        }
        headers = {
            "Ocp-Apim-Subscription-Key": self._key,
            "Content-Type": "application/json",
        }

        try:
            response = httpx.post(url, params=params, headers=headers, json=body, timeout=10.0)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.exception("Custom Question Answering request failed")
            raise RuntimeError("Knowledge base lookup failed") from exc

        answers = response.json().get("answers") or []
        if not answers:
            return {"answer": self.NO_ANSWER, "confidence": 0.0}

        top = answers[0]
        return {
            "answer": top.get("answer") or self.NO_ANSWER,
            "confidence": float(top.get("confidenceScore", 0.0)),
        }


_service: QnAService | None = None


def get_qna_service() -> QnAService:
    """FastAPI dependency. Lazy singleton so import-time misconfiguration
    doesn't crash the whole app."""
    global _service
    if _service is None:
        _service = QnAService(
            endpoint=settings.AZURE_LANGUAGE_ENDPOINT,
            key=settings.AZURE_LANGUAGE_KEY,
            project=settings.AZURE_LANGUAGE_PROJECT,
            deployment=settings.AZURE_LANGUAGE_DEPLOYMENT,
        )
    return _service
