import { NextRequest, NextResponse } from "next/server";
import { authRequest } from "@/lib/api-auth";
import { callOpenSourceChat, type ChatMessage } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-bb-api-key, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

/**
 * AI Agent endpoint — same auth as chat, stronger agent system prompt.
 * Any website / localhost can call with CORS *.
 */
export async function POST(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
  }

  const agentName = body.agent_name || body.name || "BrowserBase Agent";
  const goal = body.goal || body.instructions || "Help the user complete their task.";
  const userMessage = body.message || body.input || "";

  if (!userMessage) {
    return NextResponse.json({ error: "message required" }, { status: 400, headers: cors });
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are "${agentName}", an AI agent powered by BrowserBase.
Goal: ${goal}
You can reason about browser sessions, APIs, and automation.
Reply with clear steps when useful. Keep answers practical.`,
    },
    ...(Array.isArray(body.history) ? body.history : []),
    { role: "user", content: String(userMessage) },
  ];

  try {
    const result = await callOpenSourceChat(messages, { model: body.model });
    return NextResponse.json(
      {
        agent: agentName,
        goal,
        model: result.model,
        provider: result.provider,
        reply: result.content,
        usage: result.usage,
        projectId: auth.projectId,
      },
      { headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Agent failed" }, { status: 503, headers: cors });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      endpoint: "POST /api/v1/ai/agent",
      auth: "Bearer bb_ai_...",
      cors: "*",
      body: {
        message: "user input",
        agent_name: "optional",
        goal: "optional instructions",
        model: "optional",
        history: "optional prior messages",
      },
    },
    { headers: cors }
  );
}
