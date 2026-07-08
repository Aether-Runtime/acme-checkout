import { beforeEach, describe, expect, it } from 'vitest';
import { activeSessionCount, issueSession, resetAuth, validateSession } from '../src/auth';

describe('sessions', () => {
  beforeEach(() => {
    resetAuth();
  });

  it('issues a token that authenticates requests until it expires', () => {
    const session = issueSession();
    expect(validateSession(session.token)).not.toBeNull();
    expect(validateSession('sess_bogus')).toBeNull();
    expect(activeSessionCount()).toBe(1);
    // Validation past the expiry drops the session entirely.
    expect(validateSession(session.token, session.expiresAt + 1)).toBeNull();
    expect(activeSessionCount()).toBe(0);
  });
});
