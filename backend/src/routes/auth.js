import express from 'express';
import db from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Login failed', error);
    res.status(500).json({ error: 'Unable to login' });
  }
});

export default router;
