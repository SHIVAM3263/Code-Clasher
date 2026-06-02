# ⚔️ CODE CLASHER

> **Competitive coding as a live battle arena.** Fight 1v1 in real-time, watch your opponent's health drop with every wrong answer, climb the ranks from Unranked to Grandmaster.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎮 **Live Battles** | Real-time 1v1 coding duels via WebSocket |
| 🏆 **Ranked Mode** | Elo-based matchmaking across 9 skill tiers |
| 🧩 **Problem Vault** | Filterable library of coding challenges |
| 💥 **Health System** | Wrong answers deal damage; first to zero loses |
| 🎯 **Private Rooms** | Create invite-only rooms for friends |
| 🥇 **Leaderboards** | Global rankings by rating, wins, problems solved |
| 🏅 **Achievements** | Unlock badges for milestones |
| 👤 **Profile Pages** | Activity graphs, battle history, stat rings |
| 🎨 **Cyberpunk UI** | Full neon/dark gaming aesthetic with animations |

---

## 🗂️ Project Structure

```
code-clasher/
├── codeclasher-backend/     # Django + DRF + Channels
│   ├── codeclasher/         # Core settings, ASGI, URLs
│   ├── users/               # Auth, profiles, ranks, achievements
│   ├── problems/            # Problem library, test runner
│   └── battles/             # Matchmaking, battles, WebSocket consumer
│
└── codeclasher-frontend/    # React + Vite
    └── src/
        ├── api/             # Axios + JWT interceptors
        ├── contexts/        # AuthContext
        ├── components/      # Navbar, HealthBar
        └── pages/           # Home, Arena, Battle, Problems, Leaderboard, Profile
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional) Redis — for production WebSocket scaling. Dev uses in-memory channels.

---

### Backend Setup

```bash
cd codeclasher-backend

# 1. Create & activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run migrations
python manage.py makemigrations users problems battles
python manage.py migrate

# 4. Seed sample problems (Two Sum, Max Subarray, etc.)
python manage.py seed_problems

# 5. Create superuser (for /admin panel)
python manage.py createsuperuser

# 6. Start the server (Daphne handles HTTP + WebSocket)
python manage.py runserver
```

Backend runs on **http://localhost:8000**  
Admin panel: **http://localhost:8000/admin/**

---

### Frontend Setup

```bash
cd codeclasher-frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Frontend runs on **http://localhost:5173**

Vite proxies `/api` → `:8000` and `/ws` → `ws://:8000` automatically.

---

## 🔑 Environment Variables

Create `codeclasher-backend/.env` for production:

```env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,localhost
REDIS_URL=redis://localhost:6379/0
DATABASE_URL=postgresql://user:pass@localhost:5432/codeclasher
```

---

## 🏗️ Architecture

### Backend

```
HTTP Request ──▶ Django REST Framework ──▶ Views/Serializers ──▶ DB
WebSocket ──────▶ Django Channels ──────▶ BattleConsumer ──────▶ Channel Layer
                                                                       │
                                                              Broadcasts to room group
```

**Key Design Decisions:**
- **ASGI via Daphne** — serves both HTTP and WebSocket on the same port
- **InMemoryChannelLayer** in dev; swap to **Redis** for production scale
- **Subprocess sandboxing** — code execution runs in an isolated subprocess with a 5s timeout
- **Elo-style rating** — adjusts by K-factor based on match outcome

### Frontend

```
React Router ──▶ Pages
                  │
                  ├── AuthContext (JWT tokens, user state)
                  ├── Axios API layer (auto-refresh on 401)
                  └── WebSocket (native browser API, per battle room)
```

---

## 🎮 Game Flow

