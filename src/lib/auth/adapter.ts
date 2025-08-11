import { 
  Adapter, 
  AdapterUser, 
  AdapterAccount, 
  AdapterSession, 
  VerificationToken 
} from 'next-auth/adapters';
import { db } from '@/lib/db';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const customAdapter: Adapter = {
  async createUser(data: Omit<AdapterUser, 'id'>) {
    const id = nanoid();
    const [user] = await db.insert(users).values({
      id,
      email: data.email,
      name: data.name ?? null,
      emailVerified: data.emailVerified ?? null,
      image: data.image ?? null,
    }).returning();
    return { 
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified ?? null,
      image: user.image,
    };
  },
  
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return null;
    return { ...user, emailVerified: user.emailVerified ?? null };
  },
  
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return null;
    return { ...user, emailVerified: user.emailVerified ?? null };
  },
  
  async getUserByAccount({ providerAccountId, provider }) {
    const [result] = await db
      .select({ user: users })
      .from(accounts)
      .innerJoin(users, eq(users.id, accounts.userId))
      .where(
        and(
          eq(accounts.providerAccountId, providerAccountId),
          eq(accounts.provider, provider)
        )
      );
    
    if (!result) return null;
    return { ...result.user, emailVerified: result.user.emailVerified ?? null };
  },
  
  async updateUser(user: Partial<AdapterUser>) {
    const [updated] = await db
      .update(users)
      .set({
        ...user,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id!))
      .returning();
    return { ...updated, emailVerified: updated.emailVerified ?? null };
  },
  
  async deleteUser(userId) {
    await db.delete(users).where(eq(users.id, userId));
  },
  
  async linkAccount(account: AdapterAccount) {
    await db.insert(accounts).values({
      ...account,
      id: nanoid(),
    });
  },
  
  async unlinkAccount({ providerAccountId, provider }) {
    await db
      .delete(accounts)
      .where(
        and(
          eq(accounts.providerAccountId, providerAccountId),
          eq(accounts.provider, provider)
        )
      );
  },
  
  async createSession(session: AdapterSession) {
    const [created] = await db.insert(sessions).values({
      ...session,
      id: nanoid(),
    }).returning();
    return created;
  },
  
  async getSessionAndUser(sessionToken) {
    const [result] = await db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.sessionToken, sessionToken));
    
    if (!result) return null;
    
    return {
      session: result.session,
      user: { ...result.user, emailVerified: result.user.emailVerified ?? null },
    };
  },
  
  async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>) {
    const [updated] = await db
      .update(sessions)
      .set(session)
      .where(eq(sessions.sessionToken, session.sessionToken))
      .returning();
    return updated;
  },
  
  async deleteSession(sessionToken) {
    await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
  },
  
  async createVerificationToken(verificationToken: VerificationToken) {
    const [created] = await db.insert(verificationTokens).values(verificationToken).returning();
    return created;
  },
  
  async useVerificationToken({ identifier, token }) {
    const [verificationToken] = await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token)
        )
      )
      .returning();
    
    if (!verificationToken) return null;
    return verificationToken;
  },
};