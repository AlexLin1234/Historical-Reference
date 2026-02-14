# Deploying to Supabase

This guide walks you through deploying the Reenactor's Reference application to Supabase.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Supabase CLI installed locally (`npm install -D supabase`)
3. Optional: Firecrawl API key for web scraping (get from https://firecrawl.dev)

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `reenactors-reference` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to finish setting up (~2 minutes)

## Step 2: Get Your Project Credentials

Once your project is ready:

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Project API keys** → **anon public** (starts with `eyJ`)

## Step 3: Link Your Local Project

```bash
# Link to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# The project ref is in your project URL:
# https://YOUR_PROJECT_REF.supabase.co
```

Enter your database password when prompted.

## Step 4: Update Environment Variables

Update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (your anon key)
```

**Important**: Make sure your anon key starts with `eyJ` (it's a JWT token), NOT `sb_secret_`!

## Step 5: Deploy Edge Functions

Deploy all edge functions to Supabase:

```bash
# Deploy Met Museum function
npx supabase functions deploy met-museum

# Deploy V&A Museum function
npx supabase functions deploy va-museum

# Deploy Cleveland Museum function
npx supabase functions deploy cleveland-museum

# Deploy Firecrawl scraper (optional - requires API key)
npx supabase functions deploy firecrawl-scrape
```

## Step 6: Set Up Firecrawl (Optional)

If you want to enable web scraping:

1. Get a Firecrawl API key from https://firecrawl.dev (free tier available)
2. Set it as a Supabase secret:

```bash
npx supabase secrets set FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

3. The `firecrawl-scrape` edge function will now work

## Step 7: Test Your Deployment

1. Restart your Next.js dev server:
```bash
npm run dev
```

2. Try searching for artifacts - they should now come from your deployed edge functions

3. If scraping is enabled, try the "Scrape" page

## Troubleshooting

### "Failed to send a request to the Edge Function"

- Check that your `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify your `NEXT_PUBLIC_SUPABASE_ANON_KEY` starts with `eyJ`
- Make sure you deployed the edge functions
- Check the Supabase dashboard → Edge Functions → Logs for errors

### "FIRECRAWL_API_KEY is not configured"

- Set the secret using: `npx supabase secrets set FIRECRAWL_API_KEY=your_key`
- Verify with: `npx supabase secrets list`

### Edge function timeout

- Increase the timeout in the edge function code (default 30s)
- Or use fewer museums in a single search

## Production Deployment

To deploy the Next.js app to production (Vercel):

1. Push your code to GitHub
2. Go to https://vercel.com and import your repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

Your Supabase edge functions will continue to work with the production deployment.

## Cost Considerations

- **Supabase Free Tier**: 500,000 edge function invocations/month
- **Firecrawl Free Tier**: 500 scrapes/month
- **Museum APIs**: Met, V&A, Cleveland, Smithsonian are all free with no API key required

The free tiers should be sufficient for personal/hobby use.
