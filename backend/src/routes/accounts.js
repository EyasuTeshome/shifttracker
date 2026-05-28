const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM accounts ORDER BY name').all());
});

router.post('/', requireAuth, (req, res) => {
  const { name, currency, balance } = req.body;
  const result = db.prepare(
    'INSERT INTO accounts (name, currency, balance) VALUES (?, ?, ?)'
  ).run(name, currency || 'EUR', balance || 0);
  res.json({ id: result.lastInsertRowid });
});

module.exports = router;
