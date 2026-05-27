import logging
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

_CONFIGURED = False


def _ensure_configured():
    global _CONFIGURED
    if not _CONFIGURED:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY nu este configurat în mediu")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _CONFIGURED = True


def build_system_prompt(contractor) -> str:
    base = (
        "Ești asistentul virtual al platformei de servicii, integrat în profilul unui contractor. "
        "Rolul tău este să ajuți clienții să înțeleagă serviciile contractorului, disponibilitatea "
        "acestuia și tarifele, și să facilitezi procesul de rezervare. "
        "Fii prietenos, concis și profesional. "
        "Nu inventa niciodată informații care nu ți-au fost furnizate. "
        "Răspunde întotdeauna în limba română, indiferent de limba în care ți se adresează clientul.\n\n"
    )

    profile_info = f"Informații despre contractorul pentru care lucrezi:\n- Nume: {contractor.display_name}\n"
    if contractor.skills:
        profile_info += f"- Abilități: {contractor.skills}\n"
    if contractor.hourly_rate:
        profile_info += f"- Tarif orar: {contractor.hourly_rate} RON/oră\n"
    if contractor.bio:
        profile_info += f"- Descriere: {contractor.bio}\n"

    if contractor.ai_custom_prompt:
        custom_section = (
            f"\nInformații suplimentare furnizate de contractor:\n{contractor.ai_custom_prompt}\n"
        )
    else:
        custom_section = (
            "\nNotă: Contractorul nu a furnizat informații suplimentare despre disponibilitate sau "
            "servicii specifice. Dacă clientul întreabă despre detalii care nu sunt menționate mai sus, "
            "informează-l că aceste informații nu au fost furnizate și sugerează-i să trimită o cerere "
            "de rezervare pentru a lua legătura direct cu contractorul.\n"
        )

    return base + profile_info + custom_section


def ask_gemini(question: str, system_prompt: str, history: list) -> str:
    _ensure_configured()
    try:
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)
        chat = model.start_chat(history=history)
        response = chat.send_message(question)
        return response.text
    except Exception as exc:
        logger.exception("Gemini API request failed")
        raise RuntimeError("Gemini API request failed") from exc
