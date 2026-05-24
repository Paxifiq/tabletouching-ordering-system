import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [[{ total_orders }]] = await db.query('SELECT COUNT(*) AS total_orders FROM orders');
    const [[{ pending_orders }]] = await db.query("SELECT COUNT(*) AS pending_orders FROM orders WHERE status = 'pending'");
    const [[{ completed_orders }]] = await db.query("SELECT COUNT(*) AS completed_orders FROM orders WHERE status = 'completed'");
    const [[{ total_sales }]] = await db.query('SELECT IFNULL(SUM(total_price),0) AS total_sales FROM orders');
    const [[{ total_payments }]] = await db.query('SELECT IFNULL(SUM(amount),0) AS total_payments FROM payments');
    const [[{ outstanding_balance }]] = await db.query(
      'SELECT IFNULL((SELECT SUM(total_price) FROM orders),0) - IFNULL((SELECT SUM(amount) FROM payments),0) AS outstanding_balance'
    );

    res.json({
      total_orders: Number(total_orders || 0),
      pending_orders: Number(pending_orders || 0),
      completed_orders: Number(completed_orders || 0),
      total_sales: Number(total_sales || 0),
      total_payments: Number(total_payments || 0),
      outstanding_balance: Number(outstanding_balance || 0)
    });
  } catch (error) {
    console.error('Report summary error', error);
    res.status(500).json({ error: 'Unable to generate reports' });
  }
});

export default router;
