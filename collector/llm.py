"""
Model access, behind one interface.

Written after GitHub Models was retired underneath this project and nobody noticed for
several runs, because the code assumed a single vendor's URL shape and the fallback was
quiet. Two rules follow from that:

  1. The provider is configuration, not code. Swapping vendors is a config.json edit.
  2. `probe()` runs before every batch. If the endpoint is gone or the model is not in
     the catalogue, the run says so immediately instead of degrading in silence.

Providers implement two calls:
    probe()               -> (ok: bool, detail: str)   cheap liveness + model check
    complete(system, user, json_mode) -> str           one completion
"""

import json
import os
import time
import urllib.error
import urllib.request


class ProviderError(RuntimeError):
    """Carries the HTTP status and response body — the body is where the reason lives."""

    def __init__(self, status, body, url):
        self.status, self.body, self.url = status, body, url
        detail = (body or "")[:500]
        try:
            err = json.loads(body)
            err = err.get("error", err)
            detail = f"{err.get('status') or err.get('type') or ''} {err.get('message', '')}".strip()
        except (ValueError, AttributeError):
            pass
        super().__init__(f"HTTP {status} — {detail}")


def _request(url, payload=None, headers=None, method="GET", timeout=120, retries=4):
    """One request, with backoff on the failures that are worth retrying.

    429 and 5xx are transient by nature. They also show up for a while after adding
    credit to an account, when requests alternate between a funded and an unfunded
    rate-limit bucket — retrying rides straight through that instead of failing a whole
    run on a race. 4xx other than 429 is a real error and is raised immediately.
    """
    data = json.dumps(payload).encode() if payload is not None else None
    h = {"Accept": "application/json"}
    if data:
        h["Content-Type"] = "application/json"
    h.update(headers or {})

    last = None
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, headers=h, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            last = ProviderError(exc.code, exc.read().decode("utf-8", "replace"), url)
            if exc.code != 429 and exc.code < 500:
                raise last from None
        except urllib.error.URLError as exc:
            last = ProviderError(0, f"could not reach {url}: {exc.reason}", url)

        if attempt < retries:
            wait = min(2 ** attempt * 2, 30)
            print(f"      retrying in {wait}s ({last})", flush=True)
            time.sleep(wait)
    raise last


