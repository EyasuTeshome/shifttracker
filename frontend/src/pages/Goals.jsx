import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const PRESET_COLORS = ['#10b981','#6366f1','#3b82f6','#f59e0b','#ec4899','#8b5cf6'];

function fmt(n) {
  return new Intl.NumberFormat('en-IE', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n);
}

function daysLeft(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]   = useState({ name:'', target_amount:'', current_amount:'', deadline:'', color:'#10b981' });

  const load = () => api.get('/goals').then(r => setGoals(r.data));
  useEffect(() => { load(); }, []);

  async function save() {
    if (editing) {
      await api.put(`/goals/${editing.id}`, form);
    } else {
      await api.post('/goals', form);
    }
    setModal(false); setEditing(null);
    setForm({ name:'', target_amount:'', current_amount:'', deadline:'', color:'#10b981' });
    load();
  }

  async function remove(id) {
    if (!confirm('Delete goal?')) return;
    await api.delete(`/goals/${id}`);
    load();
  }

  function openEdit(g) {
    setEditing(g);
    setForm({ name: g.name, target_amount: g.target_amount, current_amount: g.current_amount, deadline: g.deadline || '', color: g.color });
    setModal(true);
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Goals</h1>
        <button onClick={() => { setEditing(null); setModal(true); }}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors">
          + New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon="◈" title="No goals yet"
          description="Create savings goals and track your progress toward them."
          action={<button onClick={() => setModal(true)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Create first goal</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(g => {
            const pct   = Math.min(100, (g.current_amount / g.target_amount) * 100);
            const days  = daysLeft(g.deadline);
            const done  = pct >= 100;
            return (
              <Card key={g.id}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white text-sm truncate">{g.name}</h3>
                  <div className="flex gap-2 text-xs text-gray-500 flex-shrink-0">
                    <button onClick={() => openEdit(g)} className="hover:text-white transition-colors">Edit</button>
                    <button onClick={() => remove(g.id)} className="hover:text-rose-400 transition-colors">×</button>
                  </div>
                </div>
                <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: g.color }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">{fmt(g.current_amount)}</span>
                  <span className="text-gray-600">{fmt(g.target_amount)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-medium" style={{ color: done ? '#10b981' : g.color }}>{Math.round(pct)}%</span>
                  {days !== null && (
                    <span className={`text-xs ${days < 30 ? 'text-amber-400' : 'text-gray-500'}`}>
                      {done ? 'Achieved!' : days < 0 ? 'Overdue' : `${days}d left`}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit goal' : 'New goal'} onClose={() => { setModal(false); setEditing(null); }}>
          <div className="space-y-4">
            {[
              { label:'Name', key:'name', type:'text', placeholder:'Emergency fund' },
              { label:'Target amount (€)', key:'target_amount', type:'number', placeholder:'5000' },
              { label:'Current amount (€)', key:'current_amount', type:'number', placeholder:'0' },
              { label:'Deadline (optional)', key:'deadline', type:'date' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
                <input type={type} value={form[key]} placeholder={placeholder}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Colour</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white/30' : ''}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <button onClick={save} disabled={!form.name || !form.target_amount}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
              {editing ? 'Save changes' : 'Create goal'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
