# TokTickIT (ตอกติ๊กกิต) — IT Service Desk

> **วิชา:** CPE 334 — Introduction to Software Engineering in the Age of AI Agents (1/2026)  
> **นักศึกษา:** Dechayut (67070503414) | **Peer Reviewer:** Vieng (67070503404)

---

## 📌 Project Overview
TokTickIT is a full-stack IT Service Desk application designed to handle IT request categories including **Account and Access**, **Hardware**, **Software**, and **Network**.

---

## 🛠️ Technology Stack
- **Frontend:** React + TypeScript + Vite + Bootstrap
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Testing:** Vitest (UI Tests) & Supertest (API Tests)

---

## ⚙️ Setup & Installation

### 1. Client Setup
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

### 2. Server Setup
```bash
cd server
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

---

## 🧪 Running Automated Tests
```bash
# Run backend API tests (Supertest)
cd server && npm test

# Run frontend UI tests (Vitest)
cd client && npm test
```