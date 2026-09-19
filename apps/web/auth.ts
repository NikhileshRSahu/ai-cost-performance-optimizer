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
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
