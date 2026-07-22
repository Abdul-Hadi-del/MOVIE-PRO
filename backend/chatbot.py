from dotenv import load_dotenv
import os

load_dotenv()
import urllib.request
import json
import backend as movie_backend

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-120b"


def _build_movie_context():
    """Hamari movies collection ka summary banata hai, taaki AI ko pata ho kya suggest karna hai."""
    movies = movie_backend.view_movies()
    lines = []
    for m in movies:
        lines.append(f"- {m['title']} ({m['year']}) | {m['genre']} | Rating: {m['rating']}")
    return "\n".join(lines)


def chat_with_assistant(user_message, conversation_history=None):
    """User ke message ka jawab deta hai, hamari movie list ko context ke taur pe use karte hue."""
    movie_context = _build_movie_context()

    system_prompt = f"""You are a friendly, knowledgeable movie recommendation assistant for the MovieSort Pro app.

Here is the current movie collection available in the app:
{movie_context}

Guidelines:
- Recommend movies ONLY from this list when possible, mentioning title, year, and genre.
- If nothing in the list fits, you can mention it and suggest they check Discover to add new movies.
- Keep responses conversational, warm, and fairly concise (2-4 sentences unless listing multiple movies).
- If the user writes in Roman Urdu/Hindi, respond in the same style naturally.
- Do not mention that you are an AI model; just be the app's movie assistant."""

    messages = [{"role": "system", "content": system_prompt}]

    # conversation_history frontend se Gemini-style aata hai; Groq ke liye convert karte hain
    if conversation_history:
        for h in conversation_history:
            role = "user" if h.get("role") == "user" else "assistant"
            text = h.get("parts", [{}])[0].get("text", "")
            if text:
                messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.7,
    }

    try:
        req = urllib.request.Request(
            GROQ_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; MovieSortPro/1.0)",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"GROQ ERROR: {e}")
        return "Sorry, I'm having trouble responding right now. Please try again in a moment."
    
def parse_voice_command(transcript):
    """Kisi bhi language/script mein bola gaya voice command leta hai
    (English, Urdu, Roman Urdu) aur usse ek simple English search keyword
    ya genre nikaal ke deta hai, movie search ke liye."""

    prompt = f"""You are a search-query extractor for a movie app. The user spoke a voice command, possibly in English, Urdu script, or Roman Urdu (Urdu written in English letters).

Voice input: "{transcript}"

Extract ONLY the core search intent as a short English phrase suitable for searching a movie database (e.g. a movie title, genre, or actor name). Respond with ONLY the extracted phrase, nothing else — no explanation, no quotes.

Examples:
- "koi acchi horror movie dikhao" -> horror
- "مجھے ایکشن مووی چاہیے" -> action
- "show me batman movies" -> batman
- "kuch comedy suggest karo" -> comedy"""

    messages = [{"role": "user", "content": prompt}]
    payload = {"model": GROQ_MODEL, "messages": messages, "temperature": 0.2}

    try:
        req = urllib.request.Request(
            GROQ_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "MovieSortPro/1.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
        result = data["choices"][0]["message"]["content"].strip()
        return result
    except Exception as e:
        print(f"VOICE PARSE ERROR: {e}")
        return transcript  # fallback: original text hi use kar lo