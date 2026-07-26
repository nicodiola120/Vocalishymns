import { isAdsRemoved, removeBanner } from "./ads";

// MUST match scripts/generate-voucher.js
const SECRET = "choralis-voucher-secret-2025";
const PREFIX = "CHO";
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GROUP_LEN = 4;
const CODE_GROUPS = 3;
const MAX_CODES = 500;

// jsonbin.io config
const JSONBIN_KEY = "$2a$10$K317BHhzIz1.GKUyWu4L0uUWmAebGRIuco9mULGBbihoWRInTgzva";
const JSONBIN_ID = "6a64c791da38895dfe8e7449";

function stripPrefix(code: string): string {
  return code.toUpperCase().replace(/[^A-Z2-9]/g, "");
}

async function hmacSha256(key: string, msg: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return new Uint8Array(sig);
}

function bytesToCode(bytes: Uint8Array): string {
  let code = "";
  for (let i = 0; i < GROUP_LEN * CODE_GROUPS; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}

async function fetchUsedCodes(): Promise<number[]> {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
      headers: { "X-Access-Key": JSONBIN_KEY },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.record?.usedIndices ?? [];
  } catch {
    return [];
  }
}

async function saveUsedCodes(indices: number[]): Promise<void> {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
      method: "PUT",
      headers: {
        "X-Access-Key": JSONBIN_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usedIndices: indices }),
    });
  } catch (err) {
    console.warn("[Voucher] Failed to save to jsonbin:", err);
  }
}

export async function redeemVoucher(code: string): Promise<boolean> {
  if (isAdsRemoved()) return false;

  const cleaned = stripPrefix(code);
  if (cleaned.length !== GROUP_LEN * CODE_GROUPS) return false;

  const used = await fetchUsedCodes();
  const usedSet = new Set(used);

  for (let i = 0; i < MAX_CODES; i++) {
    if (usedSet.has(i)) continue;
    const hmac = await hmacSha256(SECRET, "v" + i);
    const expected = bytesToCode(hmac);
    if (cleaned === expected) {
      used.push(i);
      await saveUsedCodes(used);
      return true;
    }
  }
  return false;
}

export function isVoucherRedeemed(): boolean {
  return isAdsRemoved();
}
