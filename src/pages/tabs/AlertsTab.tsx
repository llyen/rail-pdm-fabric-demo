import { useMemo, useState } from 'react';
import {
  setAlertStatus,
  type AlertRow,
  type AlertSeverity,
  type AlertStatus,
} from '@/services/railService';
import { SEVERITY_COLOR, SEVERITY_LABEL, KIND_ICON } from '@/utils/ui';

export function AlertsTab({
  alerts,
  onChange,
}: {
  alerts: AlertRow[];
  onChange: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [sevFilter, setSevFilter] = useState<'all' | AlertSeverity>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      alerts.filter(
        (a) =>
          (statusFilter === 'all' || a.status === statusFilter) &&
          (sevFilter === 'all' || a.severity === sevFilter)
      ),
    [alerts, statusFilter, sevFilter]
  );

  const update = async (id: string, status: AlertStatus) => {
    setBusy(id);
    try {
      await setAlertStatus(id, status);
      onChange();
    } finally {
      setBusy(null);
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-emerald-800 font-medium">Brak alertów predykcyjnych.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterGroup
          label="Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as 'all' | AlertStatus)}
          options={[
            ['all', 'wszystkie'],
            ['open', 'otwarte'],
            ['ack', 'potwierdzone'],
            ['resolved', 'rozwiązane'],
          ]}
        />
        <FilterGroup
          label="Waga"
          value={sevFilter}
          onChange={(v) => setSevFilter(v as 'all' | AlertSeverity)}
          options={[
            ['all', 'wszystkie'],
            ['critical', 'krytyczne'],
            ['warning', 'ostrzeżenia'],
            ['info', 'info'],
          ]}
        />
        <span className="ml-auto text-sm text-slate-500">{filtered.length} z {alerts.length}</span>
      </div>

      <ul className="space-y-3">
        {filtered.map((a) => (
          <li
            key={a.id}
            className={`rounded-2xl border bg-white p-4 ${a.status === 'resolved' ? 'opacity-60' : ''}`}
            style={{ borderLeftColor: SEVERITY_COLOR[a.severity], borderLeftWidth: 4 }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{KIND_ICON[(a.assetKind as keyof typeof KIND_ICON)] ?? '⚙️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ background: SEVERITY_COLOR[a.severity] }}
                  >
                    {SEVERITY_LABEL[a.severity]}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                  <StatusPill status={a.status} />
                </div>
                <p className="text-sm text-slate-600 mt-1">{a.message}</p>
                <p className="text-sm text-slate-700 mt-2 rounded-lg bg-blue-50 border border-blue-100 p-2">
                  <span className="font-medium">Zalecenie:</span> {a.recommendation}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                  <span>Asset: {a.assetName}</span>
                  <span>Utworzono: {a.createdAt.toLocaleDateString('pl-PL')}</span>
                  <span className="font-medium text-slate-500">
                    Prognoza awarii: {a.predictedFailureAt.toLocaleDateString('pl-PL')}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {a.status === 'open' && (
                  <button
                    disabled={busy === a.id}
                    onClick={() => void update(a.id, 'ack')}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Potwierdź
                  </button>
                )}
                {a.status !== 'resolved' && (
                  <button
                    disabled={busy === a.id}
                    onClick={() => void update(a.id, 'resolved')}
                    className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-medium text-white hover:brightness-110 disabled:opacity-50"
                  >
                    Rozwiąż
                  </button>
                )}
                {a.status === 'resolved' && (
                  <button
                    disabled={busy === a.id}
                    onClick={() => void update(a.id, 'open')}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Otwórz ponownie
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusPill({ status }: { status: AlertStatus }) {
  const map: Record<AlertStatus, { c: string; l: string }> = {
    open: { c: 'bg-red-100 text-red-700', l: 'otwarty' },
    ack: { c: 'bg-amber-100 text-amber-700', l: 'potwierdzony' },
    resolved: { c: 'bg-emerald-100 text-emerald-700', l: 'rozwiązany' },
  };
  const s = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.c}`}>{s.l}</span>;
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-400 mr-1">{label}:</span>
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            value === v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
