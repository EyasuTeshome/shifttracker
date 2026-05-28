const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

function currentMonth() { return new Date().toISOString().slice(0, 7); }

router.get('/', requireAuth, async (req, res) => {
  try {
    const month   = req.query.month || currentMonth();
    const budgets = await db.query('SELECT * FROM budgets ORDER BY category');

    const result = await Promise.all(budgets.map(async b => {
      const [spentRow] = await db.query(`
        SELECT COALESCE(SUM(ABS(amount)), 0) AS total
        FROM transactions
        WHERE category=$1 AND amount<0
          AND TO_CHAR(date, 'YYYY-MM')=$2
          AND is_split = false
      `, [b.category, month]);

      const carryRow = b.rollover
        ? await db.one(
            'SELECT COALESCE(rollover_carry, 0) AS rc FROM budget_months WHERE budget_id=$1 AND month=$2',
            [b.id, month]
          )
        : null;

      const spent          = parseFloat(spentRow.total);
      const carry          = parseFloat(carryRow?.rc || 0);
      const effective_limit = parseFloat(b.monthly_limit) + carry;
      const pct            = Math.min(100, (spent / effective_limit) * 100);

      return { ...b, spent, carry, effective_limit, month, pct };
    }));

    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { category, monthly_limit, rollover, color } = req.body;
    const [row] = await db.query(
      'INSERT INTO budgets (category, monthly_limit, rollover, color) VALUES ($1,$2,$3,$4) RETURNING id',
      [category, monthly_limit, !!rollover, color || '#6366f1']
    );
    res.json({ id: row.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { monthly_limit, rollover, color } = req.body;
    await db.query(
      'UPDATE budgets SET monthly_limit=$1, rollover=$2, color=$3 WHERE id=$4',
      [monthly_limit, !!rollover, color, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM budgets WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
