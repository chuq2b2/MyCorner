# MyCorner

**MyCorner** is a personal web application designed to serve as your digital corner — a place to manage your digital diary entries. It’s built with a modern web tech stack and designed for simplicity, responsiveness, and utility.

## 🚀 Features

- 📝 Setting Reminder - Reminder using nodemailer to remind you to customizable sign in
- 📁 Create audio or video recordings - Record like your diaries using MediaRecorder API
- 🔐 User Authentication — Secure login and registration using Clerk Authentication
- 📱 Responsive Design — Works on desktop and mobile

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Python (FastAPI)
- **Database**: (PostgreSQL via Supabase)
- **Cloud Service**: Supabase Storage
- **Version Control**: Git & GitHub

## 📦 Installation

### Prerequisites

- Node.js and npm
- Python 3.x

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/chuq2b2/MyCorner.git
   cd MyCorner

2. **Set up env file in /backend**
   ```bash
    SUPABASE_URL={INSERT YOUR SUPABASE URL}
    SUPABASE_KEY={INSERT YOUR SUPABASE KEY}
    CLERK_SECRET_KEY={INSERT YOUR CLERK SECRET KEY}
    
    OPENROUTER_API_KEY={INSERT YOUR OPENROUTER API KEY}
    CORS_ORIGINS=http://localhost:3000,http://localhost:5173
    
    # Email Configuration
    SMTP_SERVER=smtp.gmail.com
    SMTP_PORT=587
    EMAIL_USERNAME={INSERT YOUR EMAIL}
    EMAIL_PASSWORD={INSERT YOUR EMAIL PASSWORD FROM PASSCODE KEY}
    FROM_EMAIL={INSERT YOUR FROM EMAIL - SAME WITH EMAIL}

3. **Set up env.local file in /frontend**
   ```bash
   SUPABASE_URL={INSERT YOUR SUPABASE URL}
    SUPABASE_KEY={INSERT YOUR SUPABASE KEY}
    CLERK_SECRET_KEY={INSERT YOUR CLERK SECRET KEY}
    VITE_CLERK_PUBLISHABLE_KEY={INSERT VITE CLERK KEY}
    
    OPENROUTER_API_KEY={INSERT YOUR OPENROUTER API KEY}
    CORS_ORIGINS=http://localhost:3000,http://localhost:5173
    
    VITE_SUPABASE_URL={INSERT VITE SUPABASE URL}
    VITE_SUPABASE_ANON_KEY={INSERT VITE SUPABASE ANON KEY}
4. ***Backend set up**
  ```bash
  cd backend
  pip install -r requirements.txt
  python3 run.py
  ```

5. **Frontend set up**
   ```bash
   cd frontend
   npm run dev
   




   
