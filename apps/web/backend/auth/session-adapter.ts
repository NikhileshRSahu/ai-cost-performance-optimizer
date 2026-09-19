import type { AuthenticatedSession } from '../workbench/authz.js';
import {
  parseTrustedPasswordlessIdentity,
  type TrustedPasswordlessIdentity,
} from './contracts.js';

export type IdentitySessionRepository = Readonly<{
  sessionForIdentity(
    identity: TrustedPasswordlessIdentity,
  ): Promise<AuthenticatedSession | null>;
}>;

export type PasswordlessSessionAdapter = Readonly<{
  resolve(input: unknown): Promise<AuthenticatedSession | null>;
}>;

export function createPasswordlessSessionAdapter(
  repository: IdentitySessionRepository,
): PasswordlessSessionAdapter {
  return Object.freeze({
    async resolve(input: unknown): Promise<AuthenticatedSession | null> {
      const identity = parseTrustedPasswordlessIdentity(input);
      return repository.sessionForIdentity(identity);
    },
  });
}

export { parseTrustedPasswordlessIdentity };
