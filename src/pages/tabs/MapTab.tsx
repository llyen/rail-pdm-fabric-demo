import { useEffect, useState } from 'react';
import { RiskMap, type MapSelection } from '@/components/RiskMap';
import { TrendChart } from '@/components/TrendChart';
import {
  listReadingsForAsset,
  KIND_METRIC,
  type AssetRow,
  type SegmentRow,
  type TrainRow,
  type ReadingRow,
} from '@/services/railService';
import {
  RISK_COLOR,
  RISK_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  KIND_ICON,
  CATEGORY_COLOR,
} from '@/utils/ui';

export function MapTab({
  segments,
  assets,
  trains,
}: {
  segments: SegmentRow[];
  assets: AssetRow[];
  trains: TrainRow[];
}) {
  const [selection, setSelection] = useState<MapSelection>(null);
  const [live, setLive] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between bg-slate-900 px-4 py-2">
          <span className="text-sm font-medium text-slate-200">🗺️ Mapa ryzyka trasy</span>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <span>Symulacja taboru</span>
            <button
              onClick={() => setLive((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${live ? 'bg-emerald-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${live ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>
        <RiskMap
          segments={segments}
          assets={assets}
          trains={trains}
          selection={selection}
          onSelect={setSelection}
          live={live}
        />
      </div>

      <div className="lg:col-span-1">
        <DetailPanel selection={selection} segments={segments} assets={assets} trains={trains} />
      </div>
    </div>
  );
}

function DetailPanel({
  selection,
  segments,
  assets,
  trains,
}: {
  selection: MapSelection;
  segments: SegmentRow[];
  assets: AssetRow[];
  trains: TrainRow[];
}) {
  if (!selection) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        <div className="text-3xl mb-2">👆</div>
        Kliknij odcinek, asset lub pociąg na mapie, aby zobaczyć szczegóły.
      </div>
    );
  }

  if (selection.type === 'segment') {
    const seg = segments.find((s) => s.id === selection.id);
    if (!seg) return null;
    const segAssets = assets.filter((a) => a.segment_id === seg.id);
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <Badge color={RISK_COLOR[seg.riskLevel]} text={`Ryzyko: ${RISK_LABEL[seg.riskLevel]}`} />
        <h3 className="text-base font-bold text-slate-900">{seg.fromName} → {seg.toName}</h3>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <Field label="Kilometraż" value={`${seg.kmStart}–${seg.kmEnd} km`} />
          <Field label="Długość" value={`${seg.lengthKm} km`} />
          <Field label="Vmax" value={`${seg.maxSpeedKmh} km/h`} />
          <Field label="Klasa" value={seg.trackClass} />
          <Field label="Risk score" value={seg.riskScore.toFixed(1)} />
          <Field label="Ost. utrzymanie" value={seg.lastMaintenance.toLocaleDateString('pl-PL')} />
        </dl>
        {seg.notes && <p className="text-sm rounded-lg bg-amber-50 border border-amber-200 p-2 text-amber-800">{seg.notes}</p>}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Assety na odcinku ({segAssets.length})</p>
          <ul className="space-y-1">
            {segAssets.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <span>{KIND_ICON[a.kind]}</span>
                <span className="flex-1 truncate text-slate-700">{a.name}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[a.status] }} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (selection.type === 'train') {
    const t = trains.find((x) => x.id === selection.id);
    if (!t) return null;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <Badge color={CATEGORY_COLOR[t.category] ?? '#64748b'} text={t.category} />
        <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <Field label="Numer" value={t.number} />
          <Field label="Kierunek" value={t.direction === 'south' ? 'Kaliniec → Morawin' : 'Morawin → Kaliniec'} />
          <Field label="Prędkość" value={`${t.speedKmh} km/h`} />
          <Field label="Kondycja" value={`${t.healthScore}%`} />
          <Field label="Status" value={t.status === 'alert' ? '⚠️ alert' : '✅ w trasie'} />
        </dl>
      </div>
    );
  }

  // asset
  const a = assets.find((x) => x.id === selection.id);
  if (!a) return null;
  return <AssetDetail asset={a} />;
}

function AssetDetail({ asset }: { asset: AssetRow }) {
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
      <Badge color={STATUS_COLOR[asset.status]} text={`Stan: ${STATUS_LABEL[asset.status]}`} />
      <h3 className="text-base font-bold text-slate-900">{KIND_ICON[asset.kind]} {asset.name}</h3>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <Field label="Kod" value={asset.code} />
        <Field label="Kilometraż" value={`${asset.km} km`} />
        <Field label="Kondycja" value={`${asset.healthScore}%`} />
        <Field label="RUL" value={`${asset.rulDays} dni`} />
        <Field label="Producent" value={asset.vendor} />
        <Field label="Ost. inspekcja" value={asset.lastInspection.toLocaleDateString('pl-PL')} />
      </dl>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1">
          Trend: {m.metric} ({m.unit})
        </p>
        {loading ? (
          <div className="text-sm text-slate-400 py-6 text-center">Ładowanie odczytów...</div>
        ) : (
          <TrendChart readings={readings ?? []} warn={m.warn} crit={m.crit} color={STATUS_COLOR[asset.status]} height={150} />
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-800 font-medium">{value}</dd>
    </div>
  );
}

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
      style={{ background: color }}
    >
      {text}
    </span>
  );
}
