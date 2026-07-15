# Momo AI provider setup

## Local, no-cost mode: Ollama

Ollama is the default when running Momo locally. It uses:

```env
MOMO_AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
```

`llama3.2:3b` is already installed on this computer. Start the Momo app with `npm run dev`; Ollama must be running locally. Do not add these settings to Vercel.

## Hosted no-cost mode: Gemini

Create a Gemini API key in Google AI Studio, then add these **server-only** Vercel variables for Production and Preview:

```env
MOMO_AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

Do not use `NEXT_PUBLIC_` for the Gemini key. The Gemini free tier is suitable for an early demo, but Google states that free-tier content may be used to improve its products. Do not use it for sensitive production claim documents without an appropriate privacy review and paid/data-handling arrangement.

## Later: OpenAI

When Momo has production usage, set `MOMO_AI_PROVIDER=openai` and add `OPENAI_API_KEY`. The app retains the same guardrails and response format.

## Emergency free demo mode

Set `MOMO_AI_PROVIDER=demo` to use a clearly labelled, deterministic drafting template with no external AI request.
