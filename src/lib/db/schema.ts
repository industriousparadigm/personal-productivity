import { pgTable, text, timestamp, integer, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  password: text('password'), // Bcrypt hashed password
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (vt) => ({
  pk: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

export const commitments = pgTable('commitments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  who: text('who').notNull(),
  what: text('what').notNull(),
  when: timestamp('when').notNull(),
  status: text('status').notNull().default('pending'), // pending, completed, rescheduled
  completedAt: timestamp('completed_at'),
  rescheduledAt: timestamp('rescheduled_at'),
  rescheduledTo: timestamp('rescheduled_to'),
  rescheduledReason: text('rescheduled_reason'),
  snoozeCount: integer('snooze_count').default(0),
  lastSnoozedAt: timestamp('last_snoozed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const trustEvents = pgTable('trust_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(), // 'chased', 'commitment_broken', 'commitment_kept', 'commitment_rescheduled'
  commitmentId: uuid('commitment_id').references(() => commitments.id, { onDelete: 'set null' }),
  eventDate: timestamp('event_date').defaultNow().notNull(),
  details: text('details'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  commitments: many(commitments),
  trustEvents: many(trustEvents),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const commitmentsRelations = relations(commitments, ({ one, many }) => ({
  user: one(users, {
    fields: [commitments.userId],
    references: [users.id],
  }),
  trustEvents: many(trustEvents),
}));

export const trustEventsRelations = relations(trustEvents, ({ one }) => ({
  user: one(users, {
    fields: [trustEvents.userId],
    references: [users.id],
  }),
  commitment: one(commitments, {
    fields: [trustEvents.commitmentId],
    references: [commitments.id],
  }),
}));