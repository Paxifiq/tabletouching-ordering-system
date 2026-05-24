import express from 'express';
import db from '../db.js';

const router = express.Router();

function generateCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

router.post('/', async (req, res) => {
  const { status = '0', table_no } = req.body;
  const code = generateCode();

  try {
    await db.execute(
      'INSERT INTO customer_codes (code, status, table_no) VALUES (?, ?, ?)',
      [code, status, table_no || null]
    );
    res.status(201).json({ code, status, table_no: table_no || null });
  } catch (error) {
    console.error('Customer code creation failed', error);
    res.status(500).json({ error: 'Unable to create customer code' });
  }
});

router.get('/', async (req, res) => {
  const { all } = req.query;

  try {
    if (all === 'true') {
      const [rows] = await db.query('SELECT * FROM customer_codes ORDER BY created_at DESC');
      return res.json(rows);
    }
    res.status(400).json({ error: 'Missing query parameter: all=true' });
  } catch (error) {
    console.error('Customer code fetch failed', error);
    res.status(500).json({ error: 'Unable to fetch customer codes' });
  }
});

router.get('/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM customer_codes WHERE code = ?', [code]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Code not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Customer code fetch failed', error);
    res.status(500).json({ error: 'Unable to fetch customer code' });
  }
});

export default router;
