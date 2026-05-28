const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

router.get('/', requireAuth, (req, res) => {
  const subs = db.prepare('SELECT * FROM subscriptions ORDER BY next_billing ASC').all();
  const monthly_total = subs.reduce((sum, s) => {
    if (s.frequency === 'weekly')  return sum + s.amount * 4.33;
    if (s.frequency === 'monthly') return sum + s.amount;
    if (s.frequency === 'yearly')  return sum + s.amount / 12;
    return sum;
  }, 0);
  res.json({ subscriptions: subs, monthly_total });
});

router.post('/', requireAuth, (req, res) => {
  const { merchant_name, amount, currency, frequency, next_billing, category } = req.body;
  const result = db.prepare(`
    INSERT INTO subscriptions (merchant_name, amount, currency, frequency, next_billing, category, is_manual)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(merchant_name, amount, currency || 'EUR', frequency, next_billing, category || 'Subscriptions');
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM subscriptions WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
