# Complete Setup Guide - Fire Extinguisher Management System

## Table of Contents
1. [Supabase Setup](#supabase-setup)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Vercel Deployment](#vercel-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Supabase Setup

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### Step 2: Create New Project
1. Click "New Project"
2. Fill in:
   - **Name**: Fire Extinguisher Management
   - **Database Password**: (save this somewhere secure!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
3. Click "Create new project" (takes 1-2 minutes)

### Step 3: Get Your Credentials
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (KEEP SECRET!)

### Step 4: Create Database Tables
1. Go to **SQL Editor**
2. Click "New query"
3. Copy the entire content from `supabase/schema.sql`
4. Paste and click "Run"
5. Wait for success message

### Step 5: Generate Admin Password Hash
1. Open terminal in project folder:
   ```bash
   cd fire-app
   node scripts/generate-hash.js
   ```
2. Copy the generated SQL INSERT statement
3. Go back to Supabase SQL Editor
4. Click "New query"
5. Paste the INSERT statement
6. Click "Run"

### Step 6: Verify Setup
1. Go to **Table Editor**
2. You should see these tables:
   - `users`
   - `customers`
   - `extinguisher_details`
   - `customer_history`
   - `backups`
3. Click on `users` table
4. You should see 1 row with username "admin"

---

## Environment Configuration

### Step 1: Create .env.local File
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```
   Or on Linux/Mac:
   ```bash
   cp .env.local.example .env.local
   ```

### Step 2: Fill in Values
Open `.env.local` and replace the placeholders:

```env
# Replace with your actual Supabase URL
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co

# Replace with your anon/public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Replace with your service_role key (KEEP SECRET!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Generate a random secret (at least 32 characters)
NEXTAUTH_SECRET=your-super-secret-key-at-least-32-characters-long

# Keep as localhost for development
NEXTAUTH_URL=http://localhost:3000
```

### Step 3: Generate NEXTAUTH_SECRET
Use this command to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an online generator like [passwordsgenerator.net](https://passwordsgenerator.net/)

---

## Local Development

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

### Step 4: Login
- **Username**: admin
- **Password**: admin123

### Step 5: Test Features
1. Create a new customer
2. View the certificate
3. Edit the customer
4. Renew the customer
5. Check dashboard stats
6. Generate monthly report

---

## Vercel Deployment

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Click "Import"

### Step 3: Configure Environment Variables
In Vercel dashboard, go to **Settings** > **Environment Variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-project.vercel.app
```

**Important**: Change `NEXTAUTH_URL` to your Vercel deployment URL!

### Step 4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Your app will be live at: `https://your-project.vercel.app`

### Step 5: Update Supabase
1. Go back to Supabase
2. Update the `users` table password hash if needed
3. Test the live deployment

---

## Troubleshooting

### Issue: "Cannot connect to Supabase"
**Solution**: 
- Check `.env.local` credentials
- Verify Supabase project is running
- Check if service_role key is correct

### Issue: "Login failed"
**Solution**:
- Verify admin user exists in `users` table
- Check password hash is correct (bcrypt)
- Try regenerating the hash

### Issue: "Build failed on Vercel"
**Solution**:
- Check all environment variables are set
- Verify Node.js version is 18+
- Check build logs in Vercel

### Issue: "404 on API routes"
**Solution**:
- Ensure API route files exist
- Check file structure matches Next.js conventions
- Verify Supabase connection

### Issue: "QR code not generating"
**Solution**:
- Check `NEXTAUTH_URL` is set correctly
- Verify public folder has images
- Check browser console for errors

### Issue: "Certificate printing issues"
**Solution**:
- Use Chrome/Edge for best results
- Enable background graphics in print settings
- Set margins to "None"

---

## Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Never commit `.env.local` to Git
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Use HTTPS in production
- [ ] Regular database backups

---

## Support

For issues or questions:
1. Check the [README.md](README.md)
2. Review the [SDD.md](../SDD.md)
3. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
4. Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

---

## Next Steps

After deployment:
1. Test all features thoroughly
2. Add more admin users if needed
3. Set up automatic backups in Supabase
4. Consider adding email notifications
5. Monitor performance and errors

**Congratulations! Your Fire Extinguisher Management System is now live! 🎉**
