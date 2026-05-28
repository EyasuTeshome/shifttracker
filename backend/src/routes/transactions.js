const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { parse } = require('csv-parse/sync');
const { categorise } = require('../services/categorise');
const db = require('../db/index');

router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, category, account_id, from, to, limit = 50, offset = 0 } = req.query;
    const conditions = ['is_split = false'];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(description ILIKE $${idx} OR merchant_name ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (category)   { conditions.push(`category = $${idx++}`);    params.push(category); }
    if (account_id) { conditions.push(`account_id = $${idx++}`);  params.push(account_id); }
    if (from)       { conditions.push(`date >= $${idx++}`);        params.push(from); }
    if (to)         { conditions.push(`date <= $${idx++}`);        params.push(to); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM transactions ${where}`, params);

    const rows = await db.query(
      `SELECT * FROM transactions ${where} ORDER BY date DESC, id DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...params, Number(limit), Number(offset)]
    );

    res.json({ transactions: rows, total: parseInt(countRow.total) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/category', requireAuth, async (req, res) => {
  try {
    await db.query('UPDATE transactions SET category=$1 WHERE id=$2', [req.body.category, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/notes', requireAuth, async (req, res) => {
  try {
    await db.query('UPDATE transactions SET notes=$1 WHERE id=$2', [req.body.notes, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/split', requireAuth, async (req, res) => {
  try {
    const { splits } = req.body;
    const parent = await db.one('SELECT * FROM transactions WHERE id=$1', [req.params.id]);
    if (!parent) return res.status(404).json({ error: 'Not found' });

    const total = splits.reduce((s, x) => s + x.amount, 0);
    if (Math.abs(total - Math.abs(Number(parent.amount))) > 0.01) {
      return res.status(400).json({ error: 'Split amounts must sum to original transaction amount' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE transactions SET is_split=true WHERE id=$1', [parent.id]);
      for (const s of splits) {
        await client.query(`
          INSERT INTO transactions (account_id, amount, currency, date, description, merchant_name, category, is_split, parent_id)
          VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)
        `, [parent.account_id, -Math.abs(s.amount), parent.currency, parent.date,
            s.description || parent.description, parent.merchant_name, s.category, parent.id]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK'); throw e;
    } finally { client.release(); }

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/import', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const records   = parse(req.file.buffer, { columns: true, skip_empty_lines: true });
    const accountId = req.body.account_id ? Number(req.body.account_id) : null;
    let imported = 0;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      for (const r of records) {
        const amount      = parseFloat(r.Amount || r.amount || '0');
        const currency    = r.Currency || r.currency || 'EUR';
        const date        = (r['Completed Date'] || r.Date || r.date || '').slice(0, 10);
        const description = r.Description || r.description || r.Reference || '';
        const merchant    = r['Merchant name'] || r.Merchant || '';
        if (!date) continue;
        const category = await categorise(description, merchant);
        const { rowCount } = await client.query(`
          INSERT INTO transactions (account_id, amount, currency, date, description, merchant_name, category)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [accountId, amount, currency, date, description, merchant, category]);
        imported += rowCount;
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK'); throw e;
    } finally { client.release(); }

    res.json({ imported });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
