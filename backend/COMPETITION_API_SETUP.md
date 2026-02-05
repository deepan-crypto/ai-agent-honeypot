# Competition API Setup Guide

## ⚠️ Prerequisites

Before the competition API can work, you MUST set up the Supabase database tables.

### Step 1: Run Database Schema

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard: https://app.supabase.com
   - Select your project
   - Click on "SQL Editor" in the left sidebar

2. **Execute the Schema**
   - Copy the entire contents of `backend/config/supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

This will create:
- `sessions` table - stores honeypot conversation sessions
- `threat_intel` table - stores extracted threat intelligence
- Indexes for performance
- Row Level Security policies

### Step 2: Verify Tables Created

In the Supabase dashboard:
1. Go to "Table Editor"
2. Verify you see two tables:
   - `sessions`
   - `threat_intel`

### Step 3: Environment Variables

Ensure your `.env` file has these variables set:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Anthropic AI (Claude)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional
NODE_ENV=production
PORT=3000
```

## 📡 Competition API Endpoint

### Endpoint Details

**URL:** `POST /detect`

**Request Format:**
```json
{
    "sessionId": "unique-session-id",
    "message": {
        "sender": "scammer",
        "text": "Your bank account will be blocked today. Verify immediately.",
        "timestamp": 1769776085000
    },
    "conversationHistory": [],
    "metadata": {
        "channel": "SMS",
        "language": "English",
        "locale": "IN"
    }
}
```

**Success Response:**
```json
{
    "status": "success",
    "reply": "AI honeypot response text"
}
```

**Error Response:**
```json
{
    "status": "error",
    "reply": "Error message"
}
```

## 🧪 Testing Locally

### Option 1: Using PowerShell (Windows)

```powershell
# From the backend directory
$testRequest = Get-Content test-request.json -Raw
Invoke-RestMethod -Uri http://localhost:3000/detect `
    -Method Post `
    -ContentType "application/json" `
    -Body $testRequest
```

### Option 2: Using curl (if available)

```bash
curl -X POST http://localhost:3000/detect \
  -H "Content-Type: application/json" \
  -d @test-request.json
```

### Option 3: Using Postman

1. Create a new POST request to `http://localhost:3000/detect`
2. Set header: `Content-Type: application/json`
3. In Body tab, select "raw" and paste the test request JSON
4. Click "Send"

## 🚀 Deployment

### For Competition Submission

1. **Deploy to your hosting platform** (Render, Railway, etc.)
   - Make sure Supabase database is set up first
   - Set all environment variables
   - Deploy the backend

2. **Get your deployment URL**
   - Example: `https://your-app.onrender.com`

3. **Test the endpoint**
   ```powershell
   Invoke-RestMethod -Uri https://your-app.onrender.com/detect `
       -Method Post `
       -ContentType "application/json" `
       -Body (Get-Content test-request.json -Raw)
   ```

4. **Submit to competition**
   - URL: `https://your-app.onrender.com` (NOT the GitHub URL)
   - API Key: Your Anthropic API key

## 🔍 Troubleshooting

### Error: "Could not find the table 'public.sessions'"

**Solution:** You haven't run the database schema. Follow Step 1 above.

### Error: "ANTHROPIC_API_KEY not found"

**Solution:** Add your API key to the `.env` file or set it in your hosting platform's environment variables.

### Error: 500 Internal Server Error

**Solution:** Check the server logs for specific errors. Common causes:
- Database not set up
- Missing environment variables
- Network/connectivity issues

## ✅ Verification Checklist

Before submitting to competition:

- [ ] Database tables created in Supabase
- [ ] All environment variables set
- [ ] Backend deployed and accessible
- [ ] `/detect` endpoint responds correctly to test request
- [ ] Health check endpoint works: `GET /health`
- [ ] Using deployment URL (not GitHub URL) for submission


