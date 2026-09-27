// Edge(debug-env) + Node(Server Actions) 양쪽에서 동일하게 동작해야 하므로
// Web Crypto API(crypto.subtle)만 사용한다.

export const ADMIN_SESSION_COOKIE = "bojo24_admin_session";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8시간

export function isAdminPasswordConfigured(): boolean {
    return Boolean(process.env.ADMIN_PASSWORD);
}

async function getSessionSigningKey(): Promise<CryptoKey> {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
        throw new Error("ADMIN_PASSWORD is not configured");
    }

    // ADMIN_PASSWORD를 그대로 HMAC 키로 쓰지 않고 SHA-256으로 파생시켜 사용한다.
    const passwordBytes = new TextEncoder().encode(password);
    const derivedKeyBytes = await crypto.subtle.digest("SHA-256", passwordBytes);

    return crypto.subtle.importKey(
        "raw",
        derivedKeyBytes,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
    );
}

const toHex = (buffer: ArrayBuffer): string =>
    Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

const fromHex = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
};

export async function createAdminSessionToken(): Promise<string> {
    const key = await getSessionSigningKey();
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const payload = String(expiresAt);
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return `${payload}.${toHex(signature)}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
    if (!token || !isAdminPasswordConfigured()) return false;

    const separatorIndex = token.indexOf(".");
    if (separatorIndex === -1) return false;

    const payload = token.slice(0, separatorIndex);
    const signatureHex = token.slice(separatorIndex + 1);

    const expiresAt = Number(payload);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

    let signatureBytes: Uint8Array;
    try {
        signatureBytes = fromHex(signatureHex);
    } catch {
        return false;
    }

    try {
        const key = await getSessionSigningKey();
        return await crypto.subtle.verify(
            "HMAC",
            key,
            signatureBytes.buffer as ArrayBuffer,
            new TextEncoder().encode(payload),
        );
    } catch {
        return false;
    }
}
