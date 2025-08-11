# CLAUDE.md - AI Assistant Context

## Project Overview

**Oathkeeper** is a commitment tracking system designed to help users stop breaking promises. It's a Next.js application with a PostgreSQL database that enforces radical accountability through uncomfortable but necessary features.

## Core Philosophy

This application is built on the principle of **brutal honesty**. It doesn't sugar-coat failures or make excuses. When working on this codebase:
- Use direct language ("broken promise" not "delayed")
- Prioritize speed and functionality over aesthetics
- Make the uncomfortable visible (red banners, shame metrics)
- Force accountability (un-dismissible modals, commitment blockers)

## Technical Architecture

### Stack
- **Framework**: Next.js 15.4 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Neon
- **ORM**: Drizzle ORM
- **Auth**: NextAuth with credentials (email/password)
- **Password Security**: Bcrypt with salt rounds of 10
- **Styling**: Tailwind CSS 4
- **Deployment**: Vercel

### Key Dependencies
- `chrono-node`: Natural language date parsing (fast, local)
- `@anthropic-ai/sdk`: AI-enhanced date parsing for complex business phrases
- `date-fns`: Date manipulation
- `react-hot-toast`: Notifications
- `lucide-react`: Icons
- `bcryptjs`: Password hashing (NEVER store plain text passwords)

## Database Schema

### Core Tables
- `users`: Authentication users (includes bcrypt hashed passwords)
- `commitments`: The promises made
- `trustEvents`: Track when users are chased or break promises
- `sessions`, `accounts`, `verificationTokens`: NextAuth tables (unused with JWT strategy)

### Commitment States
- `pending`: Active commitment
- `completed`: Successfully delivered
- `rescheduled`: Moved to a new date (creates new commitment)

## Critical Business Logic

### Commitment Entry Rules
1. **Blocker**: Cannot add new commitments when 3+ are overdue
2. **Fields**: Who (free text), What (free text), When (natural language)
3. **Speed**: Must complete in <30 seconds

### Daily Check (2PM)
- Triggers at exactly 14:00 local time
- Shows ALL overdue + due today commitments
- **Cannot be dismissed** until all items addressed
- Each commitment must be: completed, rescheduled, or snoozed

### Snooze Limits
- Maximum 2 snoozes per commitment
- Each snooze is 1 hour
- After 2 snoozes, must complete or reschedule

### Trust Score
- Primary metric: "Days since someone had to chase you"
- Resets to 0 when a `chased` event is logged
- Weekly stats: kept vs broken ratio

## Development Guidelines

### When Making Changes

#### DO:
- Maintain sub-5 second page load times
- Keep forms simple and fast
- Show uncomfortable truths prominently
- Test on mobile first
- Run `npm run lint` and `npm run build` before committing

#### DON'T:
- Add categories, tags, or complex taxonomy
- Implement dark mode or themes
- Create native apps
- Add AI suggestions or automation
- Hide or minimize failure states

### Common Tasks

#### Add New Commitment Field
1. Update schema in `src/lib/db/schema.ts`
2. Run `npm run db:push`
3. Update API routes in `src/app/api/commitments/route.ts`
4. Update form in `src/components/CommitmentForm.tsx`
5. Update TypeScript interfaces in components

#### Modify Daily Check Time
- Edit trigger time in `src/components/DailyCheck.tsx` line ~28
- Currently hardcoded to 14:00 (2PM)

#### Change Overdue Limit
- Update limit check in `src/app/api/commitments/route.ts` line ~72
- Update UI blocker in `src/app/page.tsx` line ~72

#### Adjust Work Hours End Time
- Update AI prompt in `src/lib/utils/ai-date-parser.ts` line ~144
- Update EOD parsing in same file line ~72
- Currently set to 18:00 (6 PM)

## Testing Approach

### Manual Testing Checklist
- [ ] Can add commitment in <30 seconds
- [ ] 3+ overdue blocks new commitments
- [ ] Daily check appears at 2PM
- [ ] Daily check cannot be dismissed with pending items
- [ ] Reschedule generates correct message
- [ ] Trust score updates correctly
- [ ] Mobile responsive at all breakpoints

### Automated Tests
- Date parsing tests in `src/lib/utils/date.test.ts`
- Run with: `npx tsx src/lib/utils/date.test.ts`

## Deployment Process

### Environment Variables Required
```
DATABASE_URL          # Neon PostgreSQL connection string
NEXTAUTH_SECRET       # 32+ character random string  
NEXTAUTH_URL          # Production URL
ANTHROPIC_API_KEY     # For AI date parsing (optional but recommended)
```

### Deploy Commands
```bash
npm run build         # Verify build passes
git push origin main  # Auto-deploys to Vercel
npx vercel --prod    # Manual production deploy
```

## Critical Implementation Details

### AI Date Parser (`src/lib/utils/ai-date-parser.ts`)
- **Dual parsing strategy**: Uses chrono-node first (fast), falls back to AI for complex phrases
- **Smart detection**: Keywords like "workday", "COB", "business hours" trigger AI parsing
- **Work hours**: EOD/COB/workday = 6 PM, calendar days = 11:59 PM
- **Performance**: Local parsing ~20ms, AI parsing ~500-700ms
- **Debug logging**: Comprehensive logging shows what parser was used and why

### Authentication Gotchas
- **No magic links**: Uses simple email/password with bcrypt
- **JWT strategy**: No database adapter needed
- **Auto-signup**: First login creates account automatically
- **Password minimum**: 6 characters
- **CRITICAL**: Always use bcrypt.hash() and bcrypt.compare() - NEVER plain text

### Delete Functionality
- **Experimental only**: Commitments can be deleted from history view
- **Complete removal**: No trust events logged, as if commitment never existed
- **Foreign key order**: Cannot log trust events after deletion (violates constraints)
- **UI update**: Must refresh commitment list after successful deletion

### Component Refresh Patterns
- **TrustScore**: Uses `refreshTrigger` prop to update when commitments change
- **CommitmentHistory**: Pass `onRefresh` callback to update parent state
- **Optimistic updates**: Avoided in favor of server confirmation

## Known Issues & Limitations

1. **Authentication**: Simple email/password system - no OAuth or social logins
2. **Timezone**: 2PM check uses browser local time, not user preference
3. **No Recurring**: Doesn't support recurring commitments by design
4. **Single User**: No team features or sharing
5. **AI Rate Limits**: Anthropic API has rate limits - fallback to local parsing if exceeded

## Future Considerations

If extending this project, maintain the core philosophy:
- Speed over features
- Discomfort over convenience  
- Accountability over excuses

### Potential Additions (that fit philosophy)
- SMS reminders for overdue items
- Public shame board (optional)
- Integration with calendar for time blocking
- Commitment delegation tracking

### Never Add
- Soft language options
- Excuse or reason fields
- Automated completion
- OAuth providers (keep auth simple and fast)

## Support & Maintenance

This is a personal tool built for one user's accountability. It's intentionally uncomfortable and unforgiving. That's not a bug, it's the entire point.

When in doubt, ask: "Will this help someone stop breaking promises, or give them an excuse to keep breaking them?"

---

*Built to make broken promises painful enough that you stop making them.*