```
Player A                         Server                        Player B
   │                               │                               │
   │── POST /battles/queue/join ──▶│                               │
   │                               │◀── POST /battles/queue/join ──│
   │                               │                               │
   │         (Server matches players, picks problem)               │
   │                               │                               │
   │◀── WebSocket: battle_started ─┤─ WebSocket: battle_started ──▶│
   │                               │                               │
   │── POST /battles/room/{id}/submit ──▶│                         │
   │                               │ (judge, calculate damage)     │
   │◀── WebSocket: battle_update ──┤── WebSocket: battle_update ──▶│
   │                               │                               │
   │        (opponent HP reaches 0)│                               │
   │◀── WebSocket: battle_ended ───┤─── WebSocket: battle_ended ──▶│
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login/` | JWT login |
| `POST` | `/api/auth/refresh/` | Refresh access token |
| `POST` | `/api/users/register/` | Register new user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/profiles/me/` | Current user profile |
| `PATCH` | `/api/users/profiles/me/` | Update profile |
| `GET` | `/api/users/profiles/leaderboard/` | Global leaderboard |
| `GET` | `/api/users/profiles/{id}/` | Any user's profile |

### Problems
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/problems/` | List problems (filterable) |
| `GET` | `/api/problems/{slug}/` | Problem detail |
| `POST` | `/api/problems/{slug}/run/` | Run code against test cases |

### Battles
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/battles/queue/join/` | Join matchmaking queue |
| `POST` | `/api/battles/queue/leave/` | Leave queue |
| `GET` | `/api/battles/queue/status/` | Queue position + status |
| `POST` | `/api/battles/create-room/` | Create private room |
| `POST` | `/api/battles/join-room/` | Join by room code |
| `GET` | `/api/battles/room/{code}/` | Room state |
| `POST` | `/api/battles/room/{code}/submit/` | Submit solution |
| `POST` | `/api/battles/room/{code}/forfeit/` | Forfeit battle |

### WebSocket
```
ws://localhost:8000/ws/battle/{room_code}/
```

**Events sent:**
- `battle_update` — HP changes, submission verdicts
- `player_connected` / `player_disconnected`
- `chat` — in-battle chat messages
- `ping` — keepalive

---

## 🎨 Design System

| Token | Value | Use |
|-------|-------|-----|
| `--cyan` | `#00f5ff` | Primary accent, interactive |
| `--purple` | `#b44fff` | Secondary accent, ranked |
| `--red` | `#ff2d55` | Danger, defeat, health low |
| `--gold` | `#ffd60a` | Achievements, streak |
| `--green` | `#00ff88` | Victory, success, easy |
| `--font-display` | Orbitron | Headings, labels |
| `--font-body` | Rajdhani | Body text, UI |
| `--font-code` | Share Tech Mono | Code, stats |

---

## 🏅 Rank System

| Rank | Rating Range | Color |
|------|-------------|-------|
| Unranked | < 800 | Grey |
| Iron | 800–999 | Steel |
| Bronze | 1000–1199 | Bronze |
| Silver | 1200–1399 | Silver |
| Gold | 1400–1599 | Gold |
| Platinum | 1600–1799 | Cyan |
| Diamond | 1800–1999 | Purple |
| Master | 2000–2299 | Orange |
| Grandmaster | 2300+ | Red |

---

## 🧩 Adding Problems

Via Django admin at `/admin/problems/problem/add/` or by extending the seed command:

```python
# problems/management/commands/seed_problems.py
Problem.objects.create(
    title="Your Problem",
    slug="your-problem",
    difficulty="MEDIUM",
    description="Problem statement here...",
    test_cases=[
        {"input": "1 2", "expected": "3", "hidden": False},
        {"input": "10 20", "expected": "30", "hidden": True},
    ],
    starter_code={
        "python": "def solve(input_data):\n    pass",
        "javascript": "function solve(inputData) {\n    \n}",
    }
)
```

---

## 🛡️ Code Execution Safety

- Runs in a **subprocess** with `timeout=5s`
- **No network access** in submitted code
- Output is compared against expected using exact or normalized string matching
- Production: consider Docker sandboxing or Piston API for stronger isolation

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | Django 4.2 + Django REST Framework |
| Real-time | Django Channels + Daphne (ASGI) |
| Auth | SimpleJWT (access + refresh tokens) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Channel Layer | InMemoryChannelLayer (dev) / Redis (prod) |
| Frontend | React 18 + Vite |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Routing | React Router v6 |
| HTTP Client | Axios with JWT interceptors |
| Fonts | Orbitron · Share Tech Mono · Rajdhani |

---

*Built with ⚔️ by Code Clasher. May your submissions be accepted and your opponents' HP reach zero.*
