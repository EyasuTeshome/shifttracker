import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import Card from '../components/Card';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

function fmt(n) {
  return new Intl.NumberFormat('en-IE', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n);
}

export default function NetWorth() {
  const [data, setData]   = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]   = useState({ type:'asset', name:'', value:'' });

  const load = () => api.get('/networth').then(r => setData(r.data));
  useEffect(() => { load(); }, []);

  async function save() {
    if (editing) {
      await api.put(`/networth/entries/${editing.id}`, { name: form.name, value: Number(form.value) });
    } else {
      await api.post('/networth/entries', { type: form.type, name: form.name, value: Number(form.value) });
    }
    setModal(false); setEditing(null);
    setForm({ type:'asset', name:'', value:'' });
    load();
  }

  async function remove(id) {
    await api.delete(`/networth/entries/${id}`);
    load();
  }

  function openEdit(e) {
    setEditing(e);
    setForm({ type: e.type, name: e.name, value: e.value });
    setModal(true);
  }

  if (!data) return <div className="text-gray-500 text-sm">Loading…</div>;

  const assets      = data.entries.filter(e => e.type === 'asset');
  const liabilities = data.entries.filter(e => e.type === 'liability');

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Net Worth</h1>
        <button onClick={() => { setEditing(null); setModal(true); }}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors">
          + Add entry
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Net Worth</p>
          <p className={`text-2xl font-semibold ${data.net_worth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(data.net_worth)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Assets</p>
          <p className="text-2xl font-semibold text-white">{fmt(data.assets)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Liabilities</p>
          <p className="text-2xl font-semibold text-white">{fmt(data.liabilities)}</p>
        </Card>
      </div>

      {data.snapshots.length > 1 && (
        <Card>
          <h2 className="text-sm font-medium text-white mb-4">Net worth over time</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={[...data.snapshots].reverse()}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'#1e2536', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8 }} />
              <Area type="monotone" dataKey="net_worth" stroke="#6366f1" fill="url(#nwGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {data.entries.length === 0 ? (
        <EmptyState icon="◇" title="No entries yet"
          description="Add assets (property, savings, investments) and liabilities (loans, credit cards) to track your net worth."
          action={<button onClick={() => setModal(true)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Add first entry</button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[['asset','Assets','text-emerald-400'], ['liability','Liabilities','text-rose-400']].map(([type, label, color]) => (
            <Card key={type}>
              <h2 className={`text-sm font-medium mb-3 ${color}`}>{label}</h2>
              {(type === 'asset' ? assets : liabilities).length === 0 ? (
                <p className="text-gray-600 text-sm">None added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(type === 'asset' ? assets : liabilities).map(e => (
                    <li key={e.id} className="flex items-center justify-between">
                      <span className="text-sm text-white">{e.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-300">{fmt(e.value)}</span>
                        <button onClick={() => openEdit(e)} className="text-xs text-gray-500 hover:text-white">Edit</button>
                        <button onClick={() => remove(e.id)} className="text-gray-600 hover:text-rose-400 text-lg leading-none">×</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit entry' : 'Add entry'} onClose={() => { setModal(false); setEditing(null); }}>
          <div className="space-y-4">
            {!editing && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Type</label>
                <div className="flex gap-2">
                  {['asset','liability'].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${form.type === t ? 'bg-accent text-white' : 'bg-surface border border-white/10 text-gray-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={form.type === 'asset' ? 'Savings account' : 'Car loan'}
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Value (€)</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <button onClick={save} disabled={!form.name || !form.value}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
              {editing ? 'Save changes' : 'Add entry'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
