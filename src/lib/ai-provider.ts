/**
 * Open-source model providers (OpenAI-compatible APIs).
 * Set one of: GROQ_API_KEY | OPENROUTER_API_KEY | AI_API_KEY (+ optional AI_BASE_URL, AI_MODEL)
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function getAiConfig() {
  const groq = process.env.GROQ_API_KEY;
  const openrouter = process.env.OPENROUTER_API_KEY;
  const custom = process.env.AI_API_KEY;

  if (groq) {
    return {
      provider: "groq" as const,
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groq,
      model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
      label: "Groq · Llama 3.3 70B (open weights)",
    };
  }
  if (openrouter) {
    return {
      provider: "openrouter" as const,
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: openrouter,
      model: process.env.AI_MODEL || "meta-llama/llama-3.3-70b-instruct",
      label: "OpenRouter · Llama 3.3 (open source)",
    };
  }
  if (custom) {
    return {
      provider: "custom" as const,
      baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
      apiKey: custom,
      model: process.env.AI_MODEL || "gpt-4o-mini",
      label: process.env.AI_MODEL || "Custom OpenAI-compatible",
    };
  }
  return null;
}

export async function callOpenSourceChat(messages: ChatMessage[]): Promise<{
  content: string;
  model: string;
  provider: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}> {
  const cfg = getAiConfig();
  if (!cfg) {
    throw new Error(
      "No AI provider configured. Set GROQ_API_KEY (free open models) or OPENROUTER_API_KEY or AI_API_KEY in Vercel env."
    );
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(cfg.provider === "openrouter"
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://browserbase-clone-open-source1.vercel.app",
            "X-Title": "BrowserBase AI Agent",
          }
        : {}),
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || `AI provider error ${res.status}`);
  }

  const content = data.choices?.[0]?.message?.content || "";
  return {
    content,
    model: data.model || cfg.model,
    provider: cfg.provider,
    usage: data.usage,
  };
}
