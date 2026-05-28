import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../services/api';
import Card from '../components/Card';

const COLORS = ['#6366f1','#10b981','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316','#06b6d4','#64748b'];

function fmt(n) { return `€${Math.round(n).toLocaleString()}`; }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function Charts() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/insights/charts').then(r => setData(r.data));
  }, []);

  if (!data) return <div className="text-gray-500 text-sm">Loading…</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <h1 className="text-xl font-semibold text-white">Insights</h1>

      {/* Monthly bar chart */}
      <Card>
        <h2 className="text-sm font-medium text-white mb-4">Income vs spending — last 6 months</h2>
        {data.monthly.every(m => m.income === 0 && m.spending === 0) ? (
          <p className="text-gray-600 text-sm py-8 text-center">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthly} barGap={4}>
              <XAxis dataKey="month" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="income"   name="Income"   fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="spending" name="Spending" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut — spending by category */}
        <Card>
          <h2 className="text-sm font-medium text-white mb-4">Spending by category (this month)</h2>
          {data.byCategory.length === 0 ? (
            <p className="text-gray-600 text-sm py-8 text-center">No spending this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.byCategory} cx="50%" cy="50%"
                  innerRadius={70} outerRadius={100}
                  dataKey="total" nameKey="category"
                  paddingAngle={2}
                >
                  {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'#1e2536', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8 }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={v => <span style={{ color:'#9ca3af', fontSize:12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Category breakdown table */}
        <Card>
          <h2 className="text-sm font-medium text-white mb-4">Category breakdown</h2>
          {data.byCategory.length === 0 ? (
            <p className="text-gray-600 text-sm py-8 text-center">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.byCategory.map((c, i) => {
                const max = data.byCategory[0].total;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{c.category}</span>
                      <span className="text-gray-400">{fmt(c.total)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(c.total/max)*100}%`, background: COLORS[i % COLORS.length], transition:'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
