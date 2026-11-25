import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import {
  getDashboardStats,
  isDatabaseEmpty,
  listAlerts,
  listAssets,
  listSegments,
  listTrains,
  seedDemoData,
  wipeAllData,
  type AlertRow,
  type AssetRow,
  type DashboardStats,
  type SegmentRow,
  type TrainRow,
} from '@/services/railService';
import { DashboardTab } from './tabs/DashboardTab';
import { MapTab } from './tabs/MapTab';
import { AlertsTab } from './tabs/AlertsTab';
import { AssetsTab } from './tabs/AssetsTab';

type Tab = 'dashboard' | 'map' | 'alerts' | 'assets';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'map', label: 'Mapa ryzyka', icon: '🗺️' },
  { key: 'alerts', label: 'Alerty', icon: '🔔' },
  { key: 'assets', label: 'Assety', icon: '⚙️' },
];

export function HomePage() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');

  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [trains, setTrains] = useState<TrainRow[]>([]);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const e = await isDatabaseEmpty();
      setEmpty(e);
      if (e) {
        setStats(null);
        setSegments([]); setAssets([]); setAlerts([]); setTrains([]);
        return;
      }
      const [s, seg, ass, alr, trn] = await Promise.all([
        getDashboardStats(),
        listSegments(),
        listAssets(),
        listAlerts(),
        listTrains(),
      ]);
      setStats(s); setSegments(seg); setAssets(ass); setAlerts(alr); setTrains(trn);
    } catch (err) {
      setNotice({ kind: 'err', text: 'Błąd ładowania: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleSeed = async () => {
    if (!user) return;
    setBusy(true);
    setNotice(null);
    try {
      const r = await seedDemoData(user);
      setNotice({
        kind: 'ok',
        text: `Wygenerowano: ${r.segments} odcinków, ${r.assets} assetów, ${r.readings} odczytów, ${r.alerts} alertów, ${r.trains} pociągów.`,
      });
      await refresh();
    } catch (err) {
      setNotice({ kind: 'err', text: 'Błąd: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setBusy(false);
    }
  };

  const handleWipe = async () => {
    setConfirmWipe(false);
    setBusy(true);
    try {
      await wipeAllData();
      await refresh();
      setNotice({ kind: 'ok', text: 'Baza wyczyszczona.' });
    } catch (err) {
      setNotice({ kind: 'err', text: 'Błąd: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white">🚄</div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Rail PdM</h1>
              <p className="text-xs text-slate-500 leading-tight">Predykcyjne utrzymanie ruchu • Kaliniec–Morawin (linia demonstracyjna L1)</p>
            </div>
          </div>
          <div className="flex-1" />
          {!empty && (
            <button
              onClick={() => setConfirmWipe(true)}
              disabled={busy}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              🗑 Wyczyść
            </button>
          )}
          <button
            onClick={() => void handleSeed()}
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Pracuję...' : empty ? '🌱 Wygeneruj dane demo' : '➕ Dodaj więcej'}
          </button>
          <div className="text-right">
            <div className="text-xs text-slate-500">Zalogowany jako</div>
            <div className="text-sm font-medium text-slate-900">{user?.name}</div>
          </div>
          <button
            onClick={() => void signOut()}
            className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            Wyloguj
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span className="mr-1">{t.icon}</span>
                {t.label}
                {t.key === 'alerts' && stats && stats.openAlerts > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{stats.openAlerts}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {notice && (
        <div className="max-w-7xl mx-auto px-4 pt-3">
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
              notice.kind === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <span>{notice.kind === 'ok' ? '✅' : '⚠️'}</span>
            <span className="flex-1">{notice.text}</span>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'dashboard' && <DashboardTab stats={stats} loading={loading} empty={empty} />}
        {tab === 'map' && (
          empty ? <EmptyHint /> : <MapTab segments={segments} assets={assets} trains={trains} />
        )}
        {tab === 'alerts' && (empty ? <EmptyHint /> : <AlertsTab alerts={alerts} onChange={() => void refresh()} />)}
        {tab === 'assets' && (empty ? <EmptyHint /> : <AssetsTab assets={assets} />)}
      </main>

      {confirmWipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Usunąć wszystkie dane?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Trasa, odcinki, assety, odczyty, alerty i pociągi zostaną trwale usunięte.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmWipe(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Anuluj
              </button>
              <button
                onClick={() => void handleWipe()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Usuń wszystko
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
      <div className="text-5xl mb-3">🚄</div>
      <h2 className="text-lg font-semibold text-slate-900">Brak danych</h2>
      <p className="text-sm text-slate-500 mt-1">Kliknij „Wygeneruj dane demo", aby rozpocząć.</p>
    </div>
  );
}
