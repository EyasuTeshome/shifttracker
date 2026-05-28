import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

function fmt(n, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style:'currency', currency, maximumFractionDigits:2 }).format(n);
}

function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
}

export default function Subscriptions() {
  const [data, setData]   = useState({ subscriptions: [], monthly_total: 0 });
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ merchant_name:'', amount:'', frequency:'monthly', next_billing:'' });

  const load = () => api.get('/subscriptions').then(r => setData(r.data));
  useEffect(() => { load(); }, []);

  async function save() {
    await api.post('/subscriptions', form);
    setModal(false);
    setForm({ merchant_name:'', amount:'', frequency:'monthly', next_billing:'' });
    load();
  }

  async function remove(id) {
    await api.delete(`/subscriptions/${id}`);
    load();
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Subscriptions</h1>
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors">
          + Add
        </button>
      </div>

      {data.subscriptions.length > 0 && (
        <Card className="!py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Monthly total</span>
            <span className="text-lg font-semibold text-white">{fmt(data.monthly_total)}</span>
          </div>
        </Card>
      )}

      {data.subscriptions.length === 0 ? (
        <EmptyState icon="↻" title="No subscriptions detected"
          description="Import transactions or sync your account and recurring payments will appear automatically."
          action={<button onClick={() => setModal(true)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Add manually</button>}
        />
      ) : (
        <div className="space-y-2">
          {data.subscriptions.map(s => {
            const days = daysUntil(s.next_billing);
            const soon = days >= 0 && days <= 3;
            return (
              <Card key={s.id} className="!py-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{s.merchant_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{s.frequency}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm font-medium text-white">{fmt(s.amount, s.currency)}</p>
                    <p className={`text-xs mt-0.5 ${soon ? 'text-amber-400' : 'text-gray-500'}`}>
                      {days < 0 ? 'Overdue' : days === 0 ? 'Today' : `in ${days}d`} · {s.next_billing}
                    </p>
                  </div>
                  <button onClick={() => remove(s.id)} className="text-gray-600 hover:text-rose-400 transition-colors text-lg leading-none">×</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="Add subscription" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Name</label>
              <input value={form.merchant_name} onChange={e => setForm(f => ({ ...f, merchant_name: e.target.value }))}
                placeholder="Netflix, Spotify…"
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Amount (€)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Frequency</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Next billing date</label>
              <input type="date" value={form.next_billing} onChange={e => setForm(f => ({ ...f, next_billing: e.target.value }))}
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <button onClick={save} disabled={!form.merchant_name || !form.amount}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
              Add subscription
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
