const db = require('./index');

async function runMigrations() {
  await db.pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id          SERIAL PRIMARY KEY,
      gc_id       TEXT UNIQUE,
      name        TEXT NOT NULL,
      iban        TEXT,
      currency    TEXT DEFAULT 'EUR',
      balance     NUMERIC DEFAULT 0,
      last_synced TIMESTAMPTZ,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id              SERIAL PRIMARY KEY,
      gc_id           TEXT UNIQUE,
      account_id      INTEGER REFERENCES accounts(id),
      amount          NUMERIC NOT NULL,
      currency        TEXT DEFAULT 'EUR',
      date            DATE NOT NULL,
      booking_date    DATE,
      description     TEXT,
      merchant_name   TEXT,
      category        TEXT DEFAULT 'Uncategorised',
      is_recurring    BOOLEAN DEFAULT FALSE,
      is_split        BOOLEAN DEFAULT FALSE,
      parent_id       INTEGER REFERENCES transactions(id),
      notes           TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_account  ON transactions(account_id);

    CREATE TABLE IF NOT EXISTS budgets (
      id            SERIAL PRIMARY KEY,
      category      TEXT NOT NULL UNIQUE,
      monthly_limit NUMERIC NOT NULL,
      rollover      BOOLEAN DEFAULT FALSE,
      color         TEXT DEFAULT '#6366f1',
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS budget_months (
      id              SERIAL PRIMARY KEY,
      budget_id       INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
      month           TEXT NOT NULL,
      spent           NUMERIC DEFAULT 0,
      rollover_carry  NUMERIC DEFAULT 0,
      UNIQUE(budget_id, month)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id             SERIAL PRIMARY KEY,
      name           TEXT NOT NULL,
      target_amount  NUMERIC NOT NULL,
      current_amount NUMERIC DEFAULT 0,
      deadline       DATE,
      color          TEXT DEFAULT '#10b981',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS networth_entries (
      id         SERIAL PRIMARY KEY,
      type       TEXT NOT NULL CHECK(type IN ('asset','liability')),
      name       TEXT NOT NULL,
      value      NUMERIC NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS networth_snapshots (
      id         SERIAL PRIMARY KEY,
      date       DATE NOT NULL UNIQUE,
      net_worth  NUMERIC NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id            SERIAL PRIMARY KEY,
      merchant_name TEXT NOT NULL,
      amount        NUMERIC NOT NULL,
      currency      TEXT DEFAULT 'EUR',
      frequency     TEXT NOT NULL CHECK(frequency IN ('weekly','monthly','yearly')),
      next_billing  DATE,
      category      TEXT DEFAULT 'Subscriptions',
      is_manual     BOOLEAN DEFAULT FALSE,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS gocardless_tokens (
      id            INTEGER PRIMARY KEY CHECK(id=1),
      access_token  TEXT,
      refresh_token TEXT,
      access_exp    TIMESTAMPTZ,
      refresh_exp   TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS gocardless_requisitions (
      id              SERIAL PRIMARY KEY,
      requisition_id  TEXT NOT NULL,
      status          TEXT DEFAULT 'pending',
      link            TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS category_rules (
      id       SERIAL PRIMARY KEY,
      pattern  TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL
    );

    INSERT INTO category_rules (pattern, category) VALUES
      ('spotify',       'Subscriptions'),
      ('netflix',       'Subscriptions'),
      ('apple.com',     'Subscriptions'),
      ('google',        'Subscriptions'),
      ('amazon prime',  'Subscriptions'),
      ('lidl',          'Groceries'),
      ('aldi',          'Groceries'),
      ('tesco',         'Groceries'),
      ('rewe',          'Groceries'),
      ('edeka',         'Groceries'),
      ('uber eats',     'Eating Out'),
      ('deliveroo',     'Eating Out'),
      ('bolt food',     'Eating Out'),
      ('mcdonalds',     'Eating Out'),
      ('starbucks',     'Coffee'),
      ('costa',         'Coffee'),
      ('bolt',          'Transport'),
      ('uber',          'Transport'),
      ('revolut',       'Transfer'),
      ('wise',          'Transfer'),
      ('salary',        'Income'),
      ('payroll',       'Income'),
      ('rent',          'Housing'),
      ('pharmacy',      'Health'),
      ('gym',           'Health')
    ON CONFLICT (pattern) DO NOTHING;
  `);
}

module.exports = { runMigrations };
