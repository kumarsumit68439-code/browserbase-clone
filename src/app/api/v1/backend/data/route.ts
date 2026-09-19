import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { authRequest } from "@/lib/api-auth";
import { firebaseWrite, firebaseDelete, firebaseList, getFirebaseConfig } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-bb-api-key, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

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

  const collection = String(body.collection || body.table || "default").slice(0, 64);
  const action = String(body.action || "list");
  const dualWrite = body.dual_write !== false; // default true when Firebase configured
  const db = serviceDb();
  const firebaseOn = Boolean(getFirebaseConfig()?.databaseURL);

  try {
    if (action === "list") {
      const { data, error } = await db
        .from("bb_backend_docs")
        .select("*")
        .eq("user_id", auth.userId)
        .eq("collection", collection)
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(body.limit) || 50, 100));
      if (error) throw error;

      let firebaseDocs: any[] | undefined;
      if (firebaseOn && body.include_firebase) {
        const fb = await firebaseList(collection);
        if (fb.ok) firebaseDocs = fb.docs;
      }

      return NextResponse.json(
        {
          collection,
          docs: data || [],
          firebase_docs: firebaseDocs,
          backends: { supabase: true, firebase: firebaseOn },
        },
        { headers: cors }
      );
    }

    if (action === "get") {
      const { data, error } = await db
        .from("bb_backend_docs")
        .select("*")
        .eq("user_id", auth.userId)
        .eq("collection", collection)
        .eq("id", body.id)
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json({ doc: data, backends: { supabase: true, firebase: firebaseOn } }, { headers: cors });
    }

    if (action === "insert") {
      const id = body.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const payload = body.data || body.document || {};
      const row = {
        id,
        user_id: auth.userId,
        project_id: auth.projectId,
        collection,
        data: payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await db.from("bb_backend_docs").insert(row).select().single();
      if (error) throw error;

      let firebase: { ok: boolean; error?: string } | undefined;
      if (dualWrite && firebaseOn) {
        firebase = await firebaseWrite(collection, id, {
          ...payload,
          user_id: auth.userId,
          project_id: auth.projectId,
        });
      }

      return NextResponse.json(
        {
          doc: data,
          backends: { supabase: true, firebase: firebaseOn },
          firebase_write: firebase,
        },
        { status: 201, headers: cors }
      );
    }

    if (action === "update") {
      const payload = body.data || body.document || {};
      const { data, error } = await db
        .from("bb_backend_docs")
        .update({ data: payload, updated_at: new Date().toISOString() })
        .eq("user_id", auth.userId)
        .eq("collection", collection)
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;

      let firebase: { ok: boolean; error?: string } | undefined;
      if (dualWrite && firebaseOn) {
        firebase = await firebaseWrite(collection, body.id, {
          ...payload,
          user_id: auth.userId,
        });
      }

      return NextResponse.json({ doc: data, firebase_write: firebase }, { headers: cors });
    }

    if (action === "delete") {
      const { error } = await db
        .from("bb_backend_docs")
        .delete()
        .eq("user_id", auth.userId)
        .eq("collection", collection)
        .eq("id", body.id);
      if (error) throw error;

      let firebase: { ok: boolean; error?: string } | undefined;
      if (dualWrite && firebaseOn) {
        firebase = await firebaseDelete(collection, body.id);
      }

      return NextResponse.json({ ok: true, firebase_write: firebase }, { headers: cors });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400, headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message || "Database error",
        backends: { supabase: true, firebase: firebaseOn },
      },
      { status: 500, headers: cors }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await authRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });

  const collection = req.nextUrl.searchParams.get("collection") || "default";
  const db = serviceDb();
  const firebaseOn = Boolean(getFirebaseConfig()?.databaseURL);

  try {
    const { data, error } = await db
      .from("bb_backend_docs")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("collection", collection)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json(
      { collection, docs: data || [], backends: { supabase: true, firebase: firebaseOn } },
      { headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, docs: [] }, { status: 500, headers: cors });
  }
}
