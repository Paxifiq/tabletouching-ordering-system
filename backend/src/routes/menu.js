import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

// Helper function to build absolute image URL
const getAbsoluteImageUrl = (imagePath, req) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:4000';
  return `${protocol}://${host}${imagePath}`;
};

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const type = req.query.type;
    const sql = type ? 'SELECT * FROM menu WHERE type = ? ORDER BY id' : 'SELECT * FROM menu ORDER BY id';
    const [rows] = type ? await db.query(sql, [type]) : await db.query(sql);
    
    // Convert relative image paths to absolute URLs
    const itemsWithAbsoluteUrls = rows.map(item => ({
      ...item,
      image: getAbsoluteImageUrl(item.image, req)
    }));
    
    res.json(itemsWithAbsoluteUrls);
  } catch (error) {
    console.error('Menu fetch error', error);
    res.status(500).json({ error: 'Unable to load menu items' });
  }
});

// Add new menu item with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, type } = req.body;
    
    if (!name || !price || !type || !req.file) {
      return res.status(400).json({ error: 'Missing required fields: name, price, type, and image' });
    }

      const imagePath = `/api/uploads/${req.file.filename}`;
      const absoluteImageUrl = getAbsoluteImageUrl(imagePath, req);
      
      const sql = 'INSERT INTO menu (name, price, description, image, type) VALUES (?, ?, ?, ?, ?)';
      const [result] = await db.query(sql, [name, price, description, imagePath, type]);

      res.status(201).json({ 
        id: result.insertId, 
        name, 
        price, 
        description, 
        image: absoluteImageUrl, 
        type 
      });
    } catch (error) {
      console.error('Menu creation error', error);
      res.status(500).json({ error: 'Unable to create menu item' });
    }
  });

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, type } = req.body;
    const fields = [];
    const params = [];

    if (name) {
      fields.push('name = ?');
      params.push(name);
    }
    if (price) {
      fields.push('price = ?');
      params.push(price);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    if (type) {
      fields.push('type = ?');
      params.push(type);
    }
    if (req.file) {
      fields.push('image = ?');
      params.push(`/api/uploads/${req.file.filename}`);
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    params.push(id);
    const sql = `UPDATE menu SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ success: true, id: Number(id) });
  } catch (error) {
    console.error('Menu update error', error);
    res.status(500).json({ error: 'Unable to update menu item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM menu WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Menu delete error', error);
    res.status(500).json({ error: 'Unable to delete menu item' });
  }
});

export default router;

