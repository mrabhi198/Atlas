<div align="center">

# 🚀 Atlas

### AI-Powered Software Engineering Learning Ecosystem

**Learn. Build. Engineer. Get Hired.**

<img src="/frontend/public/banner.png" alt="Atlas Banner" width="100%" />

---

*Building the future of software engineering education through real-world engineering experiences.*

</div>

---

# 📖 About Atlas

Atlas is an AI-powered Software Engineering Learning Ecosystem designed to transform beginners into industry-ready software engineers through real-world engineering experiences.

Unlike traditional learning platforms that primarily focus on algorithms, syntax, or video tutorials, Atlas teaches learners how professional software engineers think, design, build, debug, optimize, test, and ship production-ready software.

Atlas combines structured learning, adaptive roadmaps, engineering simulations, AI-powered mentorship, secure code execution, engineering portfolios, and future hiring opportunities into one integrated platform.

Our philosophy is simple:

> **Learn Like an Engineer. Build Like an Engineer. Get Hired Like an Engineer.**

---

# 📌 Project Status

| Property | Value |
|----------|-------|
| **Current Version** | v0.2 Alpha |
| **Status** | 🚧 Active Development |
| **Repository** | Private |
| **Maintained By** | TechInfinit Studio |

---

# 🎯 Vision

To build the world's most comprehensive Software Engineering Learning Ecosystem where anyone can learn, practice, build, verify their skills, and launch a successful engineering career through real-world engineering experiences.

---

# 🚀 Why Atlas?

Most coding platforms teach **how to write code**.

Atlas teaches **how to become a Software Engineer.**

Instead of solving disconnected coding questions, learners experience the complete engineering workflow.

### Traditional Learning

- Watch tutorials
- Solve isolated coding questions
- Memorize syntax
- Build random projects

### Atlas Learning

- Learn engineering concepts
- Build logical thinking
- Solve production-inspired engineering missions
- Debug real-world scenarios
- Optimize software
- Review architecture
- Build verified portfolios
- Prepare for internships and jobs

---

# 🧭 How Atlas Works

Atlas follows a structured engineering learning journey.

```text
Choose Career Goal
        │
        ▼
Personalized Learning Roadmap
        │
        ▼
Interactive Lessons
        │
        ▼
Logic Building Challenges
        │
        ▼
Engineering Missions
        │
        ▼
Guide Mode & Simplify Mode
        │
        ▼
Secure Code Execution
        │
        ▼
AI Engineering Review
        │
        ▼
Engineering Passport
        │
        ▼
Career Preparation
        │
        ▼
Skill-Based Hiring (Future)
```

---

# ✨ Core Features

## 📚 Adaptive Learning Engine

- Personalized Learning Paths
- Career Roadmaps
- Interactive Lessons
- Revision Engine
- Learning Analytics

---

## 🎯 Engineering Mission Engine

Learn by building real software.

Examples include:

- Authentication Systems
- REST APIs
- Android Features
- Backend Services
- Search Optimization
- Performance Engineering
- Debugging Production Bugs
- Architecture Challenges

---

## 💻 Secure Code Workspace

- Modern Code Editor
- Compiler Execution
- Test Cases
- Performance Analysis
- Memory Analysis
- Engineering Reports

---

## 🧠 Atlas AI *(Upcoming)*

A Senior Software Engineer AI Mentor.

Capabilities:

- Explain concepts
- Guide problem solving
- Review code
- Suggest improvements
- Debug applications
- Architecture feedback

---

## 📈 Engineering Progression

Track engineering growth using:

- XP
- Levels
- Badges
- Streaks
- Skills
- Learning Analytics
- Engineering Journal

---

## 🛂 Engineering Passport

Automatically generate a verified engineering portfolio.

Includes:

- Projects
- Skills
- Engineering Timeline
- Resume Builder
- Certificates
- GitHub Integration
- Shareable Portfolio

---

## 💼 Hiring Ecosystem *(Future)*

Connect learners directly with companies through verified engineering skills instead of traditional resumes.

---

# 🛠 Technology Stack

## Frontend

- React.js
- Vite
- Vanilla CSS
- Lucide React

## Backend

- Node.js
- Express.js

## Database

- SQLite

## AI

- Google Gemini API
- Multi-LLM Support (Future)

## Compiler

- Secure Execution Engine
- Benchmark Simulator
- Performance Analyzer

---

# 📂 Repository Structure

