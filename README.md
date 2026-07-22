# 🎬 MOVIE SORT

A full-stack movie discovery and recommendation platform powered by AI. Search, sort, and get personalized movie suggestions through an intelligent chatbot, track your watchlist, write reviews, and plan group watch parties — all in one place.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Python-000000?logo=flask&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20DB-FFCA28?logo=firebase&logoColor=black)
![TMDB](https://img.shields.io/badge/TMDB-API-01D277?logo=themoviedatabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 🔗 Live Demo

- **Frontend:** [movie-pro-theta.vercel.app](https://movie-pro-theta.vercel.app)
- **Backend API:** [movie-pro-production.up.railway.app](https://movie-pro-production.up.railway.app)

---

## ✨ Features

- 🔍 **Movie Search & Discovery** — Search and browse movies using live data from TMDB
- 🤖 **AI Chatbot** — Get natural-language movie recommendations powered by an LLM (Groq)
- 🎯 **Personalized Recommendations** — Content-based recommendation engine (TF-IDF + cosine similarity) tailored to your watchlist
- 🧩 **Similar Movies & Collections** — Explore movie franchises and related titles
- 👤 **Cast & Crew Pages** — View detailed person profiles and filmographies
- ⭐ **Ratings & Reviews** — Rate movies and leave reviews
- 📌 **Watchlist Management** — Save movies to watch later
- 🎉 **Group Watch Parties** — Schedule watch parties with a built-in tie-breaker for picking a movie together
- 🧠 **Taste Compatibility Check** — Compare movie taste with friends using a radar chart
- 🔐 **Authentication** — Secure sign-in via Firebase Auth (Google + email)
- 📱 **Responsive UI** — Clean, modern interface built with React + Tailwind CSS

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS
- Chart.js (taste radar visualization)
- Firebase Authentication
- EmailJS

**Backend**
- Flask (Python)
- Firebase Admin SDK (Firestore)
- scikit-learn (recommendation engine)
- Groq API (AI chatbot)
- TMDB API (movie data)

---

## 📂 Project Structure

\`\`\`
MOVIE-PRO/
├── backend/
│   ├── app.py                  # Main Flask app & API routes
│   ├── backend.py              # Core movie data logic
│   ├── chatbot.py              # AI chatbot (Groq integration)
│   ├── recommender.py          # TF-IDF based recommendation engine
│   ├── firebase_config.py      # Firebase Admin setup
│   ├── auth_middleware.py      # Auth verification middleware
│   ├── migrate_to_firestore.py
│   ├── requirements.txt
│   └── serviceAccountKey.json  # (not committed — see setup below)
│
└── frontend/
    ├── src/
    │   ├── components/         # React components (Discover, MovieGrid, ChatWidget, etc.)
    │   ├── App.jsx
    │   ├── firebase.js
    │   └── api.js
    └── package.json
\`\`\`

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (3.10+)
- A [Firebase](https://console.firebase.google.com/) project (Auth + Firestore enabled)
- A [TMDB API key](https://www.themoviedb.org/settings/api)
- A [Groq API key](https://console.groq.com/keys)

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/Abdul-Hadi-del/MOVIE-PRO.git
cd MOVIE-PRO
\`\`\`

### 2. Backend setup

\`\`\`bash
cd backend
pip install -r requirements.txt
\`\`\`

Create a `.env` file inside `backend/` with:

\`\`\`
TMDB_API_KEY=your_tmdb_api_key
GROQ_API_KEY=your_groq_api_key
\`\`\`

Add your Firebase service account file as `backend/serviceAccountKey.json` (download it from Firebase Console → Project Settings → Service Accounts).

Run the backend:

\`\`\`bash
python app.py
\`\`\`

### 3. Frontend setup

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

The app will be available at `http://localhost:5173` (backend runs at `http://127.0.0.1:5000`).

---

## 🔒 Environment Variables

| Variable         | Location   | Description                          |
|-------------------|-----------|---------------------------------------|
| `TMDB_API_KEY`    | `backend/.env` | API key for TMDB movie data       |
| `GROQ_API_KEY`    | `backend/.env` | API key for the AI chatbot (Groq) |

> **Note:** `serviceAccountKey.json` and `.env` are excluded via `.gitignore` and must be created locally / configured on your deployment platform.

---

## 🗺️ Roadmap

- [ ] Deploy backend and frontend to production
- [ ] Add dark/light theme toggle
- [ ] Mobile app version
- [ ] Social sharing for watchlists

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙌 Acknowledgements

- [TMDB](https://www.themoviedb.org/) for movie data
- [Groq](https://groq.com/) for AI inference
- [Firebase](https://firebase.google.com/) for auth & database