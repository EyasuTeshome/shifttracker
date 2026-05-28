import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const CATEGORIES = [
  'Groceries','Transport','Eating Out','Subscriptions','Coffee','Health',
  'Housing','Income','Transfer','Entertainment','Shopping','Uncategorised',
];

const COLORS = {
  Groceries:'#10b981',Transport:'#3b82f6','Eating Out':'#f59e0b',
  Subscriptions:'#8b5cf6',Coffee:'#a16207',Health:'#ec4899',
  Housing:'#14b8a6',Income:'#22c55e',Transfer:'#64748b',
  Entertainment:'#f97316',Shopping:'#06b6d4',Uncategorised:'#6b7280',
};

function fmt(n, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style:'currency', currency, maximumFractionDigits:2 }).format(n);
}

export default function Transactions() {
  const [txns, setTxns]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [category, setCat]    = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [offset, setOffset]   = useState(0);
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();
  const LIMIT = 50;

  const load = useCallback(async (off = 0) => {
    setLoading(true);
    const params = { limit: LIMIT, offset: off };
    if (search)   params.search   = search;
    if (category) params.category = category;
    if (from)     params.from     = from;
    if (to)       params.to       = to;
    const { data } = await api.get('/transactions', { params });
    setTxns(data.transactions);
    setTotal(data.total);
    setOffset(off);
    setLoading(false);
  }, [search, category, from, to]);

  useEffect(() => { load(0); }, [load]);

  async function saveCategory(id, cat) {
    await api.patch(`/transactions/${id}/category`, { category: cat });
    setTxns(prev => prev.map(t => t.id === id ? { ...t, category: cat } : t));
    setEditing(null);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/transactions/import', form);
      alert(`Imported ${data.imported} transactions`);
      load(0);
    } catch (err) {
      alert(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
      fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-white">Transactions</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button
            onClick={() => fileRef.current.click()}
            disabled={importing}
            className="px-3 py-1.5 text-sm bg-surface-2 hover:bg-surface-3 border border-white/10 rounded-lg text-gray-300 transition-colors"
          >
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="!p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input
            placeholder="Search…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="col-span-2 sm:col-span-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent/50"
          />
          <select value={category} onChange={e => setCat(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
        </div>
      </Card>

      {/* Transaction list */}
      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
        ) : txns.length === 0 ? (
          <EmptyState icon="↔" title="No transactions" description="Import a CSV or connect via GoCardless in Settings." />
        ) : (
          <>
            <ul className="divide-y divide-white/5">
              {txns.map(t => {
                const color = COLORS[t.category] || '#6b7280';
                return (
                  <li key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{t.merchant_name || t.description || '—'}</p>
                      <p className="text-xs text-gray-500">{t.date}</p>
                    </div>
                    <button
                      onClick={() => setEditing(t)}
                      className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                      style={{ borderColor: color + '40', color }}
                    >
                      {t.category}
                    </button>
                    <span className={`text-sm font-medium w-20 text-right ${t.amount >= 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                      {t.amount >= 0 ? '+' : ''}{fmt(t.amount, t.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 text-sm text-gray-500">
              <span>{total} transactions</span>
              <div className="flex gap-2">
                <button disabled={offset === 0} onClick={() => load(offset - LIMIT)}
                  className="px-3 py-1 rounded bg-surface-2 disabled:opacity-30 hover:bg-surface-3 transition-colors">← Prev</button>
                <button disabled={offset + LIMIT >= total} onClick={() => load(offset + LIMIT)}
                  className="px-3 py-1 rounded bg-surface-2 disabled:opacity-30 hover:bg-surface-3 transition-colors">Next →</button>
              </div>
            </div>
          </>
        )}
      </Card>

      {editing && (
        <Modal title="Change category" onClose={() => setEditing(null)}>
          <p className="text-sm text-gray-400 mb-4">{editing.merchant_name || editing.description}</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => saveCategory(editing.id, c)}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                  editing.category === c
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
