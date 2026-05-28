import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';

export default function Settings() {
  const [status, setStatus]   = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    api.get('/gocardless/status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const gcStatus = searchParams.get('gc_status');

  async function connect() {
    setConnecting(true);
    try {
      const { data } = await api.post('/gocardless/connect');
      window.location.href = data.link;
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to initiate connection');
      setConnecting(false);
    }
  }

  async function sync() {
    setSyncing(true);
    try {
      const { data } = await api.post('/gocardless/sync');
      const msgs = data.results.map(r => `${r.name}: ${r.synced ?? r.error} ${r.synced !== undefined ? 'new txns' : ''}`).join('\n');
      alert(`Sync complete:\n${msgs}`);
      api.get('/gocardless/status').then(r => setStatus(r.data));
    } catch (err) {
      alert(err.response?.data?.error || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      {gcStatus === 'success' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-3">
          Revolut connected successfully. Your transactions are being imported.
        </div>
      )}
      {gcStatus === 'failed' && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl px-4 py-3">
          GoCardless connection failed or was denied. Please try again.
        </div>
      )}

      <Card>
        <h2 className="font-medium text-white mb-1">Bank connection</h2>
        <p className="text-sm text-gray-500 mb-4">
          Connect Revolut via GoCardless (PSD2 regulated, EU). Your credentials are stored only on your server.
        </p>

        {status?.accounts?.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              {status.accounts.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.iban || 'No IBAN'} · Last synced: {a.last_synced?.slice(0,16) || 'Never'}</p>
                  </div>
                  <span className="text-sm font-medium text-emerald-400">
                    {new Intl.NumberFormat('en-IE', { style:'currency', currency:'EUR' }).format(a.balance)}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={sync} disabled={syncing}
              className="px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-white/10 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        ) : (
          <button onClick={connect} disabled={connecting}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors">
            {connecting ? 'Redirecting…' : 'Connect Revolut'}
          </button>
        )}
      </Card>

      <Card>
        <h2 className="font-medium text-white mb-1">Auto-sync</h2>
        <p className="text-sm text-gray-500">
          Transactions are automatically synced every night at 03:00 server time. You can also trigger a manual sync above.
        </p>
      </Card>

      <Card>
        <h2 className="font-medium text-white mb-1">Data & privacy</h2>
        <p className="text-sm text-gray-500 mb-3">
          All financial data is stored in a SQLite database on your server at <code className="text-gray-300 bg-surface px-1 rounded">/app/data/finance.db</code>.
          Back it up by copying that file.
        </p>
        <p className="text-xs text-gray-600">
          No data is sent to any third party except GoCardless (EU PSD2 regulated) for transaction retrieval.
        </p>
      </Card>
    </div>
  );
}