```text
Atlas/
│
├── frontend/                # React + Vite SPA
│   ├── src/
│   │   ├── api/             # Shared API client (client.js)
│   │   ├── components/      # Feature folders
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   ├── mission/
│   │   │   ├── learn/
│   │   │   ├── passport/
│   │   │   ├── career/
│   │   │   ├── practice/
│   │   │   ├── onboarding/
│   │   │   ├── settings/
│   │   │   └── layout/      # Sidebar
│   │   ├── App.jsx
│   │   └── index.css
│   └── .env.example
│
├── backend/                 # Express APIs
│   ├── src/
│   │   ├── config/          # Settings + secrets
│   │   ├── db/              # index.js (init) + schema.js + seed.js
│   │   ├── middleware/
│   │   ├── routes/          # Route modules
│   │   ├── services/        # AI, compiler, git, email (AI_SIM)
│   │   ├── utils/
│   │   └── scripts/         # reset-db.js
│   ├── app.js               # app factory (createApp)
│   ├── server.js            # entry point
│   └── .env.example
│
├── db/
│   └── atlas.sqlite         # runtime DB (git-ignored)
│
├── docs/                    # PRDs & Documentation
│
└── README.md
```

---

# ⚙️ Environment Setup

## Clone Repository

```bash
git clone <repository-url>
cd Atlas
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## Backend

```bash
cd backend
npm install
npm run start
```

Backend runs on:

```
http://localhost:5001
```

---

## Environment Variables

Create a `.env` file inside the `backend/` directory (`backend/.env.example` documents every variable):

```env
PORT=5001

DATABASE_PATH=../db/atlas.sqlite

GEMINI_API_KEY=YOUR_API_KEY

JWT_SECRET=YOUR_SECRET
```

The frontend optionally uses `frontend/.env` with `VITE_API_BASE_URL` (defaults to `http://localhost:5001/api`).

---

# 🌿 Git Workflow

```text
main
│
├── develop
│
├── feature/*
│
├── bugfix/*
│
└── release/*
```

### Branch Naming

```
feature/learning-engine

feature/authentication

feature/mission-engine

bugfix/login

hotfix/compiler
```

---

# 💻 Coding Standards

### Frontend

- React Functional Components
- Reusable Components
- Hooks
- Clean Folder Structure
- Vanilla CSS

### Backend

- RESTful APIs
- Async/Await
- Modular Architecture
- Proper Error Handling

### General

- Meaningful Commit Messages
- Reusable Code
- Avoid Duplicate Logic
- Consistent Naming Conventions
- Write Clean & Readable Code

---

# 📚 Documentation

All product documentation is available inside the `docs/` directory.

Includes:

- Vision & Product Strategy
- Product Requirements Documents (PRDs)
- Business Model
- Product Roadmap
- Architecture Documents
- Design System
- Future Planning

---

# 🚧 Current Development

## ✅ Completed

- Authentication Prototype
- Dashboard
- Mission IDE
- Logic Sandbox
- Engineering Passport
- Career Vault
- Atlas Control Center
- SQLite Database
- Backend APIs
- Compiler Benchmark Simulation
- AI Chat Prototype

---

## 🚀 In Progress

- Learning Engine
- Lesson Viewer
- Personalized Roadmaps
- User Profiles
- Mission Engine
- Guide Mode
- Simplify Mode
- Revision Engine

---

## 🔮 Planned

- Real Compiler Sandbox
- AI Mentor
- Engineering Progression
- Community
- Hiring Platform
- University Portal
- Enterprise Dashboard
- Marketplace
- Mobile Applications

---

# 🗺 Development Roadmap

```
Authentication
        │
        ▼
Learning Engine
        │
        ▼
Engineering Mission Engine
        │
        ▼
Compiler & Sandbox
        │
        ▼
Engineering Passport
        │
        ▼
AI Mentor
        │
        ▼
Community
        │
        ▼
Hiring Platform
```

---

# 👥 Core Team

### Abhinav Alok

Founder • CTO • Product Architect

---

### Danish Ayubi

COO • Product Strategy

---

### Deepika Yadav

CEO • Operations

---

# 🤝 Contributing

This repository is currently private and under active development.

Before contributing, please:

1. Read the documentation inside `docs/`
2. Follow the coding standards
3. Create feature branches
4. Submit Pull Requests for review
5. Keep commits small and meaningful

---

# 📝 Known Limitations

Current prototype includes:

- Simulated compiler execution
- SQLite database
- Prototype authentication
- AI fallback mode when Gemini API is unavailable
- Basic benchmark engine

These will be replaced with production-ready implementations in future releases.

---

# 📄 License

This repository is private.

Copyright © TechInfinit Studio.

All Rights Reserved.

Unauthorized copying, redistribution, or commercial use is prohibited.

---

<div align="center">

## Built with ❤️ by TechInfinit Studio

### Empowering the Next Generation of Software Engineers

**Atlas • Learn • Build • Engineer • Get Hired**

</div>