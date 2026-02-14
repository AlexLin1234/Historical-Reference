# Deploy Edge Functions - Step by Step

## ✅ Supabase CLI is Already Installed!

The CLI is installed as a dev dependency. Use it with `npx supabase` commands.

---

## 🚀 Deploy in 3 Steps

### Step 1: Login to Supabase

```bash
npx supabase login
```

This opens a browser to authenticate with your Supabase account.

### Step 2: Link Your Project

First, get your **project reference ID** from Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID" (looks like: `abc123xyz`)

Then link:
```bash
npx supabase link --project-ref YOUR_PROJECT_REF_HERE
```

### Step 3: Deploy Edge Functions

Deploy all three at once:

```bash
npx supabase functions deploy cleveland-museum
npx supabase functions deploy va-museum
npx supabase functions deploy met-museum
```

Or one-by-one to test:

```bash
# Start with Cleveland (simplest)
npx supabase functions deploy cleveland-museum
```

---

## 🎉 Test It Works

1. Open http://localhost:3000
2. Search for "sword"
3. You should see results! 🎊

---

## 🔧 Troubleshooting

### "Failed to login"
- Check your internet connection
- Try: `npx supabase logout` then `npx supabase login` again

### "Project not found"
- Make sure you're using the **Reference ID**, not the full URL
- ✅ Correct: `abc123xyz`
- ❌ Wrong: `https://abc123xyz.supabase.co`

### "Function deploy failed"
- Make sure you're linked: `npx supabase link --project-ref YOUR_REF`
- Check the error message - might be syntax error in function code

### Still getting "Failed to send request" in browser
1. Check `.env.local` has correct URL and anon key
2. Restart the dev server: `npm run dev`
3. Hard refresh browser (Ctrl + Shift + R)

---

## 📝 Complete Setup Checklist

- [ ] Created Supabase project at supabase.com
- [ ] Copied project Reference ID
- [ ] Created `.env.local` with URL and anon key
- [ ] Ran `npx supabase login`
- [ ] Ran `npx supabase link --project-ref YOUR_REF`
- [ ] Deployed Cleveland function: `npx supabase functions deploy cleveland-museum`
- [ ] Deployed V&A function: `npx supabase functions deploy va-museum`
- [ ] Deployed Met function: `npx supabase functions deploy met-museum`
- [ ] Tested search at http://localhost:3000
- [ ] Search returns results! ✅

---

## 🎯 Quick Deploy Script

Save time with this script. Create `deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying Supabase Edge Functions..."
npx supabase functions deploy cleveland-museum
npx supabase functions deploy va-museum
npx supabase functions deploy met-museum
echo "✅ All functions deployed!"
echo "🧪 Test at http://localhost:3000"
```

Make executable and run:
```bash
chmod +x deploy.sh
./deploy.sh
```

Or on Windows (PowerShell):
```powershell
npx supabase functions deploy cleveland-museum
npx supabase functions deploy va-museum
npx supabase functions deploy met-museum
```

---

## 🔍 Verify Functions Are Deployed

Check in Supabase dashboard:
1. Go to your project
2. Click "Edge Functions" in the sidebar
3. You should see:
   - ✅ cleveland-museum
   - ✅ va-museum
   - ✅ met-museum

Each should show status: "Deployed"

---

## 🌐 Optional: Deploy Firecrawl (for Web Scraping)

Only needed if you want the web scraping feature:

1. Get Firecrawl API key from https://firecrawl.dev
2. Set the secret:
   ```bash
   npx supabase secrets set FIRECRAWL_API_KEY=fc-your-key-here
   ```
3. Deploy:
   ```bash
   npx supabase functions deploy firecrawl-scrape
   ```

---

## 📚 More Help

- **QUICKSTART.md** - Quick reference
- **SETUP.md** - Detailed setup guide
- **TESTING.md** - Testing and troubleshooting
- **README.md** - Project overview

---

Need help? Check the error message and match it to troubleshooting above.
