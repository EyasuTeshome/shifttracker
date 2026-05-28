const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { parse } = require('csv-parse/sync');
const { categorise } = require('../services/categorise');
const db = require('../db/index');

router.get('/', requireAuth, (req, res) => {
  const { search, category, account_id, from, to, limit = 100, offset = 0 } = req.query;
  let sql = `SELECT * FROM transactions WHERE 1=1`;
  const params = [];

  if (search)     { sql += ` AND (description LIKE ? OR merchant_name LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (category)   { sql += ` AND category=?`;    params.push(category); }
  if (account_id) { sql += ` AND account_id=?`;  params.push(account_id); }
  if (from)       { sql += ` AND date>=?`;        params.push(from); }
  if (to)         { sql += ` AND date<=?`;        params.push(to); }

  sql += ` AND is_split=0 ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const rows = db.prepare(sql).all(...params);

  const countSql = sql.replace(/SELECT \*/, 'SELECT COUNT(*) as total').replace(/ORDER BY.+/, '');
  const { total } = db.prepare(countSql).get(...params.slice(0, -2)) || { total: 0 };

  res.json({ transactions: rows, total });
});

router.patch('/:id/category', requireAuth, (req, res) => {
  const { category } = req.body;
  db.prepare('UPDATE transactions SET category=? WHERE id=?').run(category, req.params.id);
  res.json({ ok: true });
});

router.patch('/:id/notes', requireAuth, (req, res) => {
  const { notes } = req.body;
  db.prepare('UPDATE transactions SET notes=? WHERE id=?').run(notes, req.params.id);
  res.json({ ok: true });
});

// Split a transaction into multiple parts
router.post('/:id/split', requireAuth, (req, res) => {
  const { splits } = req.body; // [{ amount, category, description }]
  const parent = db.prepare('SELECT * FROM transactions WHERE id=?').get(req.params.id);
  if (!parent) return res.status(404).json({ error: 'Not found' });

  const total = splits.reduce((s, x) => s + x.amount, 0);
  if (Math.abs(total - Math.abs(parent.amount)) > 0.01) {
    return res.status(400).json({ error: 'Split amounts must sum to original transaction amount' });
  }

  const insert = db.prepare(`
    INSERT INTO transactions (account_id, amount, currency, date, description, merchant_name, category, is_split, parent_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  db.transaction(() => {
    db.prepare('UPDATE transactions SET is_split=1 WHERE id=?').run(parent.id);
    for (const s of splits) {
      insert.run(parent.account_id, -Math.abs(s.amount), parent.currency, parent.date,
        s.description || parent.description, parent.merchant_name, s.category, parent.id);
    }
  })();

  res.json({ ok: true });
});

// CSV import (Revolut format)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/import', requireAuth, upload.single('file'), (req, res) => {
  try {
    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true });
    const accountId = req.body.account_id ? Number(req.body.account_id) : null;

    const insert = db.prepare(`
      INSERT OR IGNORE INTO transactions (account_id, amount, currency, date, description, merchant_name, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    db.transaction(() => {
      for (const r of records) {
        const amount      = parseFloat(r.Amount || r.amount || '0');
        const currency    = r.Currency || r.currency || 'EUR';
        const date        = r['Completed Date'] || r.Date || r.date || '';
        const description = r.Description || r.description || r.Reference || '';
        const merchant    = r['Merchant name'] || r.Merchant || '';
        if (!date) continue;
        insert.run(accountId, amount, currency, date.slice(0, 10), description, merchant,
          categorise(description, merchant));
        imported++;
      }
    })();

    res.json({ imported });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
