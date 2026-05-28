import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ProgressRing from '../components/ProgressRing';

const PRESET_COLORS = ['#6366f1','#10b981','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316'];
const CATEGORIES = [
  'Groceries','Transport','Eating Out','Subscriptions','Coffee','Health',
  'Housing','Entertainment','Shopping','Uncategorised',
];

function fmt(n) {
  return new Intl.NumberFormat('en-IE', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n);
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState({ category:'Groceries', monthly_limit:'', rollover:false, color:'#6366f1' });
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/budgets').then(r => setBudgets(r.data));
  useEffect(() => { load(); }, []);

  async function save() {
    if (editing) {
      await api.put(`/budgets/${editing.id}`, form);
    } else {
      await api.post('/budgets', form);
    }
    setModal(false);
    setEditing(null);
    setForm({ category:'Groceries', monthly_limit:'', rollover:false, color:'#6366f1' });
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this budget?')) return;
    await api.delete(`/budgets/${id}`);
    load();
  }

  function openEdit(b) {
    setEditing(b);
    setForm({ category: b.category, monthly_limit: b.monthly_limit, rollover: !!b.rollover, color: b.color });
    setModal(true);
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Budgets</h1>
        <button onClick={() => { setEditing(null); setModal(true); }}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors">
          + New budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState icon="◎" title="No budgets yet"
          description="Set monthly limits per category to stay on track."
          action={<button onClick={() => setModal(true)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Create your first budget</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => {
            const over = b.pct >= 100;
            const warn = b.pct >= 80 && !over;
            return (
              <Card key={b.id}>
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <ProgressRing pct={b.pct} color={b.color} size={72} stroke={6} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white rotate-90">
                      {Math.round(b.pct)}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white text-sm">{b.category}</h3>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <button onClick={() => openEdit(b)} className="hover:text-white transition-colors">Edit</button>
                        <button onClick={() => remove(b.id)} className="hover:text-rose-400 transition-colors">×</button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(b.spent)} <span className="text-gray-600">of</span> {fmt(b.effective_limit)}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{fmt(b.effective_limit - b.spent)} remaining</p>
                    {over && <p className="text-xs text-red-400 mt-1">Over budget by {fmt(b.spent - b.effective_limit)}</p>}
                    {warn && <p className="text-xs text-amber-400 mt-1">Approaching limit</p>}
                    {b.rollover && b.carry > 0 && <p className="text-xs text-indigo-400 mt-1">+{fmt(b.carry)} rollover</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit budget' : 'New budget'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Monthly limit (€)</label>
              <input type="number" value={form.monthly_limit} onChange={e => setForm(f => ({ ...f, monthly_limit: e.target.value }))}
                placeholder="300"
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Colour</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white/30' : ''}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.rollover} onChange={e => setForm(f => ({ ...f, rollover: e.target.checked }))}
                className="accent-indigo-500" />
              <span className="text-sm text-gray-300">Rollover unspent budget</span>
            </label>
            <button onClick={save} disabled={!form.monthly_limit}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
              {editing ? 'Save changes' : 'Create budget'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
