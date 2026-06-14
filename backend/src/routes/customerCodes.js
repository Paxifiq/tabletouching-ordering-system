import express from 'express';
import db from '../db.js';

const router = express.Router();

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
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

router.get('/:code/access', async (req, res) => {
  const { code } = req.params;

  try {
    const [codeRows] = await db.query('SELECT * FROM customer_codes WHERE code = ?', [code]);
    if (codeRows.length === 0) {
      return res.status(404).json({
        allowed: false,
        message: 'CODE NOT FOUND'
      });
    }

    if (codeRows[0].status === '3') {
      return res.json({
        allowed: false,
        code,
        message: 'CODE USED'
      });
    }

    const [[summary]] = await db.query(
      `SELECT
        COUNT(*) AS order_count,
        IFNULL(SUM(total_price), 0) AS total_due,
        SUM(CASE WHEN paid = 0 THEN 1 ELSE 0 END) AS unpaid_count
       FROM orders
       WHERE customer_code = ?`,
      [code]
    );

    const orderCount = Number(summary.order_count || 0);
    const unpaidCount = Number(summary.unpaid_count || 0);
    const allowed = orderCount > 0 && unpaidCount === 0;

    if (allowed) {
      await db.execute('UPDATE customer_codes SET status = ? WHERE code = ?', ['3', code]);
    }

    res.json({
      allowed,
      code,
      total_due: Number(summary.total_due || 0),
      message: allowed ? 'PAID - DOOR OPEN' : 'NOT PAID'
    });
  } catch (error) {
    console.error('Customer access check failed', error);
    res.status(500).json({
      allowed: false,
      message: 'SERVER ERROR'
    });
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
