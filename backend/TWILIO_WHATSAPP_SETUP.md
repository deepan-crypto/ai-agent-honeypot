# Twilio WhatsApp Integration Guide

## 🎯 Overview
This guide shows you how to connect your honeypot to a real WhatsApp number so scammers can message it directly and get AI responses.

## 📋 Prerequisites
- Twilio account (free trial available)
- Your backend deployed on Render
- WhatsApp installed on your phone

---

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Verify your email and phone number
4. You'll get **$15 in free credits**

## Step 2: Get Twilio Credentials

1. Go to Twilio Console: https://console.twilio.com/
2. Find your **Account SID** and **Auth Token**
3. Copy these - you'll need them for environment variables

## Step 3: Set Up WhatsApp Sandbox

Since you're testing, use Twilio's WhatsApp Sandbox (free):

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the sandbox:
   - Send a WhatsApp message to: `+1 415 523 8886`
   - Message text: `join <your-sandbox-code>`
   - Example: `join happy-tiger`
3. You'll receive confirmation "You are all set!"

## Step 4: Configure Webhook in Twilio

1. In the sandbox settings, find **"WHEN A MESSAGE COMES IN"**
2. Set the webhook URL to:
   ```
   https://ai-agent-honeypot.onrender.com/api/whatsapp/incoming
   ```
3. Method: **POST**
4. Click **Save**

## Step 5: Add Environment Variables to Render

Go to your Render dashboard and add these variables:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Step 6: Deploy Updated Backend

```bash
git add .
git commit -m "Add Twilio WhatsApp integration"
git push
```

Wait for Render to redeploy (~2 minutes)

---

## 🎉 Testing It Out!

1. **Send a WhatsApp message** to `+1 415 523 8886`
2. **Martha (AI) will respond** automatically!
3. **Try scammer-like messages**:
   ```
   "I need to verify your bank account"
   "Please send money to merchant@paytm"
   "Click this link: https://fake-bank.com"
   ```
4. **Watch the dashboard** - threats will be extracted!

## 📱 Example Conversation

```
You:
"Hello! This is from your bank. We detected suspicious activity."

Martha:
"Oh my goodness! What kind of activity? I'm not very good with 
these phone things..."

You:
"Please verify by sending 100 rupees to test@paytm"

Martha:
"Oh dear, test at what? I need to find my glasses first. Can you 
spell that for me? My grandson David usually helps me with these 
things..."

🚨 System automatically logs: UPI ID "test@paytm" detected!
```

---

## 🔧 Monitoring

### Check Backend Logs (Render)
Look for:
```
📱 WhatsApp message from +1234567890: I need your bank details
🤖 Martha responds: Oh dear, let me see...
🚨 Threats detected: UPI: scammer@paytm
```

### Check Your Dashboard
- Open your Vercel frontend
- You should see the conversation appear in real-time
- Threats appear in the intelligence feed

### View Active Sessions
```bash
curl https://ai-agent-honeypot.onrender.com/api/whatsapp/sessions
```

---

## 💰 Costs (After Free Trial)

**Twilio WhatsApp Pricing:**
- Sandbox: **FREE** (for testing)
- Production WhatsApp Business: $0.005 per conversation
- Your current free $15 credit = ~3,000 messages!

**For Production (Real WhatsApp Number):**
1. Apply for WhatsApp Business API
2. Get verified business profile
3. Connect your own number

---

## 🎯 Share Your Honeypot Number

Once working, you can:
1. **Post on social media**: "Message me on WhatsApp if you're a scammer: +1-415-523-8886"
2. **Reply to scam emails** with your WhatsApp number
3. **Add to scammer databases** online
4. **Wait for scammers** to contact you!

---

## 🔒 Security Notes

- ✅ Never share your Twilio Auth Token publicly
- ✅ Use environment variables in Render (not in code)
- ✅ Monitor your Twilio usage to avoid surprise charges
- ✅ Review extracted intelligence regularly

---

## 🐛 Troubleshooting

**Martha doesn't respond:**
- Check Render logs for errors
- Verify webhook URL in Twilio
- Ensure environment variables are set

**"Not joined sandbox" error:**
- Send `join <code>` to +1 415 523 8886
- Wait for confirmation message

**CORS errors:**
- These don't affect WhatsApp integration
- Only affect web dashboard

---

## ✅ You're All Set!

Your honeypot is now live on WhatsApp! Scammers can message it 24/7 and Martha will keep them engaged while extracting intelligence.

**Happy Scammer Trapping!** 🕵️‍♂️🎭
