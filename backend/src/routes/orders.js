import express from 'express';
import db from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { customer_code, table_no, items } = req.body;

  if (!customer_code || !table_no || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customer_code, table_no and items are required' });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const itemIds = items.map((item) => item.menu_id);
    const placeholders = itemIds.map(() => '?').join(',');
    const [menuRows] = await connection.query(`SELECT id, price FROM menu WHERE id IN (${placeholders})`, itemIds);
    const menuMap = new Map(menuRows.map((menu) => [menu.id, Number(menu.price)]));

    const totalPrice = items.reduce((sum, item) => {
      const price = menuMap.get(item.menu_id) || 0;
      return sum + price * Number(item.quantity || 0);
    }, 0);

    const [orderResult] = await connection.execute(
      'INSERT INTO orders (customer_code, table_no, total_price, status, paid) VALUES (?, ?, ?, ?, ?)',
      [customer_code, table_no, totalPrice, 'pending', 0]
    );

    const orderId = orderResult.insertId;
    const itemPromises = items.map((item) => connection.execute(
      'INSERT INTO order_items (order_id, menu_id, quantity, status) VALUES (?, ?, ?, ?)',
      [orderId, item.menu_id, item.quantity, 'pending']
    ));

    await Promise.all(itemPromises);
    
    // Mark customer code as used (status = '1')
    await connection.execute(
      'UPDATE customer_codes SET status = ? WHERE code = ?',
      ['1', customer_code]
    );
    
    await connection.commit();

    res.status(201).json({ orderId, customer_code, table_no, total_price: totalPrice });
  } catch (error) {
    await connection.rollback();
    console.error('Order creation failed', error);
    res.status(500).json({ error: 'Order could not be created' });
  } finally {
    connection.release();
  }
});

router.get('/', async (req, res) => {
  const { customer_code } = req.query;

  if (!customer_code) {
    return res.status(400).json({ error: 'customer_code is required' });
  }

  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE customer_code = ? ORDER BY order_date DESC', [customer_code]);
    const [items] = await db.query(
      `SELECT oi.*, m.name, m.price, m.type, m.image
       FROM order_items oi
       JOIN menu m ON oi.menu_id = m.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.customer_code = ?
       ORDER BY oi.created_at DESC`,
      [customer_code]
    );
    res.json({ orders, items });
  } catch (error) {
    console.error('Order query failed', error);
    res.status(500).json({ error: 'Unable to fetch orders' });
  }
});

router.get('/all', async (req, res) => {
  const { type, status } = req.query;

  try {
    let sql = `SELECT oi.id AS item_id, oi.order_id, oi.quantity, oi.status, oi.ready_time, oi.ready_at, oi.delivered_at,
                      o.customer_code, o.table_no, o.total_price, o.status AS order_status, o.paid,
                      m.id AS menu_id, m.name, m.type, m.price AS item_price
               FROM order_items oi
               JOIN orders o ON oi.order_id = o.id
               JOIN menu m ON oi.menu_id = m.id`;
    const conditions = [];
    const params = [];

    if (type) {
      conditions.push('m.type = ?');
      params.push(type);
    }
    if (status) {
      conditions.push('oi.status = ?');
      params.push(status);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY o.order_date DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Staff order query failed', error);
    res.status(500).json({ error: 'Unable to fetch staff orders' });
  }
});

router.post('/item/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, ready_time } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const updates = [];
    const params = [];

    if (status === 'pending' && ready_time != null) {
      updates.push('ready_time = ?');
      updates.push('ready_at = DATE_ADD(NOW(), INTERVAL ? MINUTE)');
      params.push(ready_time, ready_time);
    }

    if (status === 'ready') {
      updates.push('status = ?');
      updates.push('ready_at = NULL');
      params.push(status);
    }

    if (status === 'delivered') {
      updates.push('status = ?');
      updates.push('delivered_at = NOW()');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid update parameters provided' });
    }

    params.push(id);
    await connection.execute(`UPDATE order_items SET ${updates.join(', ')} WHERE id = ?`, params);

    const [itemRows] = await connection.query('SELECT order_id FROM order_items WHERE id = ?', [id]);
    if (itemRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order item not found' });
    }

    const orderId = itemRows[0].order_id;
    if (status === 'delivered') {
      const [pendingRows] = await connection.query(
        'SELECT COUNT(*) AS pendingCount FROM order_items WHERE order_id = ? AND status != ?',
        [orderId, 'delivered']
      );
      const pendingCount = pendingRows[0]?.pendingCount || 0;
      if (pendingCount === 0) {
        await connection.execute('UPDATE orders SET status = ? WHERE id = ?', ['completed', orderId]);
      }
    }

    await connection.commit();
    res.json({ success: true, item_id: Number(id), status });
  } catch (error) {
    await connection.rollback();
    console.error('Order item update failed', error);
    res.status(500).json({ error: 'Unable to update order item status' });
  } finally {
    connection.release();
  }
});

export default router;
