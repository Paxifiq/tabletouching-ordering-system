import express from 'express';
import db from '../db.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const MOMO_BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
const MOMO_SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY;
const MOMO_API_USER = process.env.MOMO_API_USER;
const MOMO_API_KEY = process.env.MOMO_API_KEY;

// Get MoMo access token
async function getMoMoToken() {
  const credentials = Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString('base64');
  const response = await axios.post(
    `${MOMO_BASE_URL}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
      },
    }
  );
  return response.data.access_token;
}

// Initiate MoMo payment
router.post('/momo/request', async (req, res) => {
  const { phone_number, amount, customer_code } = req.body;

  if (!phone_number || !amount || !customer_code) {
    return res.status(400).json({ error: 'phone_number, amount, and customer_code are required' });
  }

  try {
    const token = await getMoMoToken();
    const referenceId = uuidv4();

    await axios.post(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: String(amount),
        currency: 'EUR', // sandbox uses EUR
        externalId: customer_code,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phone_number,
        },
        payerMessage: `Payment for order - Table ${customer_code}`,
        payeeNote: `Order payment ${customer_code}`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': 'sandbox',
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(202).json({ referenceId, message: 'Payment request sent' });
  } catch (error) {
    console.error('MoMo request failed:', error?.response?.data || error.message);
    res.status(500).json({ error: 'MoMo payment request failed' });
  }
});

// Check MoMo payment status
router.get('/momo/status/:referenceId', async (req, res) => {
  const { referenceId } = req.params;
  try {
    const token = await getMoMoToken();
    const response = await axios.get(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
          'X-Target-Environment': 'sandbox',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('MoMo status check failed:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Could not check payment status' });
  }
});

// Record manual payment (existing)
router.post('/', async (req, res) => {
  const { customer_code, phone_number, amount } = req.body;
  if (!customer_code || !phone_number || !amount) {
    return res.status(400).json({ error: 'customer_code, phone_number, and amount are required' });
  }
  try {
    const [paymentResult] = await db.execute(
      'INSERT INTO payments (customer_code, phone_number, amount) VALUES (?, ?, ?)',
      [customer_code, phone_number, amount]
    );
    const [[summary]] = await db.query(
      'SELECT IFNULL(SUM(amount),0) AS paid_amount FROM payments WHERE customer_code = ?',
      [customer_code]
    );
    const [[orderSummary]] = await db.query(
      'SELECT IFNULL(SUM(total_price),0) AS total_due FROM orders WHERE customer_code = ? AND paid = 0',
      [customer_code]
    );
    const paidAmount = Number(summary.paid_amount || 0);
    const totalDue = Number(orderSummary.total_due || 0);
    const isPaid = paidAmount >= totalDue;
    if (isPaid) {
      await db.execute('UPDATE orders SET paid = 1 WHERE customer_code = ? AND paid = 0', [customer_code]);
    }
    res.status(201).json({ paymentId: paymentResult.insertId, customer_code, paidAmount, totalDue, paid: isPaid });
  } catch (error) {
    console.error('Payment recording failed', error);
    res.status(500).json({ error: 'Unable to record payment' });
  }
});

// Fetch all payments (existing)
router.get('/', async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT p.id, p.customer_code, p.phone_number, p.amount, p.payment_date AS created_at
       FROM payments p ORDER BY p.payment_date DESC`
    );
    const [[summary]] = await db.query('SELECT IFNULL(SUM(amount),0) AS total_payments FROM payments');
    res.json({ payments, total_payments: Number(summary.total_payments || 0) });
  } catch (error) {
    console.error('Payment query failed', error);
    res.status(500).json({ error: 'Unable to fetch payments' });
  }
});

export default router;
