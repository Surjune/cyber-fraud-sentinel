# Cyber Fraud Threat Platform

A comprehensive fraud detection and incident reporting platform with **email-based approval authentication** (similar to Google's "Tap to Approve" login).

## 🎯 Key Features

### Fraud Reporting
- 📋 Submit fraud incident reports
- 📊 Track threat patterns and similarities
- 🎯 Categorize by fraud type, platform, and severity
- 📈 Real-time analytics and threat scoring

### Email-Based Login Approval ✨ NEW
- 🔐 **Google-style approval-based authentication**
- 📧 **Admin receives approval requests via email**
- ⏱️ **60-second auto-expiring requests**
- ✅ **One-click approval from email**
- 🔒 **Bcrypt password hashing + one-time tokens**
- 🚫 **No OTP typing required**

## 📚 Documentation

### Quick Start
👉 **New to the system?** Start here: [EMAIL_QUICKSTART.md](./EMAIL_QUICKSTART.md)
- 5-minute setup with Gmail credentials
- Test the complete approval flow
- API testing without email

### Complete Technical Documentation
📖 **Full technical details:** [EMAIL_AUTH_SYSTEM.md](./EMAIL_AUTH_SYSTEM.md)
- Complete authentication flow
- Database schema
- All 5 API endpoints
- Security considerations
- Email template details
- Troubleshooting guide

### Previous Authentication System (Dashboard-Based)
📋 If you need the old admin dashboard approval system:
- See [README_AUTH.md](./README_AUTH.md) 
- Previous implementation with admin panel
- Still available but superseded by email-based system

---

## 🚀 Quick Start (5 minutes)

### 1. Get Gmail Credentials
```
Go to: https://myaccount.google.com
→ Security → App passwords
→ Generate password for Mail/Windows
→ Copy 16-character password
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env - paste your Gmail app password
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8004
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:5174
```

### 4. Test It!
- Go to: http://localhost:5174/login
- **Test account:** testuser / test123
- Or register a new account
- Login → Waiting page → (Admin approves via email) → Dashboard ✅

---

## 🔐 How It Works

### User Login Flow
```
1. User enters username + password
2. Backend creates LoginRequest
3. Email sent to admin: rajeswaris329@gmail.com
4. Admin taps ✅ APPROVE LOGIN in email
5. User page auto-updates → Logged in ✅
```

### Security
- ✅ Bcrypt password hashing (salted, cost factor 12)
- ✅ One-time approval tokens (cannot be reused)
- ✅ Auto-expiry after 60 seconds
- ✅ 4-digit codes shown only to admin
- ✅ Server-side validation only
- ✅ No client-side trust

---

## 📡 API Endpoints

### User Authentication
```
POST   /auth/register           Register new account
POST   /auth/login              Initiate approval request
GET    /auth/login-status/{id}  Poll approval status
```

### Admin Approval (Email Links)
```
GET    /admin/approve-login?request_id=X&token=Y   Approve via email
GET    /admin/deny-login?request_id=X&token=Y      Deny via email
```

See [EMAIL_AUTH_SYSTEM.md](./EMAIL_AUTH_SYSTEM.md) for complete endpoint documentation.

---

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Database**: SQLite with SQLAlchemy ORM
- **Security**: Bcrypt (password hashing), secrets (token generation)
- **Email**: SMTP via Gmail
- **Server**: Uvicorn

### Frontend
- **Framework**: React 18.2 + TypeScript 5.4
- **Build Tool**: Vite 5.4.21
- **Routing**: React Router v6
- **Styling**: CSS-in-JS (inline styles)

---

## 📁 Project Structure

```
cyber-fraud-threat-platform/
├── backend/
│   ├── main.py                  # FastAPI + auth endpoints
│   ├── database.py              # SQLAlchemy setup
│   ├── models.py                # Data models
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Email config template
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main component with routing
│   │   ├── pages/
│   │   │   ├── Login.tsx        # User login form
│   │   │   ├── WaitingForApproval.tsx  # Approval wait screen
│   │   │   └── Dashboard.tsx    # Main dashboard
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Auth state management
│   │   └── services/
│   │       └── api.ts           # API client
│   └── package.json
├── EMAIL_AUTH_SYSTEM.md         # Complete technical docs
└── EMAIL_QUICKSTART.md          # Quick setup guide
```

---

## ⚙️ Configuration

### Environment Variables (`.env`)

Create `backend/.env`:
```env
# Gmail SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-gmail@gmail.com
SENDER_PASSWORD=xxxx xxxx xxxx xxxx    # App password, not Gmail password

# Frontend
BASE_URL=http://127.0.0.1:8004         # For email approval links
```

> **Important**: Never commit `.env` file. Use `.env.example` as template.

---

## 🧪 Testing

### Quick Test (API)
```bash
# Register
curl -X POST http://127.0.0.1:8004/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"pass123","email":"user@example.com"}'

# Login
curl -X POST http://127.0.0.1:8004/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"pass123"}'

# Check status
curl http://127.0.0.1:8004/auth/login-status/1
```

### Full Integration Test
1. Start both backend & frontend
2. Open http://localhost:5174/login
3. Login with test account
4. See email approval in backend logs (or check Gmail)
5. Click approval link from email
6. Watch frontend auto-redirect to dashboard

See [EMAIL_QUICKSTART.md](./EMAIL_QUICKSTART.md) for more test scenarios.

---

## 🚀 Production Deployment

### Database
```bash
# Switch from SQLite to PostgreSQL
# Update DATABASE_URL in .env
```

### HTTPS
```env
BASE_URL=https://yourdomain.com
# Must use HTTPS for production email links
```

### Server
```bash
# Use Gunicorn instead of uvicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

### Email
```env
SENDER_EMAIL=noreply@yourdomain.com
SENDER_PASSWORD=<production-app-password>
```

---

## 🔧 Troubleshooting

### Email Not Sending
- Verify `.env` file exists with correct Gmail app password
- Check firewall allows SMTP port 587
- Look for email in spam/promotions folder
- Check backend logs for error messages

### "Invalid Approval Token"
- Request expired (60-second window) → login again
- Token already used → one-time use only
- Check request_id in URL matches

### "Port Already in Use"
```bash
# Kill existing Python processes
lsof -i :8004
kill -9 <PID>
# Then restart backend
```

### Database Schema Error
```bash
cd backend
rm fraud_data.db        # Delete old DB
# Restart backend - will recreate with new schema
python -m uvicorn main:app --reload
```

---

## 📊 Features Breakdown

### User Features
- ✅ Account registration
- ✅ Secure login with credentials
- ✅ Real-time approval status
- ✅ Auto-redirect on approval
- ✅ Clear error messages
- ✅ 60-second countdown timer

### Admin Features  
- ✅ Email-based approvals
- ✅ One-click approve/deny
- ✅ Verification codes for security
- ✅ Timestamps and request details
- ✅ Mobile-friendly email template

### Security Features
- ✅ Bcrypt password hashing
- ✅ One-time approval tokens
- ✅ Auto-expiring requests (60s)
- ✅ Server-side validation
- ✅ Numeric codes (admin eyes only)
- ✅ Time-constant comparison

---

## 📝 License

This project is part of the Cyber Fraud Threat Platform.

---

## 🤝 Contributing

See specific documentation files:
- [EMAIL_QUICKSTART.md](./EMAIL_QUICKSTART.md) - Quick setup
- [EMAIL_AUTH_SYSTEM.md](./EMAIL_AUTH_SYSTEM.md) - Technical details
- [README_AUTH.md](./README_AUTH.md) - Previous auth system (legacy)

---

## 📞 Support

**Check these first:**
1. [EMAIL_QUICKSTART.md](./EMAIL_QUICKSTART.md) - Getting started
2. [EMAIL_AUTH_SYSTEM.md](./EMAIL_AUTH_SYSTEM.md) - Troubleshooting section  
3. Backend logs - Contains email sending status
4. `.env` file - Verify all configuration

---

## ✨ Recent Updates (Version 2.0)

### New: Email-Based Approval System
- Replaced admin dashboard with email approval
- Simplified user experience (no manual approval entry)
- One-time approval tokens for security
- Mobile-friendly email template
- Automatic token validation and expiry

### Still Available
- All fraud reporting features
- Threat pattern analysis
- Real-time dashboards
- Historical data tracking

---

## 🎯 Next Steps

1. ✅ **Get started**: Follow [EMAIL_QUICKSTART.md](./EMAIL_QUICKSTART.md)
2. ✅ **Understand the system**: Read [EMAIL_AUTH_SYSTEM.md](./EMAIL_AUTH_SYSTEM.md)
3. ✅ **Configure Gmail**: Set up app password
4. ✅ **Test the flow**: Run through quick test
5. ✅ **Deploy**: Follow production deployment guide

---

**Ready to build secure fraud detection?** 🚀

Start with [EMAIL_QUICKSTART.md](./EMAIL_QUICKSTART.md) - it takes just 5 minutes!
