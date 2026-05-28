const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const gc = require('../services/gocardless');
const { syncAccount } = require('../services/sync');
const db = require('../db/index');

const FRONTEND = () => process.env.FRONTEND_URL || '';

router.post('/connect', requireAuth, async (req, res) => {
  try {
    const requisition = await gc.createRequisition();
    await db.query(
      'INSERT INTO gocardless_requisitions (requisition_id, link, status) VALUES ($1,$2,$3)',
      [requisition.id, requisition.link, 'pending']
    );
    res.json({ link: requisition.link });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/callback', async (req, res) => {
  const row = await db.one(
    `SELECT * FROM gocardless_requisitions WHERE status='pending' ORDER BY created_at DESC LIMIT 1`
  );
  if (!row) return res.status(400).send('No pending requisition');

  try {
    const requisition = await gc.getRequisition(row.requisition_id);
    if (requisition.status !== 'LN') {
      await db.query('UPDATE gocardless_requisitions SET status=$1 WHERE id=$2', [requisition.status, row.id]);
      return res.redirect(`${FRONTEND()}/#/settings?gc_status=failed`);
    }

    for (const accountId of requisition.accounts) {
      const { details, balances } = await gc.getAccountDetails(accountId);
      const info    = details.account || {};
      const bal     = balances?.balances?.find(b => b.balanceType === 'interimAvailable') || balances?.balances?.[0];
      const balance = bal ? parseFloat(bal.balanceAmount.amount) : 0;

      const existing = await db.one('SELECT id FROM accounts WHERE gc_id=$1', [accountId]);
      if (!existing) {
        const [{ id }] = await db.query(
          'INSERT INTO accounts (gc_id, name, iban, currency, balance) VALUES ($1,$2,$3,$4,$5) RETURNING id',
          [accountId, info.name || info.ownerName || 'Revolut', info.iban || '', info.currency || 'EUR', balance]
        );
        await syncAccount({ id, gc_id: accountId, currency: info.currency || 'EUR', last_synced: null, balance });
      }
    }

    await db.query(`UPDATE gocardless_requisitions SET status='LN' WHERE id=$1`, [row.id]);
    res.redirect(`${FRONTEND()}/#/settings?gc_status=success`);
  } catch (err) {
    console.error('GoCardless callback error:', err.message);
    res.redirect(`${FRONTEND()}/#/settings?gc_status=error`);
  }
});

router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { syncAllAccounts } = require('../services/sync');
    const results = await syncAllAccounts();
    res.json({ results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const [latest, accounts] = await Promise.all([
      db.one('SELECT * FROM gocardless_requisitions ORDER BY created_at DESC LIMIT 1'),
      db.query('SELECT id, name, iban, balance, last_synced FROM accounts'),
    ]);
    res.json({ requisition: latest, accounts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
