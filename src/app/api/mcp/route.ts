import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyPayload } from "@/lib/mcp/oauth-crypto";
import { generateSessionId } from "@/lib/keys";
import { createRealBrowserSession } from "@/lib/browser-provider";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, mcp-session-id",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: "GET, POST, DELETE, OPTIONS", ...corsHeaders },
  });
}

function getBearer(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

async function authMcp(req: NextRequest) {
  const token = getBearer(req);
  if (!token) return null;
  const payload = verifyPayload<{ typ: string; sub: string; client: string; scope: string }>(token);
  if (!payload || payload.typ !== "access") return null;
  if (!payload.client) return null;
  return { userId: payload.sub, client: payload.client, scope: payload.scope };
}

const TOOLS = [
  {
    name: "get_workspace",
    description: "Get project id, user email, and workspace summary",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_api_keys",
    description: "List API keys for the authorized user",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_sessions",
    description: "List browser sessions",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  },
  {
    name: "get_session",
    description: "Get a session by id",
    inputSchema: {
      type: "object",
      properties: { session_id: { type: "string" } },
      required: ["session_id"],
    },
  },
  {
    name: "create_session",
    description: "Create a real browser session",
    inputSchema: {
      type: "object",
      properties: { region: { type: "string" }, timeout: { type: "number" } },
    },
  },
  {
    name: "get_docs",
    description: "API endpoints, auth headers, and code examples",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_pages",
    description: "List all product pages",
    inputSchema: { type: "object", properties: {} },
  },
];

async function runTool(name: string, args: any, userId: string, origin: string) {
  const db = serviceDb();

  if (name === "get_workspace") {
    const { data: project } = await db.from("bb_projects").select("*").eq("user_id", userId).limit(1).maybeSingle();
    const { data: keys } = await db
      .from("bb_api_keys")
      .select("id, full_key, active, created_at")
      .eq("user_id", userId)
      .eq("active", true);
    return {
      projectId: project?.id,
      projectName: project?.name,
      apiKeyPreview: keys?.[0]?.full_key,
      pages: ["/dashboard", "/api-keys", "/users", "/docs", "/playgrounds/rest"],
    };
  }

  if (name === "get_api_keys") {
    const { data } = await db
      .from("bb_api_keys")
      .select("id, full_key, key_prefix, active, project_id, created_at, name")
      .eq("user_id", userId);
    return { keys: data || [] };
  }

  if (name === "list_sessions") {
    const limit = Math.min(Number(args?.limit) || 20, 50);
    const { data } = await db
      .from("bb_sessions")
      .select("id, status, region, created_at, connect_url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return { sessions: data || [] };
  }

  if (name === "get_session") {
    const { data } = await db
      .from("bb_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("id", args.session_id)
      .maybeSingle();
    return data || { error: "not_found" };
  }

  if (name === "create_session") {
    const { data: project } = await db.from("bb_projects").select("id").eq("user_id", userId).limit(1).maybeSingle();
    if (!project) return { error: "no_project" };
    const region = args?.region || "us-west-2";
    const ttlMs = (args?.timeout || 300) * 1000;
    const sessionId = generateSessionId();
    const real = await createRealBrowserSession({ region, ttlMs });
    const now = new Date();
    const row = {
      id: sessionId,
      project_id: project.id,
      user_id: userId,
      status: "RUNNING",
      region,
      connect_url: real.connectUrl,
      started_at: now.toISOString(),
      expires_at: new Date(now.getTime() + ttlMs).toISOString(),
      keep_alive: false,
      proxy_bytes: 0,
      user_metadata: { provider: "browserless", via: "mcp" },
    };
    const { data, error } = await db.from("bb_sessions").insert(row).select().single();
    if (error) return { error: error.message };
    return data;
  }

  if (name === "get_docs") {
    const { data: keys } = await db
      .from("bb_api_keys")
      .select("full_key")
      .eq("user_id", userId)
      .eq("active", true)
      .limit(1);
    const { data: project } = await db.from("bb_projects").select("id").eq("user_id", userId).limit(1).maybeSingle();
    const key = keys?.[0]?.full_key || "bb_...";
    const pid = project?.id || "proj_...";
    return {
      base: origin,
      mcp_url: `${origin}/api/mcp`,
      oauth_authorize: `${origin}/oauth/authorize`,
      auth_headers: {
        Authorization: `Bearer ${key}`,
        "x-bb-api-key": key,
        "x-bb-project-id": pid,
      },
      endpoints: [
        { method: "POST", path: "/api/v1/sessions" },
        { method: "GET", path: "/api/v1/sessions" },
        { method: "GET", path: "/api/v1/sessions/:id" },
        { method: "POST", path: "/api/mcp" },
      ],
    };
  }

  if (name === "list_pages") {
    return {
      pages: [
        { path: "/dashboard", name: "Home / Dashboard" },
        { path: "/api-keys", name: "API Keys" },
        { path: "/users", name: "Users" },
        { path: "/email-alerts", name: "Email Alerts" },
        { path: "/playgrounds/browserql", name: "BrowserQL Editor" },
        { path: "/playgrounds/baas-debugger", name: "BaaS Debugger" },
        { path: "/playgrounds/rest", name: "REST API Playground" },
        { path: "/tools/logs", name: "Logs" },
        { path: "/tools/code-generator", name: "Code Generator" },
        { path: "/docs", name: "API Documentation" },
        { path: "/docs/mcp", name: "MCP Connect" },
      ],
    };
  }

  return { error: `Unknown tool: ${name}` };
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  // Discovery + health for connectors that probe with GET
  return json({
    name: "BrowserBase MCP",
    mcp_url: `${origin}/api/mcp`,
    oauth: {
      authorize: `${origin}/oauth/authorize`,
      token: `${origin}/oauth/token`,
      metadata: `${origin}/.well-known/oauth-authorization-server`,
    },
    allowed_clients: ["chatgpt", "claude", "gemini", "grok", "lovable", "base44", "cursor", "codex"],
    protocol: "json-rpc-2.0",
    methods: ["initialize", "tools/list", "tools/call", "ping"],
  });
}

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const auth = await authMcp(req);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const method = body.method as string;
  const id = body.id ?? null;

  if (method === "initialize") {
    return json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "browserbase-clone-mcp", version: "1.0.0" },
        instructions:
          "OAuth required. Allowed: ChatGPT, Claude, Gemini, Grok, Lovable, Base44, Cursor, Codex.",
      },
    });
  }

  if (method === "tools/list" || method === "tools/listChanged") {
    return json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
  }

  if (method === "tools/call") {
    if (!auth) {
      return json(
        {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32001,
            message: "Unauthorized. Complete OAuth at /oauth/authorize first.",
          },
        },
        401
      );
    }
    const toolName = body.params?.name;
    const args = body.params?.arguments || {};
    try {
      const result = await runTool(toolName, args, auth.userId, origin);
      return json({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
      });
    } catch (e: any) {
      return json({
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: e?.message || "tool_error" },
      });
    }
  }

  if (method === "ping" || method === "notifications/initialized") {
    return json({ jsonrpc: "2.0", id, result: {} });
  }

  return json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  });
}

export async function DELETE() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
