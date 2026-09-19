import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const clientId =
  process.env.GOOGLE_CLIENT_ID ||
  "504485830242-1mk5p7h8aho03phd48ma9kisath17rk4.apps.googleusercontent.com";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const googleOAuthReady = Boolean(clientId && clientSecret);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId,
      clientSecret: clientSecret || "missing-google-client-secret",
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/sign-in",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google" && account.providerAccountId) {
        token.googleSubject = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const subject =
          typeof token.googleSubject === "string"
            ? token.googleSubject
            : typeof token.sub === "string"
              ? token.sub
              : null;
        (session.user as typeof session.user & { providerSubject?: string }).providerSubject =
          subject ?? undefined;
      }
      return session;
    },
  },
});
