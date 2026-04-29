import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "luxgenz-staff-secret-key-2024"
);

export interface SessionPayload {
  userId: number;
  username: string;
  role: "owner" | "admin" | "staff";
  staffRole: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(SECRET);
  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
