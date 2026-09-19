/** Free / open models — Groq free tier + OpenRouter :free (verified Sep 2026)
 * Redeploy note: runtime keys GROQ_API_KEY / OPENROUTER_API_KEY from Vercel Production env.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const OPEN_MODELS = [
  // —— OpenRouter free router (auto-picks any free model) ——
  { id: "openrouter/free", label: "OpenRouter Free Router (auto)", provider: "openrouter", free: true },

  // —— OpenRouter $0 models (live API, Sep 2026) ——
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "Nemotron 3 Ultra (free)", provider: "openrouter", free: true },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron 3 Super (free)", provider: "openrouter", free: true },
  { id: "nvidia/nemotron-3.5-lightning:free", label: "Nemotron 3.5 Lightning (free)", provider: "openrouter", free: true },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", label: "Nemotron 3 Nano Reasoning (free)", provider: "openrouter", free: true },
  { id: "poolside/laguna-s-2.1:free", label: "Laguna S 2.1 (free)", provider: "openrouter", free: true },
  { id: "poolside/laguna-xs-2.1:free", label: "Laguna XS 2.1 (free)", provider: "openrouter", free: true },
  { id: "inclusionai/ling-3.0-flash-fin:free", label: "Ling 3.0 Flash Fin (free)", provider: "openrouter", free: true },
  { id: "inclusionai/ling-3.0-flash-sante:free", label: "Ling 3.0 Flash Sante (free)", provider: "openrouter", free: true },
  { id: "inclusionai/ling-3.0-flash-vl:free", label: "Ling 3.0 Flash VL (free)", provider: "openrouter", free: true },
  { id: "qwen/qwen3.8-27b:free", label: "Qwen3.8 27B (free)", provider: "openrouter", free: true },
  { id: "deepseek/deepseek-v4-flash-0731:free", label: "DeepSeek V4 Flash (free)", provider: "openrouter", free: true },
  { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B (free)", provider: "openrouter", free: true },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B A4B (free)", provider: "openrouter", free: true },
  { id: "z-ai/glm-5.2:free", label: "GLM 5.2 (free)", provider: "openrouter", free: true },
  { id: "thinkingmachines/inkling:free", label: "Inkling (free)", provider: "openrouter", free: true },
  { id: "thinkingmachines/inkling-small:free", label: "Inkling Small (free)", provider: "openrouter", free: true },
  { id: "liquid/lfm-2.5-2.6b:free", label: "LFM 2.5 2.6B (free)", provider: "openrouter", free: true },
  { id: "nex-agi/nex-n2.5-pro:free", label: "Nex N2.5 Pro (free)", provider: "openrouter", free: true },
  { id: "nex-agi/nex-n2.5-mini:free", label: "Nex N2.5 Mini (free)", provider: "openrouter", free: true },
  { id: "cohere/north-mini-code:free", label: "Cohere North Mini Code (free)", provider: "openrouter", free: true },
  { id: "dots-studio/dots-3-note-preview:free", label: "Dots3 Note Preview (free)", provider: "openrouter", free: true },

  // —— Groq free-tier chat models (rate-limited, no card) ——
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", provider: "groq", free: true },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", provider: "groq", free: true },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", provider: "groq", free: true },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", provider: "groq", free: true },
  { id: "openai/gpt-oss-safeguard-20b", label: "GPT-OSS Safeguard 20B", provider: "groq", free: true },
  { id: "qwen/qwen3.8-27b", label: "Qwen3.8 27B", provider: "groq", free: true },
  { id: "groq/compound", label: "Groq Compound (tools)", provider: "groq", free: true },
  { id: "groq/compound-mini", label: "Groq Compound Mini", provider: "groq", free: true },
  { id: "allam-2-7b", label: "Allam 2 7B", provider: "groq", free: true },
] as const;

function pickProvider(modelId?: string): "groq" | "openrouter" | "custom" | null {
  const m = modelId || "";
  if (
    m.includes(":free") ||
    m.startsWith("openrouter/") ||
    m.includes("nemotron") ||
    m.includes("laguna") ||
    m.includes("inclusionai") ||
    m.includes("deepseek/") ||
    m.includes("gemma-4") ||
    m.includes("z-ai/") ||
    m.includes("thinkingmachines") ||
    m.includes("liquid/") ||
    m.includes("nex-agi") ||
    m.includes("cohere/") ||
    m.includes("dots-studio")
  ) {
    return process.env.OPENROUTER_API_KEY ? "openrouter" : null;
  }
  if (
    m.startsWith("llama-") ||
    m.startsWith("groq/") ||
    m.startsWith("openai/gpt-oss") ||
    m.startsWith("qwen/qwen3") ||
    m === "allam-2-7b" ||
    m.includes("mixtral") ||
    m.includes("gemma2")
  ) {
    return process.env.GROQ_API_KEY ? "groq" : process.env.OPENROUTER_API_KEY ? "openrouter" : null;
  }
  if (process.env.GROQ_API_KEY && m && !m.includes("/")) return "groq";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.AI_API_KEY) return "custom";
  return null;
}

export function getAiConfig(preferredModel?: string) {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const orKey = process.env.OPENROUTER_API_KEY?.trim();
  const customKey = process.env.AI_API_KEY?.trim();

  const provider = pickProvider(preferredModel);

  if (provider === "openrouter" && orKey) {
    return {
      provider: "openrouter" as const,
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: orKey,
      model: preferredModel || process.env.AI_MODEL || "openrouter/free",
      label: "OpenRouter · free models",
    };
  }

  if (provider === "groq" && groqKey) {
    return {
      provider: "groq" as const,
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groqKey,
      model: preferredModel || process.env.AI_MODEL || "llama-3.1-8b-instant",
      label: "Groq · free tier",
    };
  }

  if (orKey) {
    return {
      provider: "openrouter" as const,
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: orKey,
      model:
        preferredModel?.includes(":free") || preferredModel?.startsWith("openrouter")
          ? preferredModel!
          : "openrouter/free",
      label: "OpenRouter · free models",
    };
  }
  if (groqKey) {
    return {
      provider: "groq" as const,
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groqKey,
      model:
        preferredModel && !preferredModel.includes(":free")
          ? preferredModel
          : "llama-3.1-8b-instant",
      label: "Groq · free tier",
    };
  }
  if (customKey) {
    return {
      provider: "custom" as const,
      baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
      apiKey: customKey,
      model: preferredModel || process.env.AI_MODEL || "gpt-4o-mini",
      label: "Custom",
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
      "No free AI provider key. Set GROQ_API_KEY and/or OPENROUTER_API_KEY in Vercel env, then Redeploy."
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