class Gemini:
    """Google Gemini via the Generative Language API.

    The key must be an *authorization key* — one bound to a service account. Google now
    rejects unrestricted standard keys, and will reject all standard keys from September
    2026. Auth keys are minted in AI Studio, not the Cloud Console; a key created in the
    Console is a standard key and the API answers with
    "This API requires authentication with a service account-bound API key".

    The key travels in the x-goog-api-key header, never the query string. A key in a URL
    ends up in proxy logs, browser history, and CI output.
    """

    BASE = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, model, api_key):
        self.model, self.key = model, api_key

    def _headers(self):
        return {"x-goog-api-key": self.key}

    def probe(self):
        """Actually call the model. Listing the catalogue is not enough.

        Learned the hard way: gemini-2.5-flash appears in the catalogue and reports
        generateContent support, but calling it returns 404 "no longer available to new
        users". A catalogue lookup passed the check and the real request failed on every
        batch. The only honest preflight is a real, tiny completion.
        """
        try:
            self.complete(None, "Reply with the single word: ok")
            return True, f"{self.model} responded"
        except ProviderError as exc:
            msg = str(exc)
            low = msg.lower()
            if "service account" in low or exc.status in (401, 403):
                hint = (" — this looks like a standard API key. Create an authorization "
                        "key in AI Studio (aistudio.google.com/api-keys), not the Cloud "
                        "Console; import the project there first if it isn't listed.")
            elif "credits are depleted" in low or exc.status == 429:
                hint = (" — the project has no prepayment credits. Add credits or enable "
                        "billing for it in AI Studio, then re-run this check.")
            elif exc.status == 404:
                hint = (f" — '{self.model}' is retired or unavailable to this project. "
                        f"Run `python3 collector/analyze.py --models` to list what is "
                        f"actually callable, then update analysis.model in config.json.")
            else:
                hint = ""
            return False, msg + hint

    def list_models(self):
        """Model ids this project can see that support generateContent."""
        body = _request(f"{self.BASE}/models?pageSize=200", headers=self._headers())
        return [m["name"].replace("models/", "") for m in body.get("models", [])
                if "generateContent" in (m.get("supportedGenerationMethods") or [])]

    def complete(self, system, user, json_mode=False, temperature=0.0):
        payload = {
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {"temperature": temperature},
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        body = _request(f"{self.BASE}/models/{self.model}:generateContent",
                        payload, headers=self._headers(), method="POST")

        candidates = body.get("candidates") or []
        if not candidates:
            # Usually a safety block or an empty completion — surface it rather than
            # returning "" and letting the caller think the model had nothing to say.
            raise ProviderError(200, json.dumps(body)[:500], "generateContent")
        parts = candidates[0].get("content", {}).get("parts") or []
        return "".join(p.get("text", "") for p in parts).strip()


class OpenAICompatible:
    """Anything speaking the OpenAI chat-completions shape.

    Covers OpenAI, Groq, OpenRouter — and Ollama, which serves the same API at
    http://localhost:11434/v1 and ignores the Authorization header entirely. Running a
    local model is therefore a config change, not new code.
    """

    def __init__(self, model, api_key, base):
        self.model, self.key, self.base = model, api_key, base.rstrip("/")

    def _headers(self):
        return {"Authorization": f"Bearer {self.key or 'not-required'}"}

    def probe(self):
        try:
            body = _request(f"{self.base}/models", headers=self._headers(), timeout=30)
        except ProviderError as exc:
            low = str(exc).lower()
            if exc.status == 0 and "localhost" in self.base:
                hint = (" — nothing is serving on that port. Is `ollama serve` running, "
                        "and has the model been pulled?")
            elif "no credits" in low or "quota" in low or exc.status == 429:
                hint = (" — the account has no credits. Add a balance at "
                        "platform.openai.com/settings/organization/billing.")
            elif exc.status == 401:
                hint = " — the key was rejected. Check it is current and not revoked."
            else:
                hint = ""
            return False, str(exc) + hint
        names = [m.get("id") for m in body.get("data", [])]
        if self.model not in names:
            return False, (f"model '{self.model}' is not loaded. Available: "
                           f"{', '.join(names[:8]) or 'none'}"
                           + (f". Run: ollama pull {self.model}" if "localhost" in self.base else ""))
        # Same lesson as Gemini: being listed is not the same as being callable.
        try:
            self.complete(None, "Reply with the single word: ok")
        except ProviderError as exc:
            return False, f"{self.model} is listed but the call failed — {exc}"
        return True, f"{self.model} responded"

    def complete(self, system, user, json_mode=False, temperature=0.0):
        messages = ([{"role": "system", "content": system}] if system else []) + \
                   [{"role": "user", "content": user}]
        payload = {"model": self.model, "messages": messages, "temperature": temperature}
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            body = _request(f"{self.base}/chat/completions", payload,
                            headers=self._headers(), method="POST")
        except ProviderError as exc:
            # Reasoning models (the gpt-5 family and o-series) reject any temperature
            # other than the default and answer 400 "Unsupported value". Drop the
            # parameter and retry once rather than making the model choice depend on
            # knowing which families are reasoning models.
            if exc.status == 400 and "temperature" in (exc.body or "").lower():
                payload.pop("temperature", None)
                body = _request(f"{self.base}/chat/completions", payload,
                                headers=self._headers(), method="POST")
            else:
                raise

        choice = body["choices"][0]["message"]
        return (choice.get("content") or "").strip()


def build(config):
    """Construct the configured provider, or return (None, reason) if unavailable."""
    provider = (config.get("provider") or "rules").lower()
    if provider == "rules":
        return None, "provider is set to 'rules' — the model path is off by configuration"

    key_env = config.get("api_key_env") or ""
    key = os.environ.get(key_env, "").strip()
    base = config.get("base_url") or ""
    local = "localhost" in base or "127.0.0.1" in base
    if not key and not local:
        return None, f"{key_env} is not set in the environment"

    model = config.get("model")
    if provider == "gemini":
        return Gemini(model, key), None
    if provider in ("openai", "groq", "openrouter", "openai_compatible", "ollama"):
        if not base:
            return None, f"provider '{provider}' needs 'base_url' in config.json"
        return OpenAICompatible(model, key, base), None
    return None, f"unknown provider '{provider}'"
