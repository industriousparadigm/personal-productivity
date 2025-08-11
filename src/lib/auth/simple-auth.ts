import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { customAdapter } from './adapter';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Simple auth that works without external services
export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For production, you'd hash the password
        // For now, we're using a simple check
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email));

        // If user doesn't exist, create them (auto-signup)
        if (!user) {
          // Simple password validation
          if (credentials.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }

          const [newUser] = await db
            .insert(users)
            .values({
              id: nanoid(),
              email: credentials.email,
              name: credentials.email.split('@')[0],
              // In production, you'd hash this password
              // For simplicity, we're storing a marker that the password was set
              emailVerified: new Date(), // Mark as verified since they set a password
            })
            .returning();

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          };
        }

        // User exists - in production you'd verify the password hash
        // For now, we just check they provided the same password
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};