require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const rateLimit = require('express-rate-limit');
const cron     = require('node-cron');
const { runMigrations } = require('./db/schema');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length
    ? (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin))
    : true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/accounts',      require('./routes/accounts'));
app.use('/api/transactions',  require('./routes/transactions'));
app.use('/api/budgets',       require('./routes/budgets'));
app.use('/api/goals',         require('./routes/goals'));
app.use('/api/networth',      require('./routes/networth'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/insights',      require('./routes/insights'));
app.use('/api/gocardless',    require('./routes/gocardless'));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

cron.schedule('0 3 * * *', async () => {
  try {
    const { syncAllAccounts } = require('./services/sync');
    await syncAllAccounts();
    console.log('Nightly sync complete');
  } catch (e) {
    console.error('Nightly sync failed:', e.message);
  }
});

const PORT = process.env.PORT || 3001;

async function start() {
  await runMigrations();
  app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
}

start().catch(err => { console.error('Startup failed:', err); process.exit(1); });
