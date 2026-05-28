const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const gc = require('../services/gocardless');
const { syncAccount } = require('../services/sync');
const db = require('../db/index');

// Step 1: initiate OAuth link
router.post('/connect', requireAuth, async (req, res) => {
  try {
    const requisition = await gc.createRequisition();
    db.prepare(`
      INSERT INTO gocardless_requisitions (requisition_id, link, status)
      VALUES (?, ?, 'pending')
    `).run(requisition.id, requisition.link);
    res.json({ link: requisition.link });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: GoCardless redirects here after user authorises
router.get('/callback', async (req, res) => {
  const { ref } = req.query;
  // ref is the requisition reference — look up by most recent pending
  const row = db.prepare(
    `SELECT * FROM gocardless_requisitions WHERE status='pending' ORDER BY created_at DESC LIMIT 1`
  ).get();
  if (!row) return res.status(400).send('No pending requisition found');

  try {
    const requisition = await gc.getRequisition(row.requisition_id);
    if (requisition.status !== 'LN') {
      db.prepare(`UPDATE gocardless_requisitions SET status=? WHERE id=?`).run(requisition.status, row.id);
      return res.redirect('/#/settings?gc_status=failed');
    }

    for (const accountId of requisition.accounts) {
      const { details, balances } = await gc.getAccountDetails(accountId);
      const info   = details.account || {};
      const bal    = balances?.balances?.find(b => b.balanceType === 'interimAvailable') || balances?.balances?.[0];
      const balance = bal ? parseFloat(bal.balanceAmount.amount) : 0;

      const existing = db.prepare('SELECT id FROM accounts WHERE gc_id=?').get(accountId);
      if (!existing) {
        const result = db.prepare(`
          INSERT INTO accounts (gc_id, name, iban, currency, balance)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          accountId,
          info.name || info.ownerName || 'Revolut',
          info.iban || '',
          info.currency || 'EUR',
          balance
        );
        await syncAccount({ id: result.lastInsertRowid, gc_id: accountId, currency: info.currency || 'EUR', last_synced: null, balance });
      }
    }

    db.prepare(`UPDATE gocardless_requisitions SET status='LN' WHERE id=?`).run(row.id);
    res.redirect('/#/settings?gc_status=success');
  } catch (err) {
    console.error('GoCardless callback error:', err.message);
    res.redirect('/#/settings?gc_status=error');
  }
});

// Manual sync trigger
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { syncAllAccounts } = require('../services/sync');
    const results = await syncAllAccounts();
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connection status
router.get('/status', requireAuth, (req, res) => {
  const latest = db.prepare(
    `SELECT * FROM gocardless_requisitions ORDER BY created_at DESC LIMIT 1`
  ).get();
  const accounts = db.prepare('SELECT id, name, iban, balance, last_synced FROM accounts').all();
  res.json({ requisition: latest || null, accounts });
});

module.exports = router;
