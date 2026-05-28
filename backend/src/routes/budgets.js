const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

function currentMonth() { return new Date().toISOString().slice(0, 7); }

router.get('/', requireAuth, (req, res) => {
  const month = req.query.month || currentMonth();
  const budgets = db.prepare('SELECT * FROM budgets ORDER BY category').all();

  const result = budgets.map(b => {
    const spent = db.prepare(`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM transactions
      WHERE category=? AND amount<0 AND strftime('%Y-%m', date)=? AND is_split=0
    `).get(b.category, month).total;

    const carry = b.rollover
      ? (db.prepare('SELECT COALESCE(rollover_carry,0) as rc FROM budget_months WHERE budget_id=? AND month=?')
          .get(b.id, month)?.rc || 0)
      : 0;

    const effective_limit = b.monthly_limit + carry;
    return { ...b, spent, carry, effective_limit, month, pct: Math.min(100, (spent / effective_limit) * 100) };
  });

  res.json(result);
});

router.post('/', requireAuth, (req, res) => {
  const { category, monthly_limit, rollover, color } = req.body;
  const result = db.prepare(`
    INSERT INTO budgets (category, monthly_limit, rollover, color)
    VALUES (?, ?, ?, ?)
  `).run(category, monthly_limit, rollover ? 1 : 0, color || '#6366f1');
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, (req, res) => {
  const { monthly_limit, rollover, color } = req.body;
  db.prepare(`
    UPDATE budgets SET monthly_limit=?, rollover=?, color=? WHERE id=?
  `).run(monthly_limit, rollover ? 1 : 0, color, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM budgets WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
