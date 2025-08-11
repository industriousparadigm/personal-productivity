import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/simple-auth';
import { db } from '@/lib/db';
import { commitments, trustEvents } from '@/lib/db/schema';
import { eq, and, desc, lte } from 'drizzle-orm';
import { z } from 'zod';
import { parseDate } from '@/lib/utils/date';

const createCommitmentSchema = z.object({
  who: z.string().min(1, 'Who is required'),
  what: z.string().min(1, 'What is required'),
  when: z.string().min(1, 'When is required'),
});

const updateCommitmentSchema = z.object({
  status: z.enum(['completed', 'rescheduled']).optional(),
  rescheduledTo: z.string().optional(),
  rescheduledReason: z.string().optional(),
  snooze: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userCommitments = await db
      .select()
      .from(commitments)
      .where(eq(commitments.userId, session.user.id))
      .orderBy(desc(commitments.when));

    return NextResponse.json(userCommitments);
  } catch (error) {
    console.error('Error fetching commitments:', error);
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
    const validatedData = createCommitmentSchema.parse(body);

    // Parse the date
    const parsedDate = parseDate(validatedData.when);
    if (!parsedDate) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Check if user has 3+ overdue commitments
    const now = new Date();
    const overdueCommitments = await db
      .select()
      .from(commitments)
      .where(
        and(
          eq(commitments.userId, session.user.id),
          eq(commitments.status, 'pending'),
          lte(commitments.when, now)
        )
      );

    if (overdueCommitments.length >= 3) {
      return NextResponse.json(
        { error: 'You have 3 broken promises. Fix those first.' },
        { status: 400 }
      );
    }

    // Create the commitment
    const [newCommitment] = await db
      .insert(commitments)
      .values({
        userId: session.user.id,
        who: validatedData.who,
        what: validatedData.what,
        when: parsedDate,
        status: 'pending',
      })
      .returning();

    return NextResponse.json(newCommitment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating commitment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const commitmentId = url.searchParams.get('id');
    if (!commitmentId) {
      return NextResponse.json({ error: 'Commitment ID required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateCommitmentSchema.parse(body);

    // Get the commitment
    const [commitment] = await db
      .select()
      .from(commitments)
      .where(
        and(
          eq(commitments.id, commitmentId),
          eq(commitments.userId, session.user.id)
        )
      );

    if (!commitment) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 });
    }

    // Handle different update types
    if (validatedData.snooze) {
      // Check snooze count
      const currentSnoozeCount = commitment.snoozeCount || 0;
      if (currentSnoozeCount >= 2) {
        return NextResponse.json({ error: 'Maximum snoozes reached' }, { status: 400 });
      }

      const [updated] = await db
        .update(commitments)
        .set({
          snoozeCount: currentSnoozeCount + 1,
          lastSnoozedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(commitments.id, commitmentId))
        .returning();

      return NextResponse.json(updated);
    }

    if (validatedData.status === 'completed') {
      const [updated] = await db
        .update(commitments)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(commitments.id, commitmentId))
        .returning();

      // Log trust event
      await db.insert(trustEvents).values({
        userId: session.user.id,
        eventType: 'commitment_kept',
        commitmentId: commitmentId,
      });

      return NextResponse.json(updated);
    }

    if (validatedData.status === 'rescheduled' && validatedData.rescheduledTo) {
      const newDate = parseDate(validatedData.rescheduledTo);
      if (!newDate) {
        return NextResponse.json({ error: 'Invalid reschedule date' }, { status: 400 });
      }

      const [updated] = await db
        .update(commitments)
        .set({
          status: 'rescheduled',
          rescheduledAt: new Date(),
          rescheduledTo: newDate,
          rescheduledReason: validatedData.rescheduledReason,
          updatedAt: new Date(),
        })
        .where(eq(commitments.id, commitmentId))
        .returning();

      // Log trust event
      await db.insert(trustEvents).values({
        userId: session.user.id,
        eventType: 'commitment_rescheduled',
        commitmentId: commitmentId,
        details: validatedData.rescheduledReason,
      });

      // Create new commitment for the rescheduled date
      await db.insert(commitments).values({
        userId: session.user.id,
        who: commitment.who,
        what: commitment.what,
        when: newDate,
        status: 'pending',
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating commitment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}