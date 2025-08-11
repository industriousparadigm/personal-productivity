import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { customAdapter } from './adapter';

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER || 'console',
      from: process.env.EMAIL_FROM || 'noreply@oathkeeper.app',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};