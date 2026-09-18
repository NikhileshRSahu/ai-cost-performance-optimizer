import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';
const IV_BYTES = 12;
const KEY_BYTES = 32;
const AUTH_TAG_BYTES = 16;

function requireKey(key: Uint8Array): Buffer {
  if (key.byteLength !== KEY_BYTES) {
    throw new Error('PROVIDER_CREDENTIAL_KEY_INVALID');
  }
  return Buffer.from(key);
}

function encode(value: Uint8Array): string {
  return Buffer.from(value).toString('base64url');
}

function decode(value: string): Buffer {
  try {
    return Buffer.from(value, 'base64url');
  } catch {
    throw new Error('PROVIDER_CREDENTIAL_FORMAT_INVALID');
  }
}

export function providerCredentialKeyFromEnv(
  value: string | undefined,
): Uint8Array {
  if (value === undefined || value.trim().length === 0) {
    throw new Error('PROVIDER_CREDENTIAL_KEY_REQUIRED');
  }

  const decoded = Buffer.from(value, 'base64url');
  if (decoded.byteLength !== KEY_BYTES) {
    throw new Error('PROVIDER_CREDENTIAL_KEY_INVALID');
  }
  return new Uint8Array(decoded);
}

export function encryptProviderCredential(
  plaintext: string,
  key: Uint8Array,
): string {
  if (plaintext.trim().length === 0) {
    throw new Error('PROVIDER_CREDENTIAL_REQUIRED');
  }

  const encryptionKey = requireKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [VERSION, encode(iv), encode(tag), encode(ciphertext)].join(':');
}

export function decryptProviderCredential(
  envelope: string,
  key: Uint8Array,
): string {
  const encryptionKey = requireKey(key);
  const parts = envelope.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('PROVIDER_CREDENTIAL_FORMAT_INVALID');
  }

  const iv = decode(parts[1] ?? '');
  const tag = decode(parts[2] ?? '');
  const ciphertext = decode(parts[3] ?? '');
  if (iv.byteLength !== IV_BYTES || tag.byteLength !== AUTH_TAG_BYTES) {
    throw new Error('PROVIDER_CREDENTIAL_FORMAT_INVALID');
  }

  try {
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error('PROVIDER_CREDENTIAL_DECRYPT_FAILED');
  }
}
