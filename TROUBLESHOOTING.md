# Troubleshooting "Edge Function returned a non-2xx status code"

## 🔍 Diagnosis

This error means the edge function is deployed and receiving requests, but returning an error. The most common cause is **incorrect API keys** in `.env.local`.

---

## ✅ Fix: Get the Correct Supabase Keys

### Step 1: Go to Your Supabase Dashboard

1. Visit https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**

### Step 2: Copy the CORRECT Keys

You need TWO keys from the API settings page:

#### **Project URL** (looks like):
```
https://yourproject.supabase.co
```

#### **anon/public key** (looks like):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJ...
```

⚠️ **Common Mistake:** Don't use the `service_role` key! It starts with `eyJ` but is labeled "service_role secret" - this won't work for browser clients.

### Step 3: Update Your `.env.local`

Replace the contents of `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJ...
```

**Important:**
- Use the **anon/public** key (NOT service_role)
- The key should start with `eyJ` and be very long
- The key should NOT start with `sb_secret_`

### Step 4: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 5: Test Again

Search for "sword" - it should work now! 🎉

---

## 🔐 Key Types Explained

| Key Type | Starts With | Used For | Safe for Browser? |
|----------|-------------|----------|-------------------|
| **anon/public** | `eyJ...` | Browser clients | ✅ YES - Use this! |
| **service_role** | `eyJ...` | Server-only admin tasks | ❌ NO - Never expose! |

The anon key is safe to use in your `.env.local` file because it has restricted permissions (RLS policies apply).

---

## 🧪 Test Your Keys Are Correct

Run this command to test (replace with your actual values):

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/cleveland-museum" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action":"search","query":"sword","limit":3}'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "info": { "total": 123 },
    "data": [ ... artifacts ... ]
  }
}
```

**If you get `{"code":401,"message":"Invalid JWT"}`:**
- Your anon key is wrong
- Go back to Step 2 and copy the correct key

---

## 🎯 Quick Checklist

- [ ] Opened Supabase Dashboard → Settings → API
- [ ] Copied **Project URL** (starts with `https://`)
- [ ] Copied **anon/public key** (starts with `eyJ`, very long)
- [ ] Did NOT use service_role key
- [ ] Updated `.env.local` with both values
- [ ] Restarted dev server: `npm run dev`
- [ ] Hard refresh browser: Ctrl + Shift + R
- [ ] Searched for "sword" → See results! ✅

---

## 📸 Where to Find the Keys

In Supabase Dashboard:

```
Your Project
  └─ Settings (gear icon in sidebar)
      └─ API
          ├─ Project URL: https://xxxxx.supabase.co
          └─ Project API keys:
              ├─ anon/public: eyJhbG... ← USE THIS ONE
              └─ service_role: eyJhbG... ← DON'T USE THIS
```

---

## 🆘 Still Not Working?

### Error: "Failed to send a request to the Edge Function"
- Edge functions not deployed yet
- Run: `.\deploy-functions.ps1` or deploy manually (see DEPLOY.md)

### Error: "Invalid JWT" or "Unauthorized"
- Wrong anon key in `.env.local`
- Make sure you copied the **anon/public** key, not service_role
- Make sure the key is complete (very long, starts with `eyJ`)

### Error: "Function not found"
- Function name mismatch
- Make sure you deployed: `npx supabase functions deploy cleveland-museum`
- Check Supabase dashboard → Edge Functions to confirm deployment

### Edge function works but returns empty results
- Museum API might be down (rare)
- Try different search term
- Test museum API directly: `curl "https://openaccess-api.clevelandart.org/api/artworks/?q=sword&limit=3"`

---

## ✨ Success Looks Like

When everything is working, searching for "sword" will show:
- Loading spinner appears briefly
- Grid of artifact cards appears
- Each card shows:
  - Image of the artifact
  - Title
  - Date
  - Artist (if available)
  - Museum badge (Cleveland, V&A, or Met)
  - Bookmark icon to save

---

Need more help? Check:
- **DEPLOY.md** - Deployment guide
- **SETUP.md** - Full setup instructions
- **QUICKSTART.md** - Quick reference
