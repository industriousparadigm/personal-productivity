# Oathkeeper 🛡️

> Stop breaking promises. A brutally honest commitment tracking system that holds you accountable.

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green)](https://neon.tech/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

🔗 **Live Demo**: [https://personal-productivity-topaz.vercel.app](https://personal-productivity-topaz.vercel.app)

## 🎯 The Problem

Every time you tell someone "I'll do X by Y", there's no system capturing that promise. Result: broken commitments, eroded trust, and people having to chase you for updates. Oathkeeper fixes exactly ONE behavior: making promises into the void.

## ✨ Features

### Core Functionality
- **⚡ Lightning-Fast Entry**: Add commitments in under 30 seconds (Who/What/When)
- **📊 Trust Score Dashboard**: Track days since someone had to chase you
- **🔴 Overdue Tracking**: Broken promises displayed prominently in red
- **⏰ 2PM Daily Check**: Un-dismissible modal forcing you to address all urgent commitments
- **📅 Smart Rescheduling**: Pre-written apology messages with one-click copy
- **🚫 Commitment Blocker**: Can't add new promises when 3+ are overdue
- **📈 History & Patterns**: See who you disappoint most frequently

### Design Principles
- **Brutally Honest**: No euphemisms - "broken promise" not "delayed"
- **Speed Optimized**: Page load to commitment logged in <5 seconds
- **Shame as a Feature**: Red banners that won't dismiss for overdue items
- **Mobile-First**: Add commitments on the go

## 🖼️ Screenshots

### Dashboard View
- Trust score prominently displayed
- Overdue commitments in red
- Today's commitments in yellow
- Quick-add form always visible

### Daily Check Modal
- Appears at 2PM local time
- Cannot be dismissed until all items addressed
- Forces accountability for overdue commitments

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth with credentials (email/password)
- **Password Security**: Bcrypt hashing
- **Deployment**: Vercel
- **Date Parsing**: Chrono-node for natural language dates

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/industriousparadigm/personal-productivity.git
cd personal-productivity
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
```env
# Database
DATABASE_URL=your_neon_postgres_url

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_32_char_secret_here
```

4. Push database schema:
```bash
npm run db:push
```

5. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` 
   - `NEXTAUTH_URL` (your production URL)

4. Deploy!

The app auto-deploys on push to main branch.

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## 📂 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── commitments/   # CRUD for commitments
│   │   └── trust/         # Trust metrics
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── CommitmentForm.tsx
│   ├── CommitmentList.tsx
│   ├── DailyCheck.tsx
│   └── TrustScore.tsx
├── lib/                   # Utilities and configs
│   ├── auth/             # NextAuth configuration
│   ├── db/               # Database schema & connection
│   └── utils/            # Helper functions
└── middleware.ts         # Auth middleware
```

## 🔑 Key Features Explained

### Smart Date Parsing
Enter dates naturally: "today", "tomorrow 3pm", "next Friday", "in 2 hours"

### Trust Score Calculation
- Tracks days since someone had to chase you
- Weekly commitment statistics
- Pattern analysis of broken promises by person

### 2PM Daily Check
- Automatically appears at 2PM local time
- Shows all overdue and due-today commitments
- Cannot be dismissed until all are addressed
- Each item must be marked done, rescheduled, or snoozed

### Commitment Limits
- Maximum 2 snoozes per commitment (1 hour each)
- New commitments blocked when 3+ are overdue
- Forces you to clean up broken promises first

## 🤝 Contributing

This is a personal productivity tool, but suggestions are welcome:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this for your own commitment tracking needs.

## 🙏 Acknowledgments

- Built with frustration at broken promises
- Inspired by the need for radical accountability
- Designed to be uncomfortable when you're failing

---

**Remember**: This tool only works if you:
1. Log EVERY commitment you make
2. Check it daily
3. Accept the discomfort of seeing your failures

*Stop breaking promises. Start using Oathkeeper.*