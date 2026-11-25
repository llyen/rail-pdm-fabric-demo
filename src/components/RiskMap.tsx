import { useEffect, useMemo, useRef, useState } from 'react';
import { STATIONS } from '@/data/route';
import {
  boundsOf,
  makeProjector,
  pointAt,
  type LonLat,
} from '@/utils/geo';
import { RISK_COLOR, STATUS_COLOR, CATEGORY_COLOR } from '@/utils/ui';
import type { AssetRow, SegmentRow, TrainRow } from '@/services/railService';

export type MapSelection =
  | { type: 'asset'; id: string }
  | { type: 'segment'; id: string }
  | { type: 'train'; id: string }
  | null;

interface Props {
  segments: SegmentRow[];
  assets: AssetRow[];
  trains: TrainRow[];
  selection: MapSelection;
  onSelect: (sel: MapSelection) => void;
  live: boolean;
}

const W = 1040;
const H = 660;
const PAD = 70;

export function RiskMap({ segments, assets, trains, selection, onSelect, live }: Props) {
  // Projektor wyliczony z bounding boxa wszystkich stacji.
  const projector = useMemo(() => {
    const pts: LonLat[] = STATIONS.map((s) => [s.lon, s.lat]);
    return makeProjector(boundsOf(pts), W, H, PAD);
  }, []);

  // Ekranowe pozycje stacji + polilinia trasy.
  const stationPts = useMemo(
    () => STATIONS.map((s) => ({ ...projector.project(s.lon, s.lat), station: s })),
    [projector]
  );
  const routePts = useMemo(() => stationPts.map((p) => ({ x: p.x, y: p.y })), [stationPts]);

  const segBySeq = useMemo(() => {
    const m = new Map<number, SegmentRow>();
    for (const s of segments) m.set(s.seq, s);
    return m;
  }, [segments]);

  // Animacja pociągów (po stronie klienta).
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  // Inicjalizacja postępów z danych.
  useEffect(() => {
    const init: Record<string, number> = {};
    for (const t of trains) init[t.id] = t.progress;
    setProgresses(init);
  }, [trains]);

  useEffect(() => {
    if (!live || trains.length === 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const step = (ts: number) => {
      const last = lastTsRef.current || ts;
      const dt = Math.min(0.1, (ts - last) / 1000); // s, cap dla zakładek w tle
      lastTsRef.current = ts;
      setProgresses((prev) => {
        const next = { ...prev };
        for (const t of trains) {
          // 297 km trasy; przeliczamy km/h na ułamek/s, ×40 dla czytelnej animacji demo
          const fracPerSec = (t.speedKmh / 297 / 3600) * 40;
          const dir = t.direction === 'north' ? -1 : 1;
          let p = (prev[t.id] ?? t.progress) + dir * fracPerSec * dt;
          if (p > 1) p = 0;
          if (p < 0) p = 1;
          next[t.id] = p;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = 0;
    };
  }, [live, trains]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto select-none"
      style={{ background: 'linear-gradient(160deg,#0f172a,#1e293b)' }}
      onClick={() => onSelect(null)}
    >
      {/* siatka tła */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff10" strokeWidth="1" />
        </pattern>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#grid)" />

      {/* tytuł */}
      <text x={PAD - 10} y={36} fill="#e2e8f0" fontSize="20" fontWeight="700">
        Kaliniec Główny → Morawin Główny
      </text>
      <text x={PAD - 10} y={56} fill="#94a3b8" fontSize="12">
        Linia demonstracyjna L1 — mapa ryzyka odcinków i assetów PdM
      </text>

      {/* podkład trasy */}
      <polyline
        points={routePts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#0b1220"
        strokeWidth={12}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* odcinki kolorowane ryzykiem */}
      {stationPts.slice(0, -1).map((p, i) => {
        const seg = segBySeq.get(i);
        const next = stationPts[i + 1];
        const color = seg ? RISK_COLOR[seg.riskLevel] : '#475569';
        const isSel = selection?.type === 'segment' && seg?.id === selection.id;
        return (
          <line
            key={`seg-${i}`}
            x1={p.x}
            y1={p.y}
            x2={next.x}
            y2={next.y}
            stroke={color}
            strokeWidth={isSel ? 10 : 6}
            strokeLinecap="round"
            opacity={isSel ? 1 : 0.92}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (seg) onSelect({ type: 'segment', id: seg.id });
            }}
          />
        );
      })}

      {/* assety */}
      {assets.map((a) => {
        const { x, y } = projector.project(a.lon, a.lat);
        const isSel = selection?.type === 'asset' && a.id === selection.id;
        const color = STATUS_COLOR[a.status];
        const r = isSel ? 8 : 5;
        return (
          <g
            key={a.id}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect({ type: 'asset', id: a.id });
            }}
            filter={a.status === 'critical' ? 'url(#glow)' : undefined}
          >
            <AssetGlyph kind={a.kind} x={x} y={y} r={r} color={color} selected={isSel} />
          </g>
        );
      })}

      {/* stacje */}
      {stationPts.map((p) => (
        <g key={p.station.code}>
          <circle cx={p.x} cy={p.y} r={p.station.isStop ? 5 : 3} fill="#e2e8f0" stroke="#0f172a" strokeWidth={2} />
          {p.station.isStop && (
            <text
              x={p.x + 8}
              y={p.y + 4}
              fill="#cbd5e1"
              fontSize="11"
              fontWeight="600"
            >
              {p.station.name}
            </text>
          )}
        </g>
      ))}

      {/* pociągi */}
      {trains.map((t) => {
        const prog = progresses[t.id] ?? t.progress;
        const { x, y, angle } = pointAt(routePts, prog);
        const isSel = selection?.type === 'train' && t.id === selection.id;
        const color = CATEGORY_COLOR[t.category] ?? '#64748b';
        return (
          <g
            key={t.id}
            transform={`translate(${x},${y}) rotate(${(angle * 180) / Math.PI})`}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect({ type: 'train', id: t.id });
            }}
          >
            <rect
              x={-11}
              y={-6}
              width={22}
              height={12}
              rx={3}
              fill={color}
              stroke={isSel ? '#fff' : '#0f172a'}
              strokeWidth={isSel ? 2 : 1.5}
            />
            <circle cx={7} cy={0} r={2} fill="#fde68a" />
            {t.status === 'alert' && <circle cx={-9} cy={-9} r={3.5} fill="#ef4444" stroke="#fff" strokeWidth={1} />}
          </g>
        );
      })}

      <Legend />
    </svg>
  );
}

