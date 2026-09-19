/** Open-source / OpenAI-compatible model providers */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const OPEN_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "groq" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", provider: "groq" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", provider: "groq" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B", provider: "groq" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (OpenRouter)", provider: "openrouter" },
  { id: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B (OpenRouter)", provider: "openrouter" },
  { id: "mistralai/mistral-7b-instruct", label: "Mistral 7B (OpenRouter)", provider: "openrouter" },
  { id: "google/gemma-2-9b-it", label: "Gemma 2 9B (OpenRouter)", provider: "openrouter" },
] as const;

export function getAiConfig(preferredModel?: string) {
  const groq = process.env.GROQ_API_KEY;
  const openrouter = process.env.OPENROUTER_API_KEY;
  const custom = process.env.AI_API_KEY;

  const modelHint = preferredModel || process.env.AI_MODEL || "";

  if (groq && (!modelHint.includes("/") || modelHint.includes("llama-3") || modelHint.includes("mixtral") || modelHint.includes("gemma"))) {
    // Prefer Groq for native model ids
    if (!modelHint || !modelHint.includes("/") || groq) {
      if (groq && (!modelHint || !modelHint.includes("meta-llama") && !modelHint.includes("mistralai") && !modelHint.includes("google/"))) {
        return {
          provider: "groq" as const,
          baseUrl: "https://api.groq.com/openai/v1",
          apiKey: groq,
          model: modelHint && !modelHint.includes("/") ? modelHint : process.env.AI_MODEL || "llama-3.3-70b-versatile",
          label: "Groq (open weights)",
        };
      }
    }
  }

  if (openrouter) {
    return {
      provider: "openrouter" as const,
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: openrouter,
      model: modelHint || process.env.AI_MODEL || "meta-llama/llama-3.3-70b-instruct",
      label: "OpenRouter (open source)",
    };
  }

  if (groq) {
    return {
      provider: "groq" as const,
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groq,
      model: modelHint && !modelHint.includes("/") ? modelHint : "llama-3.3-70b-versatile",
      label: "Groq (open weights)",
    };
  }

  if (custom) {
    return {
      provider: "custom" as const,
      baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
      apiKey: custom,
      model: modelHint || process.env.AI_MODEL || "gpt-4o-mini",
      label: "Custom provider",
    };
  }
  return null;
}

export async function callOpenSourceChat(
  messages: ChatMessage[],
  opts?: { model?: string }
): Promise<{
  content: string;
  model: string;
  provider: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}> {
  const cfg = getAiConfig(opts?.model);
  if (!cfg) {
    throw new Error(
      "No AI provider configured. Set GROQ_API_KEY or OPENROUTER_API_KEY in Vercel env."
    );
  }

  const model = opts?.model || cfg.model;

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(cfg.provider === "openrouter"
        ? {
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_SITE_URL ||
              "https://browserbase-clone-open-source1.vercel.app",
            "X-Title": "BrowserBase AI Agent",
          }
        : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || `AI provider error ${res.status}`);
  }

  return {
    content: data.choices?.[0]?.message?.content || "",
    model: data.model || model,
    provider: cfg.provider,
    usage: data.usage,
  };
}
