import { useMemo } from 'react';
import type { ReadingRow } from '@/services/railService';

interface Props {
  readings: ReadingRow[];
  warn?: number;
  crit?: number;
  color?: string;
  height?: number;
}

const W = 560;
const PAD = { l: 40, r: 12, t: 14, b: 24 };

/** Lekki wykres trendu (SVG) z progami ostrzegawczym/krytycznym. */
export function TrendChart({ readings, warn, crit, color = '#3b82f6', height = 180 }: Props) {
  const H = height;

  const model = useMemo(() => {
    if (readings.length === 0) return null;
    const values = readings.map((r) => r.value);
    const maxThreshold = Math.max(crit ?? 0, warn ?? 0);
    const maxV = Math.max(...values, maxThreshold) * 1.1;
    const minV = Math.min(...values, 0);
    const x0 = readings[0].recordedAt.getTime();
    const x1 = readings[readings.length - 1].recordedAt.getTime();
    const span = x1 - x0 || 1;
    const px = (t: number) => PAD.l + ((t - x0) / span) * (W - PAD.l - PAD.r);
    const py = (v: number) => PAD.t + (1 - (v - minV) / (maxV - minV || 1)) * (H - PAD.t - PAD.b);
    return { values, maxV, minV, px, py };
  }, [readings, warn, crit, H]);

  if (!model) {
    return <div className="text-sm text-slate-400 py-8 text-center">Brak odczytów czujnika dla tego assetu.</div>;
  }

  const pts = readings.map((r) => `${model.px(r.recordedAt.getTime())},${model.py(r.value)}`).join(' ');
  const area = `${PAD.l},${model.py(model.minV)} ${pts} ${W - PAD.r},${model.py(model.minV)}`;
  const last = readings[readings.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* osie / linie pomocnicze */}
      {[0, 0.5, 1].map((f) => {
        const v = model.minV + (model.maxV - model.minV) * f;
        const y = model.py(v);
        return (
          <g key={f}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{v.toFixed(1)}</text>
          </g>
        );
      })}

      {/* progi */}
      {warn !== undefined && (
        <line x1={PAD.l} y1={model.py(warn)} x2={W - PAD.r} y2={model.py(warn)} stroke="#f97316" strokeWidth={1.5} strokeDasharray="5 4" />
      )}
      {crit !== undefined && (
        <line x1={PAD.l} y1={model.py(crit)} x2={W - PAD.r} y2={model.py(crit)} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 4" />
      )}

      {/* obszar + linia */}
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />

      {/* punkty */}
      {readings.map((r) => (
        <circle key={r.id} cx={model.px(r.recordedAt.getTime())} cy={model.py(r.value)} r={2} fill={color} />
      ))}

      {/* ostatni punkt */}
      <circle cx={model.px(last.recordedAt.getTime())} cy={model.py(last.value)} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
    </svg>
  );
}
