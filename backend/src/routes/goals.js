const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all());
});

router.post('/', requireAuth, (req, res) => {
  const { name, target_amount, current_amount, deadline, color } = req.body;
  const result = db.prepare(`
    INSERT INTO goals (name, target_amount, current_amount, deadline, color)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, target_amount, current_amount || 0, deadline || null, color || '#10b981');
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, (req, res) => {
  const { name, target_amount, current_amount, deadline, color } = req.body;
  db.prepare(`
    UPDATE goals SET name=?, target_amount=?, current_amount=?, deadline=?, color=? WHERE id=?
  `).run(name, target_amount, current_amount, deadline, color, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM goals WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
