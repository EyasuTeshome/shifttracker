# Personal Finance App

A self-hosted, privacy-first alternative to Monarch Money / YNAB. All data stays on your server. No third-party services except GoCardless (EU PSD2 regulated) for Revolut transaction sync.

---

## Stack

| Layer    | Tech                                   |
|----------|----------------------------------------|
| Backend  | Node.js 20 + Express                   |
| Database | SQLite (single file, easy backup)      |
| Frontend | React 18 + Tailwind CSS + Recharts     |
| Auth     | Single-user bcrypt password + JWT      |
| Bank     | GoCardless Open Banking API (Nordigen) |
| Hosting  | Docker + docker-compose + Nginx        |

---

## Quick start (VPS)

### 1. Clone

```bash
git clone <your-repo-url> finance
cd finance
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

**Generate a JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Hash your login password:**
```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('yourpassword', 12))"
```

**GoCardless credentials:**
1. Register free at https://bankaccountdata.gocardless.com/
2. Create a new application — copy Secret ID and Secret Key into `.env`
3. Find your Revolut institution ID:
   ```bash
   curl -H "Authorization: Bearer <access_token>" \
     "https://bankaccountdata.gocardless.com/api/v2/institutions/?country=ie"
   ```
   Common IDs: `REVOLUT_REVOGB21` (UK/IE), `REVOLUT_REVOLT21` (other EU)

Set `GOCARDLESS_REDIRECT_URL` to: `https://yourdomain.com/api/gocardless/callback`

### 3. TLS certificates

Place your certificates in `./nginx/certs/`:
```
nginx/certs/fullchain.pem
nginx/certs/privkey.pem
```

**Using Let's Encrypt:**
```bash
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem   nginx/certs/
```

### 4. Deploy

```bash
docker compose up -d --build
```

The app is now running at `https://yourdomain.com`.

---

## Connecting Revolut

1. Log in and go to **Settings**
2. Click **Connect Revolut** — you'll be redirected to GoCardless
3. Authorise access to your Revolut account
4. You'll be redirected back; transactions start importing immediately
5. Automatic nightly sync runs at 03:00 server time

---

## Features

| Feature              | Description |
|----------------------|-------------|
| Dashboard            | Balance, income/spending, budget rings, upcoming payments |
| Transactions         | Full history, search, filter, re-categorise, CSV import |
| Budgets              | Monthly limits, optional rollover, progress rings, alerts at 80%/100% |
| Charts & Insights    | Monthly bar chart, category donut, 6-month trend |
| Subscriptions        | Auto-detected from transactions + manual, monthly total, upcoming alerts |
| Goals                | Target + deadline + progress bar |
| Net Worth            | Assets/liabilities, historical trend chart |
| GoCardless sync      | OAuth flow + nightly auto-sync at 03:00 |
| CSV import           | Revolut CSV format |
| Auto-categorisation  | Rule-based merchant name matching |

---

## Backup

The entire database is a single file: `./data/finance.db`

```bash
cp ./data/finance.db ./backups/finance-$(date +%Y%m%d).db
```

---

## Updating

```bash
git pull
docker compose up -d --build
```

---

## Project structure

```
.
├── backend/
│   ├── src/
│   │   ├── server.js          # Express app + cron scheduler
│   │   ├── db/                # SQLite connection + schema migrations
│   │   ├── middleware/auth.js  # JWT auth middleware
│   │   ├── routes/            # auth, transactions, budgets, goals, networth,
│   │   │                      # subscriptions, insights, gocardless
│   │   └── services/          # gocardless, sync, categorise, subscriptions
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Router + auth guard
│   │   ├── components/        # Card, Modal, Sidebar, ProgressRing, EmptyState
│   │   ├── pages/             # Dashboard, Transactions, Budgets, Charts,
│   │   │                      # Subscriptions, Goals, NetWorth, Settings, Login
│   │   ├── hooks/useAuth.jsx  # Auth context + JWT storage
│   │   └── services/api.js    # Axios client with auth interceptor
│   └── Dockerfile
├── nginx/
│   └── default.conf           # Reverse proxy + TLS termination
├── data/                      # SQLite DB (gitignored, persisted via volume)
├── docker-compose.yml
├── .env.example
└── README.md
```
