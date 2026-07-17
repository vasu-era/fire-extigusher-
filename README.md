# Fire Extinguisher Management System

Modern Next.js application for managing fire extinguisher sales, refilling, and certification.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Features

- Customer management (CRUD)
- Automatic certificate number generation
- Certificate printing with QR codes
- Customer renewal system
- Financial year filtering
- Monthly reports
- Expiry tracking
- Dashboard analytics
- Excel export

## Setup Instructions

### 1. Clone the Repository

```bash
cd fire-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor
4. Copy and run the SQL from `supabase/schema.sql`
5. Generate admin password hash:
   ```bash
   node scripts/generate-hash.js
   ```
6. Run the generated INSERT statement in Supabase SQL Editor

### 4. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Get your Supabase credentials from Settings > API
3. Update `.env.local` with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXTAUTH_SECRET=your-random-secret-min-32-chars
   NEXTAUTH_URL=http://localhost:3000
   ```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Login

- **Username**: admin
- **Password**: admin123

## Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── customers/         # Customer pages
│   ├── dashboard/         # Dashboard page
│   ├── reports/           # Report pages
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components
│   ├── customers/        # Customer components
│   ├── dashboard/        # Dashboard components
│   └── certificate/      # Certificate components
├── lib/                  # Utility functions
├── types/                # TypeScript types
└── hooks/                # Custom hooks
```

## Default Credentials

- **Username**: admin
- **Password**: admin123

**Important**: Change the default password after first login!

## License

MIT
