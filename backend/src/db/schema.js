const db = require('./index');

function runMigrations() {
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      gc_id       TEXT UNIQUE,
      name        TEXT NOT NULL,
      iban        TEXT,
      currency    TEXT DEFAULT 'EUR',
      balance     REAL DEFAULT 0,
      last_synced TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      gc_id           TEXT UNIQUE,
      account_id      INTEGER REFERENCES accounts(id),
      amount          REAL NOT NULL,
      currency        TEXT DEFAULT 'EUR',
      date            TEXT NOT NULL,
      booking_date    TEXT,
      description     TEXT,
      merchant_name   TEXT,
      category        TEXT DEFAULT 'Uncategorised',
      is_recurring    INTEGER DEFAULT 0,
      is_split        INTEGER DEFAULT 0,
      parent_id       INTEGER REFERENCES transactions(id),
      notes           TEXT,
      created_at      TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_account  ON transactions(account_id);

    CREATE TABLE IF NOT EXISTS budgets (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      category      TEXT NOT NULL UNIQUE,
      monthly_limit REAL NOT NULL,
      rollover      INTEGER DEFAULT 0,
      color         TEXT DEFAULT '#6366f1',
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budget_months (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_id       INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
      month           TEXT NOT NULL,
      spent           REAL DEFAULT 0,
      rollover_carry  REAL DEFAULT 0,
      UNIQUE(budget_id, month)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT NOT NULL,
      target_amount  REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline       TEXT,
      color          TEXT DEFAULT '#10b981',
      created_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS networth_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      type       TEXT NOT NULL CHECK(type IN ('asset','liability')),
      name       TEXT NOT NULL,
      value      REAL NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS networth_snapshots (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL,
      net_worth  REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_name TEXT NOT NULL,
      amount        REAL NOT NULL,
      currency      TEXT DEFAULT 'EUR',
      frequency     TEXT NOT NULL CHECK(frequency IN ('weekly','monthly','yearly')),
      next_billing  TEXT,
      category      TEXT DEFAULT 'Subscriptions',
      is_manual     INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gocardless_tokens (
      id            INTEGER PRIMARY KEY CHECK(id=1),
      access_token  TEXT,
      refresh_token TEXT,
      access_exp    TEXT,
      refresh_exp   TEXT
    );

    CREATE TABLE IF NOT EXISTS gocardless_requisitions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      requisition_id  TEXT NOT NULL,
      status          TEXT DEFAULT 'pending',
      link            TEXT,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS category_rules (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern  TEXT NOT NULL,
      category TEXT NOT NULL
    );

    INSERT OR IGNORE INTO category_rules (pattern, category) VALUES
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
      ('gym',           'Health');
  `);
}

module.exports = { runMigrations };
