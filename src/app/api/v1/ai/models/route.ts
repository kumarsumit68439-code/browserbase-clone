import { NextResponse } from "next/server";
import { getAiConfig, OPEN_MODELS } from "@/lib/ai-provider";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET() {
  const cfg = getAiConfig();
  return NextResponse.json(
    {
      models: OPEN_MODELS,
      provider_configured: Boolean(cfg),
      default_model: cfg?.model || OPEN_MODELS[0].id,
      provider: cfg?.label || null,
    },
    { headers: cors }
  );
}
