import { describe, expect, it } from 'vitest';
import {
  decryptProviderCredential,
  encryptProviderCredential,
  providerCredentialKeyFromEnv,
} from '../../src/security/provider-credentials.js';

describe('provider credential encryption', () => {
  it('round-trips a provider credential with AES-256-GCM without exposing plaintext', () => {
    const key = new Uint8Array(32).fill(7);
    const plaintext = 'sk-admin-super-secret';

    const ciphertext = encryptProviderCredential(plaintext, key);

    expect(ciphertext).toMatch(/^v1:/);
    expect(ciphertext).not.toContain(plaintext);
    expect(decryptProviderCredential(ciphertext, key)).toBe(plaintext);
  });

  it('uses a random nonce so the same credential encrypts differently each time', () => {
    const key = new Uint8Array(32).fill(9);

    const first = encryptProviderCredential('same-secret', key);
    const second = encryptProviderCredential('same-secret', key);

    expect(first).not.toBe(second);
    expect(decryptProviderCredential(first, key)).toBe('same-secret');
    expect(decryptProviderCredential(second, key)).toBe('same-secret');
  });

  it('parses exactly 32 bytes of base64url key material from the environment', () => {
    const encoded = Buffer.from(new Uint8Array(32).fill(5)).toString('base64url');
    const parsed = providerCredentialKeyFromEnv(encoded);

    expect(parsed).toHaveLength(32);
    expect(Array.from(parsed)).toEqual(Array.from(new Uint8Array(32).fill(5)));
    expect(() => providerCredentialKeyFromEnv(undefined)).toThrow(
      'PROVIDER_CREDENTIAL_KEY_REQUIRED',
    );
    expect(() => providerCredentialKeyFromEnv('too-short')).toThrow(
      'PROVIDER_CREDENTIAL_KEY_INVALID',
    );
  });

  it('rejects invalid keys and tampered ciphertext safely', () => {
    const key = new Uint8Array(32).fill(3);
    const secret = 'anthropic-admin-secret';
    const ciphertext = encryptProviderCredential(secret, key);

    expect(() => encryptProviderCredential(secret, new Uint8Array(31))).toThrow(
      'PROVIDER_CREDENTIAL_KEY_INVALID',
    );
    expect(() =>
      decryptProviderCredential(ciphertext, new Uint8Array(31)),
    ).toThrow('PROVIDER_CREDENTIAL_KEY_INVALID');

    const tampered =
      ciphertext.slice(0, -1) + (ciphertext.endsWith('A') ? 'B' : 'A');
    expect(() => decryptProviderCredential(tampered, key)).toThrow(
      'PROVIDER_CREDENTIAL_DECRYPT_FAILED',
    );
    expect(() => decryptProviderCredential(tampered, key)).not.toThrow(secret);
  });

  it('rejects empty credentials and malformed envelopes with safe errors', () => {
    const key = new Uint8Array(32).fill(1);

    expect(() => encryptProviderCredential('   ', key)).toThrow(
      'PROVIDER_CREDENTIAL_REQUIRED',
    );
    expect(() => decryptProviderCredential('not-an-envelope', key)).toThrow(
      'PROVIDER_CREDENTIAL_FORMAT_INVALID',
    );
  });
});
