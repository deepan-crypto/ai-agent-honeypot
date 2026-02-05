# Frontend-Backend Integration Guide

## Overview
The frontend connects to the backend API to enable AI-powered scammer conversations and threat intelligence extraction.

## Setup Instructions

### 1. Environment Variables
The frontend needs the backend API URL configured in `.env`:

```env
VITE_BACKEND_API_URL=http://localhost:3000/api
```

For production deployment on Vercel/Netlify, update to:
```env
VITE_BACKEND_API_URL=https://your-backend.onrender.com/api
```

### 2. API Integration

The `honeypotApi.ts` service handles all backend communication:

**Key Methods:**
- `handoff(chatHistory)` - Initialize AI agent with chat history
- `sendMessage(sessionId, message)` - Send scammer message to AI
- `getSession(sessionId)` - Get session details
- `getIntelligence(filters)` - Retrieve extracted threats
- `deactivateSession(sessionId)` - End the session

### 3. Data Flow

```
User clicks "Activate Agent"
  ↓
Frontend calls POST /api/handoff with initial chat
  ↓
Backend creates session in Supabase
  ↓
Claude AI (Martha persona) generates response
  ↓
Backend auto-detects threats (UPI, URLs, etc.)
  ↓
Frontend receives AI response + extracted threats
  ↓
Frontend displays in UI + subscribes to realtime updates
  ↓
Simulated scammer messages continue the conversation
```

### 4. Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm install
# Add your ANTHROPIC_API_KEY to .env
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Both services should be running:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

### 5. Testing the Integration

1. Open frontend in browser
2. Check "Backend Online" indicator in header
3. Click "Activate AI Agent"
4. Watch as:
   - Martha (AI) responds to scammer
   - Threat intelligence appears in right panel
   - Conversation continues with stalling tactics

### 6. Deployment

**Backend (Render):**
- Push to GitHub
- Create Web Service on Render
- Add environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `ANTHROPIC_API_KEY`
  - `FRONTEND_URL` (your frontend URL)

**Frontend (Vercel/Netlify):**
- Update `.env` with production backend URL
- Deploy via Git integration
- Add environment variable: `VITE_BACKEND_API_URL`

### 7. Key Files

**Frontend:**
- `src/lib/honeypotApi.ts` - API service layer
- `src/App.tsx` - Main app with backend integration
- `src/components/ChatDisplay.tsx` - Chat UI
- `src/components/IntelligenceFeed.tsx` - Threat display

**Backend:**
- `server.js` - Express server
- `services/aiAgent.service.js` - AI logic
- `routes/agent.routes.js` - API endpoints
- `tools/threatIntel.tool.js` - Threat detection

## Troubleshooting

**"Backend Offline" error:**
- Ensure backend is running on port 3000
- Check `VITE_BACKEND_API_URL` in frontend `.env`
- Verify CORS settings allow frontend origin

**No AI responses:**
- Check `ANTHROPIC_API_KEY` is set in backend `.env`
- View backend console for errors
- Ensure Supabase tables are created (run schema SQL)

**No threat detection:**
- Check Supabase `threat_intel` table exists
- View backend logs for auto-detection output
- Ensure messages contain detectable patterns (UPI IDs, URLs, etc.)
