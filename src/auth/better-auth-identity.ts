export type RuntimeIdentity = Readonly<{
  input: unknown;
  allowProvision: boolean;
}>;

export type BetterAuthUserSession = Readonly<{
  user: Readonly<{
    id: string;
    email: string;
    emailVerified: boolean;
  }>;
}> | null;

export function parseBetterAuthIdentity(
  session: BetterAuthUserSession,
): RuntimeIdentity | null {
  const user = session?.user;
  if (
    user === undefined ||
    user.id.length === 0 ||
    user.email.length === 0 ||
    !user.emailVerified
  ) {
    return null;
  }

  return Object.freeze({
    input: Object.freeze({
      provider: 'better-auth/google',
      subject: user.id,
      email: user.email,
      emailVerified: true,
    }),
    allowProvision: true,
  });
}
