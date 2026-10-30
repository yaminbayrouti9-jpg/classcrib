import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// Dynamically override NEXTAUTH_URL in production/Vercel environments to prevent domain mismatches
if (process.env.VERCEL_URL && (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost"))) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && !nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET must be configured in production.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        await dbConnect();
        const user = await User.findOne({ username: credentials.username.trim().toLowerCase() }).select("+password");

        if (!user) {
          throw new Error("User not found");
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordCorrect) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.displayName || user.username,
          username: user.username,
          role: user.role,
          schoolId: user.school?.toString(),
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).schoolId = token.schoolId;
      }
      return session;
    }
  },
  /* pages: {
    signIn: "/login",
  }, */
  session: {
    strategy: "jwt",
  },
  secret: nextAuthSecret,
};
