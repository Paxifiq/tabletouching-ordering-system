import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, role FROM users ORDER BY role, username');
    res.json(rows);
  } catch (error) {
    console.error('Fetching users failed', error);
    res.status(500).json({ error: 'Unable to fetch users' });
  }
});

router.post('/', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'username, password, and role are required' });
  }

  try {
    const [result] = await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, role]);
    res.status(201).json({ id: result.insertId, username, role });
  } catch (error) {
    console.error('Create user failed', error);
    res.status(500).json({ error: 'Unable to create user' });
  }
});

export default router;
