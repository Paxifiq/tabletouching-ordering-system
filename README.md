# Tabletouch Ordering System

A full-stack MERN-style restaurant ordering system rewritten from the original PHP/MySQL version.

## Contents

- `backend/` — Node.js + Express API connecting to MySQL
- `frontend/` — React + Vite frontend with an interactive menu and cart

## Setup

1. Create a MySQL database named `table_touch_ordering`.
2. Import `backend/data/init.sql` into MySQL.
3. Copy `backend/.env.example` to `backend/.env` and update credentials.
4. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
5. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
6. Start the backend:
   ```bash
   cd ../backend
   npm run dev
   ```
7. Start the frontend:
   ```bash
   cd ../frontend
   npm run dev
   ```

The frontend will run on `http://localhost:5173` and the API on `http://localhost:4000`.
