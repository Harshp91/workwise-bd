const express = require('express');
const auth = require('../middleware/auth');
const pool = require('../db');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// Add Product (validation added)
router.post(
  '/add-product',
  auth,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('description').optional(),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')
  ],
  async (req, res) => {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Access denied' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, description, price, discount } = req.body;

    try {
      const result = await pool.query(
        'INSERT INTO products (name, category, description, price, discount, seller_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, category, description, price, discount, req.user.id]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Add Product Error:', error); // Log the error for debugging
      res.status(500).json({ error: 'Failed to add product' });
    }
  }
);

// Edit Product (validation added)
router.put(
  '/edit-product/:id',
  auth,
  [
    param('id').isInt().withMessage('Product ID must be an integer'),
    body('name').optional().notEmpty().withMessage('Invalid name'),
    body('category').optional().notEmpty().withMessage('Invalid category'),
    body('description').optional(),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')
  ],
  async (req, res) => {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Access denied' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, category, description, price, discount } = req.body;

    try {
      const result = await pool.query(
        'UPDATE products SET name = $1, category = $2, description = $3, price = $4, discount = $5 WHERE id = $6 AND seller_id = $7 RETURNING *',
        [name, category, description, price, discount, id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Product not found or unauthorized' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Edit Product Error:', error); // Log the error for debugging
      res.status(500).json({ error: 'Failed to edit product' });
    }
  }
);

// Delete Product (validation added)
router.delete(
  '/delete-product/:id',
  auth,
  [param('id').isInt().withMessage('Product ID must be an integer')],
  async (req, res) => {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Access denied' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    try {
      const result = await pool.query('DELETE FROM products WHERE id = $1 AND seller_id = $2', [id, req.user.id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Product not found or unauthorized' });
      }

      res.json({ message: 'Product deleted' });
    } catch (error) {
      console.error('Delete Product Error:', error); // Log the error for debugging
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }
);

module.exports = router;
