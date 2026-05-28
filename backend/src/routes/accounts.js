const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

router.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await db.query('SELECT * FROM accounts ORDER BY name'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, currency, balance } = req.body;
    const [row] = await db.query(
      'INSERT INTO accounts (name, currency, balance) VALUES ($1, $2, $3) RETURNING id',
      [name, currency || 'EUR', balance || 0]
    );
    res.json({ id: row.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
