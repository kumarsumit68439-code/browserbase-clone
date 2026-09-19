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
 * LangGraph-style multi-node agent graph (plan → act → reflect).
 * Real LLM calls on each node using configured free models.
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

  const input = String(body.input || body.message || "");
  if (!input) {
    return NextResponse.json({ error: "input required" }, { status: 400, headers: cors });
  }

  const model = body.model as string | undefined;
  const graphName = body.graph || "default";
  const nodes: { name: string; output: string }[] = [];

  try {
    // Node 1: PLAN
    const planMessages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are the PLAN node in a LangGraph-style agent. Output a short numbered plan (3-5 steps) only.",
      },
      { role: "user", content: input },
    ];
    const plan = await callOpenSourceChat(planMessages, { model });
    nodes.push({ name: "plan", output: plan.content });

    // Node 2: ACT
    const actMessages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are the ACT node. Execute the plan with concrete answers. Be practical and complete.",
      },
      {
        role: "user",
        content: `User request:\n${input}\n\nPlan:\n${plan.content}\n\nProduce the full answer.`,
      },
    ];
    const act = await callOpenSourceChat(actMessages, { model });
    nodes.push({ name: "act", output: act.content });

    // Node 3: REFLECT
    const reflectMessages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are the REFLECT node. Improve the answer briefly. Return the final polished response only.",
      },
      {
        role: "user",
        content: `Original request: ${input}\n\nDraft:\n${act.content}`,
      },
    ];
    const reflect = await callOpenSourceChat(reflectMessages, { model });
    nodes.push({ name: "reflect", output: reflect.content });

    return NextResponse.json(
      {
        framework: "langgraph-style",
        graph: graphName,
        nodes,
        final: reflect.content,
        models_used: [plan.model, act.model, reflect.model],
        providers: [plan.provider, act.provider, reflect.provider],
        projectId: auth.projectId,
      },
      { headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "LangGraph run failed", nodes },
      { status: 503, headers: cors }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      endpoint: "POST /api/v1/langgraph/run",
      auth: "Bearer bb_backend_... or bb_ai_...",
      graph: "plan → act → reflect",
      body: { input: "string", model: "optional", graph: "optional name" },
    },
    { headers: cors }
  );
}
