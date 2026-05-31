import express from 'express';
import db from '../db.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const FLUTTERWAVE_API_URL = process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_CUSTOMER_EMAIL = process.env.FLUTTERWAVE_CUSTOMER_EMAIL || 'customer@tabletouch.local';

function getFlutterwaveHeaders() {
  if (!FLUTTERWAVE_SECRET_KEY) {
    const error = new Error('FLUTTERWAVE_SECRET_KEY is not configured');
    error.status = 500;
    throw error;
  }

  return {
    Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

function buildTxRef(customerCode) {
  return `TT-${customerCode}-${Date.now()}-${uuidv4().slice(0, 8)}`;
}

function getAuthorizationUrl(responseData) {
  return responseData?.meta?.authorization?.redirect
    || responseData?.data?.link
    || responseData?.data?.redirect_url
    || null;
}

function getFlutterwaveTransaction(responseData) {
  const transaction = responseData?.data;
  if (Array.isArray(transaction)) {
    return transaction[0] || null;
  }
  return transaction || null;
}

function normalizeFlutterwaveStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function getFlutterwaveAmount(transaction) {
  return Number(transaction?.amount ?? transaction?.charged_amount ?? transaction?.app_fee ?? 0);
}

function getFlutterwaveCurrency(transaction) {
  return String(transaction?.currency || transaction?.charged_currency || '').trim().toUpperCase();
}

function getFlutterwaveTxRef(transaction) {
  return transaction?.tx_ref || transaction?.txRef || transaction?.flw_ref || null;
}

async function recordSuccessfulPayment({ customer_code, phone_number, amount }) {
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

  return { paymentId: paymentResult.insertId, customer_code, paidAmount, totalDue, paid: isPaid };
}

// Initiate Flutterwave Rwanda MoMo payment
router.post('/momo/request', async (req, res) => {
  const { phone_number, amount, customer_code, fullname, email } = req.body;

  if (!phone_number || !amount || !customer_code) {
    return res.status(400).json({ error: 'phone_number, amount, and customer_code are required' });
  }

  try {
    const txRef = buildTxRef(customer_code);
    const payload = {
      phone_number,
      amount: Number(amount),
      currency: 'RWF',
      email: email || FLUTTERWAVE_CUSTOMER_EMAIL,
      fullname: fullname || `Tabletouch ${customer_code}`,
      tx_ref: txRef,
      meta: {
        customer_code,
      },
    };

    const response = await axios.post(
      `${FLUTTERWAVE_API_URL}/charges?type=mobile_money_rwanda`,
      payload,
      {
        headers: getFlutterwaveHeaders(),
      }
    );

    res.status(202).json({
      tx_ref: txRef,
      status: response.data?.status,
      message: response.data?.message || 'Payment request sent',
      authorization_url: getAuthorizationUrl(response.data),
      flutterwave: response.data,
    });
  } catch (error) {
    console.error('Flutterwave MoMo request failed:', error?.response?.data || error.message);
    res.status(error.status || 500).json({
      error: 'Flutterwave MoMo payment request failed',
      details: error?.response?.data?.message || error?.response?.data?.error || error.message,
    });
  }
});

// Verify Flutterwave MoMo payment status and record successful payments
router.post('/momo/status/:txRef', async (req, res) => {
  const { txRef } = req.params;
  const { customer_code, phone_number, amount } = req.body;

  if (!customer_code || !phone_number || !amount) {
    return res.status(400).json({ error: 'customer_code, phone_number, and amount are required' });
  }

  try {
    const response = await axios.get(
      `${FLUTTERWAVE_API_URL}/transactions/verify_by_reference`,
      {
        headers: getFlutterwaveHeaders(),
        params: { tx_ref: txRef },
      }
    );

    const transaction = getFlutterwaveTransaction(response.data);
    const transactionStatus = normalizeFlutterwaveStatus(transaction?.status || response.data?.status);
    const transactionCurrency = getFlutterwaveCurrency(transaction);
    const transactionAmount = getFlutterwaveAmount(transaction);
    const transactionTxRef = getFlutterwaveTxRef(transaction);
    const verified = ['successful', 'success'].includes(transactionStatus)
      && transactionCurrency === 'RWF'
      && transactionAmount >= Number(amount)
      && transactionTxRef === txRef;

    if (!verified) {
      return res.json({
        tx_ref: txRef,
        status: transactionStatus || 'pending',
        verified: false,
        verification: {
          status: transactionStatus || null,
          currency: transactionCurrency || null,
          amount: transactionAmount || null,
          tx_ref: transactionTxRef || null,
          expected_amount: Number(amount),
          expected_tx_ref: txRef,
        },
        flutterwave: response.data,
      });
    }

    const payment = await recordSuccessfulPayment({ customer_code, phone_number, amount });
    res.json({
      ...payment,
      tx_ref: txRef,
      status: transactionStatus,
      verified: true,
      flutterwave: response.data,
    });
  } catch (error) {
    console.error('Flutterwave MoMo status check failed:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Could not verify Flutterwave payment status',
      details: error?.response?.data?.message || error?.response?.data?.error || error.message,
    });
  }
});

// Record manual payment (existing)
router.post('/', async (req, res) => {
  const { customer_code, phone_number, amount } = req.body;
  if (!customer_code || !phone_number || !amount) {
    return res.status(400).json({ error: 'customer_code, phone_number, and amount are required' });
  }
  try {
    const payment = await recordSuccessfulPayment({ customer_code, phone_number, amount });
    res.status(201).json(payment);
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
