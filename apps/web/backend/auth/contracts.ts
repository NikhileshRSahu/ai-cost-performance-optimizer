import { z } from 'zod';

const trustedPasswordlessIdentitySchema = z
  .object({
    provider: z.string().trim().min(1),
    subject: z.string().trim().min(1),
    email: z.email().transform((value) => value.toLowerCase()),
    emailVerified: z.literal(true),
  })
  .strict();

export type TrustedPasswordlessIdentity = Readonly<
  z.infer<typeof trustedPasswordlessIdentitySchema>
>;

export function parseTrustedPasswordlessIdentity(
  input: unknown,
): TrustedPasswordlessIdentity {
  return Object.freeze(trustedPasswordlessIdentitySchema.parse(input));
}
