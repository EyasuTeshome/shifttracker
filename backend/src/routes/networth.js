const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/index');

router.get('/', requireAuth, async (req, res) => {
  try {
    const [entries, snapshots] = await Promise.all([
      db.query('SELECT * FROM networth_entries ORDER BY type, name'),
      db.query('SELECT * FROM networth_snapshots ORDER BY date DESC LIMIT 24'),
    ]);
    const assets      = entries.filter(e => e.type === 'asset').reduce((s, e) => s + Number(e.value), 0);
    const liabilities = entries.filter(e => e.type === 'liability').reduce((s, e) => s + Number(e.value), 0);
    res.json({ entries, snapshots, assets, liabilities, net_worth: assets - liabilities });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/entries', requireAuth, async (req, res) => {
  try {
    const { type, name, value } = req.body;
    const [row] = await db.query(
      'INSERT INTO networth_entries (type, name, value) VALUES ($1,$2,$3) RETURNING id',
      [type, name, value]
    );
    await snapshotNetWorth();
    res.json({ id: row.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/entries/:id', requireAuth, async (req, res) => {
  try {
    const { name, value } = req.body;
    await db.query(
      'UPDATE networth_entries SET name=$1, value=$2, updated_at=NOW() WHERE id=$3',
      [name, value, req.params.id]
    );
    await snapshotNetWorth();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/entries/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM networth_entries WHERE id=$1', [req.params.id]);
    await snapshotNetWorth();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

async function snapshotNetWorth() {
  const [a] = await db.query(`SELECT COALESCE(SUM(value),0) AS v FROM networth_entries WHERE type='asset'`);
  const [l] = await db.query(`SELECT COALESCE(SUM(value),0) AS v FROM networth_entries WHERE type='liability'`);
  const net = Number(a.v) - Number(l.v);
  const today = new Date().toISOString().slice(0, 10);
  await db.query(
    'INSERT INTO networth_snapshots (date, net_worth) VALUES ($1,$2) ON CONFLICT (date) DO UPDATE SET net_worth=$2',
    [today, net]
  );
}

module.exports = router;
