import { NextRequest, NextResponse } from "next/server";
import { authRequest } from "@/lib/api-auth";
import { callOpenSourceChat, getAiConfig, type ChatMessage } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

/**
 * Real AI chat — authenticated by AI/API key or session.
 * Backend calls open-source models (Groq Llama / OpenRouter).
 */
export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: "Generate a key at /ai-keys then send Authorization: Bearer bb_ai_...",
      },
      { status: 401 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
    : body.message
      ? [
          { role: "system", content: body.system || "You are a helpful AI agent for BrowserBase cloud browsers." },
          { role: "user", content: String(body.message) },
        ]
      : [];

  if (!messages.length) {
    return NextResponse.json(
      { error: "Provide message or messages[]" },
      { status: 400 }
    );
  }

  // Ensure system prompt for agent context
  if (!messages.some((m) => m.role === "system")) {
    messages.unshift({
      role: "system",
      content:
        body.system ||
        "You are BrowserBase AI Agent. Help with browser automation, sessions, API keys, and open-source tooling. Be concise and accurate.",
    });
  }

  try {
    const result = await callOpenSourceChat(messages);
    return NextResponse.json({
      id: `chat_${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: result.model,
      provider: result.provider,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: result.content },
          finish_reason: "stop",
        },
      ],
      usage: result.usage,
      projectId: auth.projectId,
    });
  } catch (e: any) {
    const cfg = getAiConfig();
    return NextResponse.json(
      {
        error: e?.message || "AI request failed",
        configured: Boolean(cfg),
        hint: cfg
          ? "Provider returned an error"
          : "Set GROQ_API_KEY (https://console.groq.com) in Vercel Environment Variables for free open-source Llama models",
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  const cfg = getAiConfig();
  return NextResponse.json({
    endpoint: "POST /api/v1/ai/chat",
    auth: ["Authorization: Bearer bb_ai_...", "x-bb-api-key: bb_ai_..."],
    provider_configured: Boolean(cfg),
    provider: cfg?.label || null,
    body_examples: {
      simple: { message: "Hello" },
      full: {
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Explain BrowserBase sessions" },
        ],
      },
    },
  });
}
