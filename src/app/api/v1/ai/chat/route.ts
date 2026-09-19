import { NextRequest, NextResponse } from "next/server";
import { authRequest } from "@/lib/api-auth";
import { callOpenSourceChat, getAiConfig, OPEN_MODELS, type ChatMessage } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-bb-api-key, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: "Create a key at /ai-keys then send Authorization: Bearer bb_ai_...",
      },
      { status: 401, headers: cors }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: cors });
  }

  const messages: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
    : body.message
      ? [
          {
            role: "system",
            content:
              body.system ||
              "You are BrowserBase AI Agent. Help with browsers, APIs, and automation.",
          },
          { role: "user", content: String(body.message) },
        ]
      : [];

  if (!messages.length) {
    return NextResponse.json({ error: "Provide message or messages[]" }, { status: 400, headers: cors });
  }

  if (!messages.some((m) => m.role === "system")) {
    messages.unshift({
      role: "system",
      content:
        body.system ||
        "You are BrowserBase AI Agent. Be concise and accurate.",
    });
  }

  try {
    const result = await callOpenSourceChat(messages, { model: body.model });
    return NextResponse.json(
      {
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
      },
      { headers: cors }
    );
  } catch (e: any) {
    const cfg = getAiConfig();
    return NextResponse.json(
      {
        error: e?.message || "AI request failed",
        configured: Boolean(cfg),
        hint: cfg
          ? "Provider error — try another model"
          : "Set GROQ_API_KEY on the server (Vercel env)",
      },
      { status: 503, headers: cors }
    );
  }
}

export async function GET() {
  const cfg = getAiConfig();
  return NextResponse.json(
    {
      endpoint: "POST /api/v1/ai/chat",
      auth: ["Authorization: Bearer bb_ai_...", "x-bb-api-key: bb_ai_..."],
      cors: "*",