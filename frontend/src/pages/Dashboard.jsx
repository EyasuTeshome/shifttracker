import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import ProgressRing from '../components/ProgressRing';

const CATEGORY_COLORS = {
  Groceries:'#10b981', Transport:'#3b82f6', 'Eating Out':'#f59e0b',
  Subscriptions:'#8b5cf6', Coffee:'#a16207', Health:'#ec4899',
  Housing:'#14b8a6', Income:'#22c55e', Transfer:'#64748b', Uncategorised:'#6b7280',
};

function fmt(n, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style:'currency', currency, maximumFractionDigits:0 }).format(n);
}

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <Card>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    api.get('/insights/dashboard').then(r => setData(r.data));
    api.get('/budgets').then(r => setBudgets(r.data.slice(0, 4)));
  }, []);

  if (!data) return <div className="text-gray-500 text-sm">Loading…</div>;

  const delta = data.prevSpending > 0
    ? ((data.spending - data.prevSpending) / data.prevSpending * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <span className="text-sm text-gray-500">{data.month}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Balance" value={fmt(data.balance)} />
        <StatCard label="Income this month" value={fmt(data.income)} color="text-emerald-400" />
        <StatCard
          label="Spent this month" value={fmt(data.spending)} color="text-rose-400"
          sub={delta !== null ? `${delta > 0 ? '+' : ''}${delta}% vs last month` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spending by category */}
        <Card>
          <h2 className="text-sm font-medium text-white mb-4">Spending by category</h2>
          {data.byCategory.length === 0
            ? <p className="text-gray-600 text-sm">No spending data yet.</p>
            : <div className="space-y-2">
                {data.byCategory.map(c => {
                  const pct = data.spending > 0 ? (c.total / data.spending) * 100 : 0;
                  const color = CATEGORY_COLORS[c.category] || '#6366f1';
                  return (
                    <div key={c.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{c.category}</span>
                        <span className="text-gray-400">{fmt(c.total)}</span>
                      </div>
                      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </Card>

        {/* Budget rings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Budgets</h2>
            <Link to="/budgets" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          {budgets.length === 0
            ? <p className="text-gray-600 text-sm">No budgets set up yet. <Link to="/budgets" className="text-accent">Create one</Link>.</p>
            : <div className="grid grid-cols-2 gap-4">
                {budgets.map(b => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className="relative">
                      <ProgressRing pct={b.pct} color={b.color} size={56} stroke={5} />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white rotate-90">
                        {Math.round(b.pct)}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white truncate max-w-[90px]">{b.category}</p>
                      <p className="text-[10px] text-gray-500">{fmt(b.spent)} / {fmt(b.effective_limit)}</p>
                    </div>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming payments */}
        <Card>
          <h2 className="text-sm font-medium text-white mb-4">Upcoming (next 7 days)</h2>
          {data.upcoming.length === 0
            ? <p className="text-gray-600 text-sm">No upcoming payments.</p>
            : <ul className="space-y-2">
                {data.upcoming.map(s => (
                  <li key={s.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-white">{s.merchant_name}</p>
                      <p className="text-xs text-gray-500">{s.next_billing}</p>
                    </div>
                    <span className="text-sm font-medium text-rose-400">{fmt(s.amount, s.currency)}</span>
                  </li>
                ))}
              </ul>
          }
        </Card>

        {/* Recent transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Recent transactions</h2>
            <Link to="/transactions" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          {data.recentTxns.length === 0
            ? <p className="text-gray-600 text-sm">No transactions yet.</p>
            : <ul className="space-y-2">
                {data.recentTxns.map(t => (
                  <li key={t.id} className="flex justify-between items-center">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="text-sm text-white truncate">{t.merchant_name || t.description || '—'}</p>
                      <p className="text-xs text-gray-500">{t.date} · {t.category}</p>
                    </div>
                    <span className={`text-sm font-medium whitespace-nowrap ${t.amount >= 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                      {t.amount >= 0 ? '+' : ''}{fmt(t.amount, t.currency)}
                    </span>
                  </li>
                ))}
              </ul>
          }
        </Card>
      </div>
    </div>
  );
}
