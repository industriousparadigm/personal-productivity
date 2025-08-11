import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

// Simple auth that works without external services
export const authOptions: NextAuthOptions = {
  // No adapter needed for JWT strategy with credentials
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

          // Hash the password properly
          const hashedPassword = await bcrypt.hash(credentials.password, 10);

          const userId = nanoid();
          const [newUser] = await db
            .insert(users)
            .values({
              id: userId,
              email: credentials.email,
              name: credentials.email.split('@')[0],
              password: hashedPassword, // Properly hashed password
            })
            .returning();

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          };
        }

        // User exists - verify password with bcrypt
        if (!user.password) {
          throw new Error('Invalid email or password');
        }

        const passwordValid = await bcrypt.compare(credentials.password, user.password);
        if (!passwordValid) {
          throw new Error('Invalid email or password');
        }

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