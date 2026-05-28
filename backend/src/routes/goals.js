const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

router.get('/', requireAuth, async (req, res) => {
  try { res.json(await db.query('SELECT * FROM goals ORDER BY created_at DESC')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, target_amount, current_amount, deadline, color } = req.body;
    const [row] = await db.query(
      'INSERT INTO goals (name, target_amount, current_amount, deadline, color) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [name, target_amount, current_amount || 0, deadline || null, color || '#10b981']
    );
    res.json({ id: row.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, target_amount, current_amount, deadline, color } = req.body;
    await db.query(
      'UPDATE goals SET name=$1, target_amount=$2, current_amount=$3, deadline=$4, color=$5 WHERE id=$6',
      [name, target_amount, current_amount, deadline || null, color, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM goals WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
