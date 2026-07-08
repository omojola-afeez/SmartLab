# SmartLab Dashboard — Setup Guide

## 1. Run the Stage 2 database migration
In Supabase → SQL Editor, run `supabase_migration_stage2.sql`
(after Stage 1's `smartlab_schema.sql`, which you've already run).

## 2. Create your first admin login
1. Supabase Dashboard → **Authentication → Users → Add User**
   Enter your email + a password. This is how you'll log into SmartLab.
2. Copy the new user's UUID from that list.
3. Back in SQL Editor, run (with your real UUID and name):
   ```sql
   insert into admin_profiles (id, full_name, role)
   values ('PASTE-USER-UUID-HERE', 'Your Name', 'superadmin');
   ```

## 3. Push this project to GitHub
```bash
cd smartlab-dashboard
git init
git add .
git commit -m "Stage 2: working login + dashboard"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/smartlab.git
git push -u origin main
```

## 4. Deploy on Vercel
1. Go to vercel.com → **Add New Project** → import your GitHub repo.
2. Before deploying, add these **Environment Variables** (Supabase → Project Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Deploy**.

## 5. Test it
Visit your Vercel URL → you'll land on `/login` → sign in with the
email/password you created in step 2 → you'll be redirected to
`/dashboard`, which shows real counts (active sessions, violations
today, registered students) pulled live from Supabase. It'll show
zeros until Stage 3 (the Windows agent) starts creating real sessions
— that's expected, not a bug.

## Local development (optional)
```bash
npm install
cp .env.local.example .env.local   # then fill in your real values
npm run dev
```
Visit http://localhost:3000
