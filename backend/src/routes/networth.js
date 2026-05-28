const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

router.get('/', requireAuth, (req, res) => {
  const entries = db.prepare('SELECT * FROM networth_entries ORDER BY type, name').all();
  const snapshots = db.prepare(
    'SELECT * FROM networth_snapshots ORDER BY date DESC LIMIT 24'
  ).all();
  const assets      = entries.filter(e => e.type === 'asset').reduce((s, e) => s + e.value, 0);
  const liabilities = entries.filter(e => e.type === 'liability').reduce((s, e) => s + e.value, 0);
  const net_worth   = assets - liabilities;
  res.json({ entries, snapshots, assets, liabilities, net_worth });
});

router.post('/entries', requireAuth, (req, res) => {
  const { type, name, value } = req.body;
  const result = db.prepare(`
    INSERT INTO networth_entries (type, name, value) VALUES (?, ?, ?)
  `).run(type, name, value);

  snapshotNetWorth();
  res.json({ id: result.lastInsertRowid });
});

router.put('/entries/:id', requireAuth, (req, res) => {
  const { name, value } = req.body;
  db.prepare('UPDATE networth_entries SET name=?, value=?, updated_at=datetime("now") WHERE id=?')
    .run(name, value, req.params.id);
  snapshotNetWorth();
  res.json({ ok: true });
});

router.delete('/entries/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM networth_entries WHERE id=?').run(req.params.id);
  snapshotNetWorth();
  res.json({ ok: true });
});

function snapshotNetWorth() {
  const { assets } = db.prepare(`
    SELECT COALESCE(SUM(value),0) as assets FROM networth_entries WHERE type='asset'
  `).get();
  const { liabilities } = db.prepare(`
    SELECT COALESCE(SUM(value),0) as liabilities FROM networth_entries WHERE type='liability'
  `).get();
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO networth_snapshots (date, net_worth) VALUES (?, ?)
    ON CONFLICT DO NOTHING
  `).run(today, assets - liabilities);
}

module.exports = router;
