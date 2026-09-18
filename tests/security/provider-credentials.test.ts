import { describe, expect, it } from 'vitest';
import {
  decryptProviderCredential,
  encryptProviderCredential,
  providerCredentialKeyFromEnv,
} from '../../src/security/provider-credentials.js';

describe('provider credential encryption', () => {
  it('uses a configured 32-byte base64url key when present', () => {
    const configured = Buffer.from(new Uint8Array(32).fill(7)).toString('base64url');
    expect(Array.from(providerCredentialKeyFromEnv(configured))).toEqual(
      Array.from(new Uint8Array(32).fill(7)),
    );
  });

  it('derives a stable domain-separated key from the auth secret when dedicated key is absent', () => {
    const first = providerCredentialKeyFromEnv(undefined, 'a'.repeat(40));
    const second = providerCredentialKeyFromEnv(undefined, 'a'.repeat(40));
    const different = providerCredentialKeyFromEnv(undefined, 'b'.repeat(40));

    expect(first).toHaveLength(32);
    expect(Array.from(first)).toEqual(Array.from(second));
    expect(Array.from(first)).not.toEqual(Array.from(different));
  });

  it('round-trips a provider credential without exposing plaintext', () => {
    const key = providerCredentialKeyFromEnv(undefined, 'c'.repeat(40));
    const plaintext = 'sk-admin-super-secret';
    const ciphertext = encryptProviderCredential(plaintext, key);

    expect(ciphertext).toMatch(/^v1:/);
    expect(ciphertext).not.toContain(plaintext);
    expect(decryptProviderCredential(ciphertext, key)).toBe(plaintext);
  });

  it('rejects missing or weak fallback key material', () => {
    expect(() => providerCredentialKeyFromEnv(undefined)).toThrow(
      'PROVIDER_CREDENTIAL_KEY_REQUIRED',
    );
    expect(() => providerCredentialKeyFromEnv(undefined, 'short')).toThrow(
      'PROVIDER_CREDENTIAL_KEY_REQUIRED',
    );
  });
});
