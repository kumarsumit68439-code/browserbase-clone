import { createHash, randomBytes } from "crypto";

/** Generate a high-entropy code_verifier (43-128 chars, unreserved) */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** S256 code_challenge = BASE64URL(SHA256(verifier)) */
export function challengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function verifyPkce(
  verifier: string,
  challenge: string,
  method: string
): boolean {
  if (!challenge) {
    // No PKCE was negotiated at authorize time
    return !verifier;
  }
  if (!verifier) return false;

  const m = (method || "S256").toUpperCase();
  if (m === "S256") {
    return challengeS256(verifier) === challenge;
  }
  if (m === "PLAIN") {
    return verifier === challenge;
  }
  return false;
}

export function normalizeChallengeMethod(method?: string | null): "S256" | "plain" {
  if (!method) return "S256";
  const m = method.toUpperCase();
  if (m === "PLAIN") return "plain";
  return "S256";
}