function AssetGlyph({
  kind,
  x,
  y,
  r,
  color,
  selected,
}: {
  kind: AssetRow['kind'];
  x: number;
  y: number;
  r: number;
  color: string;
  selected: boolean;
}) {
  const stroke = selected ? '#ffffff' : '#0f172a';
  const sw = selected ? 2 : 1.4;
  if (kind === 'switch') {
    return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={1.5} fill={color} stroke={stroke} strokeWidth={sw} />;
  }
  if (kind === 'signal') {
    return (
      <polygon
        points={`${x},${y - r - 1} ${x + r + 1},${y + r} ${x - r - 1},${y + r}`}
        fill={color}
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  }
  if (kind === 'bridge') {
    return (
      <polygon
        points={`${x},${y - r - 1} ${x + r + 1},${y} ${x},${y + r + 1} ${x - r - 1},${y}`}
        fill={color}
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  }
  // track
  return <circle cx={x} cy={y} r={r} fill={color} stroke={stroke} strokeWidth={sw} />;
}

function Legend() {
  const risks: { c: string; l: string }[] = [
    { c: RISK_COLOR.low, l: 'niskie' },
    { c: RISK_COLOR.medium, l: 'średnie' },
    { c: RISK_COLOR.high, l: 'wysokie' },
    { c: RISK_COLOR.critical, l: 'krytyczne' },
  ];
  return (
    <g transform={`translate(${PAD - 10}, ${H - 70})`}>
      <text x={0} y={0} fill="#94a3b8" fontSize="11" fontWeight="600">RYZYKO ODCINKA</text>
      {risks.map((r, i) => (
        <g key={r.l} transform={`translate(${i * 92}, 12)`}>
          <line x1={0} y1={4} x2={18} y2={4} stroke={r.c} strokeWidth={6} strokeLinecap="round" />
          <text x={24} y={8} fill="#cbd5e1" fontSize="11">{r.l}</text>
        </g>
      ))}
      <text x={0} y={40} fill="#94a3b8" fontSize="11" fontWeight="600">ASSET</text>
      <g transform="translate(58, 36)">
        <circle cx={4} cy={4} r={4} fill="#cbd5e1" /><text x={14} y={8} fill="#cbd5e1" fontSize="11">tor</text>
        <rect x={56} y={0} width={8} height={8} fill="#cbd5e1" /><text x={70} y={8} fill="#cbd5e1" fontSize="11">rozjazd</text>
        <polygon points="150,0 158,8 142,8" fill="#cbd5e1" /><text x={164} y={8} fill="#cbd5e1" fontSize="11">sygnalizacja</text>
        <polygon points="270,0 278,4 270,8 262,4" fill="#cbd5e1" /><text x={284} y={8} fill="#cbd5e1" fontSize="11">most</text>
      </g>
    </g>
  );
}
