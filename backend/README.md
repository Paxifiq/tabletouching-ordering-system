# Tabletouch Ordering System Backend

This backend provides the REST API for the Tabletouch restaurant ordering system.

## Setup

1. Copy `.env.example` to `.env` and update the MySQL connection settings.
2. Import `backend/data/init.sql` into your MySQL server.
3. Install dependencies:

```bash
cd backend
npm install
```

4. Start the server:

```bash
npm run dev
```

The backend will be available at `http://localhost:4000`.
