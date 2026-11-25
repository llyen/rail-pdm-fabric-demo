import { useEffect, useMemo, useState } from 'react';
import { TrendChart } from '@/components/TrendChart';
import {
  listReadingsForAsset,
  KIND_LABEL,
  KIND_METRIC,
  type AssetRow,
  type AssetKind,
  type AssetStatus,
  type ReadingRow,
} from '@/services/railService';
import { STATUS_COLOR, STATUS_LABEL, KIND_ICON } from '@/utils/ui';

export function AssetsTab({ assets }: { assets: AssetRow[] }) {
  const [kindFilter, setKindFilter] = useState<'all' | AssetKind>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AssetStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      assets.filter(
        (a) =>
          (kindFilter === 'all' || a.kind === kindFilter) &&
          (statusFilter === 'all' || a.status === statusFilter)
      ),
    [assets, kindFilter, statusFilter]
  );

  const selected = assets.find((a) => a.id === selectedId) ?? null;

  if (assets.length === 0) {
    return <div className="text-slate-500">Brak assetów. Wygeneruj dane demo.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterGroup
            label="Typ"
            value={kindFilter}
            onChange={(v) => setKindFilter(v as 'all' | AssetKind)}
            options={[
              ['all', 'wszystkie'],
              ['track', 'tory'],
              ['switch', 'rozjazdy'],
              ['signal', 'sygnalizacja'],
              ['bridge', 'mosty'],
            ]}
          />
          <FilterGroup
            label="Stan"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as 'all' | AssetStatus)}
            options={[
              ['all', 'wszystkie'],
              ['critical', 'krytyczne'],
              ['warning', 'ostrzeżenia'],
              ['watch', 'obserwacja'],
              ['ok', 'sprawne'],
            ]}
          />
          <span className="ml-auto text-sm text-slate-500">{filtered.length} assetów</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Asset</th>
                <th className="px-3 py-2 text-left font-medium">Typ</th>
                <th className="px-3 py-2 text-right font-medium">km</th>
                <th className="px-3 py-2 text-right font-medium">Kondycja</th>
                <th className="px-3 py-2 text-right font-medium">RUL</th>
                <th className="px-3 py-2 text-center font-medium">Stan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${selectedId === a.id ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span>{KIND_ICON[a.kind]}</span>
                      <span className="truncate max-w-[220px] text-slate-800">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{KIND_LABEL[a.kind]}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{a.km}</td>
                  <td className="px-3 py-2 text-right">
                    <HealthBar value={a.healthScore} />
                  </td>
                  <td className={`px-3 py-2 text-right font-medium ${a.rulDays < 30 ? 'text-red-600' : a.rulDays < 90 ? 'text-orange-600' : 'text-slate-600'}`}>
                    {a.rulDays}d
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ background: STATUS_COLOR[a.status] }}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:col-span-1">
        {selected ? (
          <AssetTrend asset={selected} />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            <div className="text-3xl mb-2">📈</div>
            Wybierz asset z tabeli, aby zobaczyć trend czujnika i prognozę.
          </div>
        )}
      </div>
    </div>
  );
}

function AssetTrend({ asset }: { asset: AssetRow }) {
  const [readings, setReadings] = useState<ReadingRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const m = KIND_METRIC[asset.kind];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setReadings(null);
    listReadingsForAsset(asset.id)
      .then((r) => { if (!cancelled) setReadings(r); })
      .catch(() => { if (!cancelled) setReadings([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [asset.id]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
      <h3 className="text-base font-bold text-slate-900">{KIND_ICON[asset.kind]} {asset.name}</h3>
      <div className="flex items-center gap-3 text-sm">
        <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: STATUS_COLOR[asset.status] }}>
          {STATUS_LABEL[asset.status]}
        </span>
        <span className="text-slate-500">Kondycja {asset.healthScore}%</span>
        <span className={`font-medium ${asset.rulDays < 30 ? 'text-red-600' : 'text-slate-600'}`}>RUL {asset.rulDays} dni</span>
      </div>
      <p className="text-xs font-semibold text-slate-500">Trend: {m.metric} ({m.unit}) — próg ostrz. {m.warn}, kryt. {m.crit}</p>
      {loading ? (
        <div className="text-sm text-slate-400 py-6 text-center">Ładowanie odczytów...</div>
      ) : (
        <TrendChart readings={readings ?? []} warn={m.warn} crit={m.crit} color={STATUS_COLOR[asset.status]} />
      )}
      <p className="text-xs text-slate-400">
        Odcinek: {asset.segmentName} • Producent: {asset.vendor}
      </p>
    </div>
  );
}

function HealthBar({ value }: { value: number }) {
  const color = value >= 80 ? '#22c55e' : value >= 65 ? '#eab308' : value >= 45 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="w-9 text-right text-slate-600">{value}%</span>
    </div>
  );
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
