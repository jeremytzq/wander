import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// JWT sessions: no separate user/session database needed — the Google
// account's stable `sub` (exposed on the token/session as `user.id`) is
// enough to key a signed-in user's itineraries in Redis.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  // Vercel serves the app through an internal proxy, so the Host header
  // Auth.js sees is already correct — trust it rather than requiring an
  // explicit AUTH_URL env var.
  trustHost: true,
  callbacks: {
    jwt({ token, profile }) {
      if (profile?.sub) token.sub = profile.sub;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
