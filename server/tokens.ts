import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}

export function expiryFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
