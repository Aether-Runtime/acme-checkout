import { randomUUID } from 'node:crypto';

/**
 * Anonymous storefront sessions. A browser asks for a session token once and
 * sends it on every cart and checkout request; carts are keyed by token.
 * In-memory like the rest of the demo service.
 */

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface Session {
  token: string;
  createdAt: number;
  expiresAt: number;
}

const sessions = new Map<string, Session>();

export function resetAuth(): void {
  sessions.clear();
}

export function issueSession(now = Date.now()): Session {
  const session: Session = {
    token: `sess_${randomUUID()}`,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  sessions.set(session.token, session);
  return session;
}

/** Returns the session for a token, dropping it once expired. */
export function validateSession(token: string, now = Date.now()): Session | null {
  const session = sessions.get(token);
  if (!session) {
    return null;
  }
  if (session.expiresAt <= now) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function activeSessionCount(now = Date.now()): number {
  let count = 0;
  for (const session of sessions.values()) {
    if (session.expiresAt > now) {
      count += 1;
    }
  }
  return count;
}
