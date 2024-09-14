const express = require('express');
const auth = require('../middleware/auth');
const pool = require('../db');
const { body, query, param, validationResult } = require('express-validator');

const router = express.Router();

// Search Route (with query validation)
router.get(
  '/search',
  auth,
  [
    query('name').optional().isString().withMessage('Invalid name format'),
    query('category').optional().isString().withMessage('Invalid category format'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name = '', category = '' } = req.query;

    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE name ILIKE $1 OR category ILIKE $2',
        [`%${name}%`, `%${category}%`]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Search Error:', error); // Log error for debugging
      res.status(500).json({ error: 'Search failed' });
    }
  }
);

// Add to Cart (with input validation)
router.post(
  '/add-to-cart',
  auth,
  [
    body('productId').isInt().withMessage('Product ID must be an integer'),
  ],
  async (req, res) => {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.body;

    try {
      const result = await pool.query(
        'INSERT INTO carts (buyer_id, product_id) VALUES ($1, $2) RETURNING *',
        [req.user.id, productId]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Add to Cart Error:', error); // Log error for debugging
      res.status(500).json({ error: 'Failed to add to cart' });
    }
  }
);

// Remove from Cart (with path parameter validation)
router.delete(
  '/remove-from-cart/:id',
  auth,
  [
    param('id').isInt().withMessage('Cart item ID must be an integer'),
  ],
  async (req, res) => {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    try {
      await pool.query('DELETE FROM carts WHERE id = $1 AND buyer_id = $2', [id, req.user.id]);
      res.json({ message: 'Product removed from cart' });
    } catch (error) {
      console.error('Remove from Cart Error:', error); // Log error for debugging
      res.status(500).json({ error: 'Failed to remove from cart' });
    }
  }
);

module.exports = router;
