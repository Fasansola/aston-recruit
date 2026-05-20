import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@aston.ae" },
      },
      async authorize(credentials) {
        // Validate input shape
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email } = parsed.data;

        // Look up the user by email — if they exist in our DB, they're authorised
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        // Return the user object — Auth.js will build the JWT from this
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Attach role and id to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error — custom field from authorize()
        token.role = user.role;
      }
      return token;
    },
    // Expose role and id on the client-side session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // @ts-expect-error — custom field
        session.user.role = token.role;
      }
      return session;
    },
  },
});
