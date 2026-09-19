/**
 * Firebase Realtime Database (REST) — server-side dual-write helper.
 * Client config values come from env (never hardcode secrets in production).
 */

export function getFirebaseConfig() {
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey =
    process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!databaseURL && !projectId) return null;

  const url =
    databaseURL ||
    (projectId
      ? `https://${projectId}-default-rtdb.firebaseio.com`
      : null);

  return {
    apiKey: apiKey || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    databaseURL: url!.replace(/\/$/, ""),
    projectId: projectId || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };
}

function rtdbPath(collection: string, id?: string) {
  const base = `backend/${collection}`;
  return id ? `${base}/${id}` : base;
}

export async function firebaseWrite(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const cfg = getFirebaseConfig();
  if (!cfg?.databaseURL) return { ok: false, error: "Firebase not configured" };

  const url = `${cfg.databaseURL}/${rtdbPath(collection, id)}.json`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        _id: id,
        _collection: collection,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: t || `Firebase HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Firebase write failed" };
  }
}

export async function firebaseDelete(
  collection: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const cfg = getFirebaseConfig();
  if (!cfg?.databaseURL) return { ok: false, error: "Firebase not configured" };

  const url = `${cfg.databaseURL}/${rtdbPath(collection, id)}.json`;
  try {
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: `Firebase HTTP ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Firebase delete failed" };
  }
}

export async function firebaseList(
  collection: string
): Promise<{ ok: boolean; docs?: any[]; error?: string }> {
  const cfg = getFirebaseConfig();
  if (!cfg?.databaseURL) return { ok: false, error: "Firebase not configured" };

  const url = `${cfg.databaseURL}/${rtdbPath(collection)}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: `Firebase HTTP ${res.status}` };
    const data = await res.json();
    if (!data) return { ok: true, docs: [] };
    const docs = Object.entries(data).map(([id, val]) => ({
      id,
      ...(typeof val === "object" && val ? val : { value: val }),
    }));
    return { ok: true, docs };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Firebase list failed" };
  }
}
