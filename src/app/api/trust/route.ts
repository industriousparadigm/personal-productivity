import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/simple-auth';
import { db } from '@/lib/db';
import { commitments, trustEvents } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get last chased event
    const [lastChased] = await db
      .select()
      .from(trustEvents)
      .where(
        and(
          eq(trustEvents.userId, session.user.id),
          eq(trustEvents.eventType, 'chased')
        )
      )
      .orderBy(desc(trustEvents.eventDate))
      .limit(1);

    // Calculate days since last chased
    const daysSinceChased = lastChased
      ? Math.floor((Date.now() - new Date(lastChased.eventDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Get commitment statistics for this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekCommitments = await db
      .select({
        total: sql<number>`count(*)`,
        kept: sql<number>`count(*) filter (where status = 'completed')`,
        rescheduled: sql<number>`count(*) filter (where status = 'rescheduled')`,
        broken: sql<number>`count(*) filter (where status = 'pending' and "when" < now())`,
      })
      .from(commitments)
      .where(
        and(
          eq(commitments.userId, session.user.id),
          sql`created_at >= ${weekStart}`
        )
      );

    // Get pattern of who user breaks promises to most
    const brokenByPerson = await db
      .select({
        who: commitments.who,
        count: sql<number>`count(*)`,
      })
      .from(commitments)
      .where(
        and(
          eq(commitments.userId, session.user.id),
          eq(commitments.status, 'pending'),
          sql`"when" < now()`
        )
      )
      .groupBy(commitments.who)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return NextResponse.json({
      daysSinceChased,
      weekStats: weekCommitments[0] || { total: 0, kept: 0, rescheduled: 0, broken: 0 },
      brokenByPerson,
    });
  } catch (error) {
    console.error('Error fetching trust data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, commitmentId, details } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

    const [event] = await db
      .insert(trustEvents)
      .values({
        userId: session.user.id,
        eventType,
        commitmentId,
        details,
      })
      .returning();

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating trust event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}