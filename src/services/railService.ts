import { getRayfinClient } from './rayfinClient';
import type { AuthUser } from './IAuthService';
import { STATIONS, TRACK_CLASSES, type RouteStation } from '@/data/route';
import type { LonLat } from '@/utils/geo';

const uuid = () => crypto.randomUUID();
const toDate = (v: string | Date): Date => (v instanceof Date ? v : new Date(v));
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// ----------------------------------------------------------------------------
// View models
// ----------------------------------------------------------------------------

export type AssetKind = 'track' | 'switch' | 'signal' | 'bridge';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AssetStatus = 'ok' | 'watch' | 'warning' | 'critical';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'open' | 'ack' | 'resolved';

export interface SegmentRow {
  id: string;
  seq: number;
  fromName: string;
  toName: string;
  kmStart: number;
  kmEnd: number;
  lengthKm: number;
  maxSpeedKmh: number;
  trackClass: string;
  geometry: LonLat[];
  riskScore: number;
  riskLevel: RiskLevel;
  lastMaintenance: Date;
  notes?: string;
}

export interface AssetRow {
  id: string;
  kind: AssetKind;
  name: string;
  code: string;
  km: number;
  lat: number;
  lon: number;
  healthScore: number;
  rulDays: number;
  status: AssetStatus;
  vendor: string;
  installedAt: Date;
  lastInspection: Date;
  segment_id: string;
  segmentName?: string;
}

export interface ReadingRow {
  id: string;
  asset_id: string;
  metric: string;
  value: number;
  unit: string;
  recordedAt: Date;
}

export interface AlertRow {
  id: string;
  asset_id: string;
  assetName?: string;
  assetKind?: string;
  severity: AlertSeverity;
  alertType: string;
  title: string;
  message: string;
  recommendation: string;
  status: AlertStatus;
  predictedFailureAt: Date;
  createdAt: Date;
}

export interface TrainRow {
  id: string;
  name: string;
  number: string;
  category: string;
  direction: 'south' | 'north';
  progress: number;
  speedKmh: number;
  healthScore: number;
  status: string;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function statusFromHealth(health: number): AssetStatus {
  if (health < 45) return 'critical';
  if (health < 65) return 'warning';
  if (health < 80) return 'watch';
  return 'ok';
}

export const KIND_LABEL: Record<AssetKind, string> = {
  track: 'Tor / szyna',
  switch: 'Rozjazd',
  signal: 'Sygnalizacja SRK',
  bridge: 'Most / wiadukt',
};

export const KIND_METRIC: Record<AssetKind, { metric: string; unit: string; warn: number; crit: number }> = {
  track: { metric: 'geometry', unit: 'mm', warn: 6, crit: 9 },
  switch: { metric: 'vibration', unit: 'mm/s', warn: 4.5, crit: 7 },
  signal: { metric: 'voltage', unit: 'V', warn: 2.5, crit: 4 },
  bridge: { metric: 'deflection', unit: 'mm', warn: 8, crit: 12 },
};

async function inChunks<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

interface SegmentRecord {
  id: string;
  seq: number;
  fromName: string;
  toName: string;
  kmStart: number | string;
  kmEnd: number | string;
  lengthKm: number | string;
  maxSpeedKmh: number;
  trackClass: string;
  geometryJson: string;
  riskScore: number | string;
  riskLevel: string;
  lastMaintenance: string | Date;
  notes?: string;
}

export async function listSegments(): Promise<SegmentRow[]> {
  const c = getRayfinClient();
  const rows = (await c.data.RouteSegment
    .select([
      'id', 'seq', 'fromName', 'toName', 'kmStart', 'kmEnd', 'lengthKm',
      'maxSpeedKmh', 'trackClass', 'geometryJson', 'riskScore', 'riskLevel',
      'lastMaintenance', 'notes',
    ])
    .orderBy({ seq: 'asc' })
    .execute()) as unknown as SegmentRecord[];

  return rows.map((r) => ({
    id: r.id,
    seq: r.seq,
    fromName: r.fromName,
    toName: r.toName,
    kmStart: Number(r.kmStart),
    kmEnd: Number(r.kmEnd),
    lengthKm: Number(r.lengthKm),
    maxSpeedKmh: r.maxSpeedKmh,
    trackClass: r.trackClass,
    geometry: safeParseGeometry(r.geometryJson),
    riskScore: Number(r.riskScore),
    riskLevel: r.riskLevel as RiskLevel,
    lastMaintenance: toDate(r.lastMaintenance),
    notes: r.notes,
  }));
}

function safeParseGeometry(json: string): LonLat[] {
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr as LonLat[];
  } catch {
    /* ignore */
  }
  return [];
}

interface AssetRecord {
  id: string;
  kind: string;
  name: string;
  code: string;
  km: number | string;
  lat: number | string;
  lon: number | string;
  healthScore: number | string;
  rulDays: number;
  status: string;
  vendor: string;
  installedAt: string | Date;
  lastInspection: string | Date;
  segment?: { id?: string; fromName?: string; toName?: string };
}

export async function listAssets(): Promise<AssetRow[]> {
  const c = getRayfinClient();
  const rows = (await c.data.Asset
    .select([
      'id', 'kind', 'name', 'code', 'km', 'lat', 'lon', 'healthScore',
      'rulDays', 'status', 'vendor', 'installedAt', 'lastInspection',
      'segment.id', 'segment.fromName', 'segment.toName',
    ])
    .orderBy({ km: 'asc' })
    .execute()) as unknown as AssetRecord[];

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as AssetKind,
    name: r.name,
    code: r.code,
    km: Number(r.km),
    lat: Number(r.lat),
    lon: Number(r.lon),
    healthScore: Number(r.healthScore),
    rulDays: r.rulDays,
    status: r.status as AssetStatus,
    vendor: r.vendor,
    installedAt: toDate(r.installedAt),
    lastInspection: toDate(r.lastInspection),
    segment_id: r.segment?.id ?? '',
    segmentName: r.segment ? `${r.segment.fromName} → ${r.segment.toName}` : '',
  }));
}

interface ReadingRecord {
  id: string;
  metric: string;
  value: number | string;
  unit: string;
  recordedAt: string | Date;
  asset?: { id?: string };
}

export async function listReadingsForAsset(assetId: string): Promise<ReadingRow[]> {
  const c = getRayfinClient();
  const rows = (await c.data.SensorReading
    .select(['id', 'metric', 'value', 'unit', 'recordedAt', 'asset.id'])
    .where({ asset: { id: { eq: assetId } } })
    .orderBy({ recordedAt: 'asc' })
    .execute()) as unknown as ReadingRecord[];

  return rows.map((r) => ({
    id: r.id,
    asset_id: r.asset?.id ?? '',
    metric: r.metric,
    value: Number(r.value),
    unit: r.unit,
    recordedAt: toDate(r.recordedAt),
  }));
}

interface AlertRecord {
  id: string;
  severity: string;
  alertType: string;
  title: string;
  message: string;
  recommendation: string;
  status: string;
  predictedFailureAt: string | Date;
  createdAt: string | Date;
  asset?: { id?: string; name?: string; kind?: string };
}

export async function listAlerts(): Promise<AlertRow[]> {
  const c = getRayfinClient();
  const rows = (await c.data.Alert
    .select([
      'id', 'severity', 'alertType', 'title', 'message', 'recommendation',
      'status', 'predictedFailureAt', 'createdAt',
      'asset.id', 'asset.name', 'asset.kind',
    ])
    .orderBy({ createdAt: 'desc' })
    .execute()) as unknown as AlertRecord[];

  return rows.map((r) => ({
    id: r.id,
    asset_id: r.asset?.id ?? '',
    assetName: r.asset?.name ?? '',
    assetKind: r.asset?.kind ?? '',
    severity: r.severity as AlertSeverity,
    alertType: r.alertType,
    title: r.title,
    message: r.message,
    recommendation: r.recommendation,
    status: r.status as AlertStatus,
    predictedFailureAt: toDate(r.predictedFailureAt),
    createdAt: toDate(r.createdAt),
  }));
}

export async function setAlertStatus(alertId: string, status: AlertStatus) {
  const c = getRayfinClient();
  await c.data.Alert.update({ id: alertId }, { status });
}

interface TrainRecord {
  id: string;
  name: string;
  number: string;
  category: string;
  direction: string;
  progress: number | string;
  speedKmh: number;
  healthScore: number | string;
  status: string;
}

export async function listTrains(): Promise<TrainRow[]> {
  const c = getRayfinClient();
  const rows = (await c.data.Train
    .select(['id', 'name', 'number', 'category', 'direction', 'progress', 'speedKmh', 'healthScore', 'status'])
    .orderBy({ number: 'asc' })
    .execute()) as unknown as TrainRecord[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    number: r.number,
    category: r.category,
    direction: (r.direction === 'north' ? 'north' : 'south'),
    progress: Number(r.progress),
    speedKmh: r.speedKmh,
    healthScore: Number(r.healthScore),
    status: r.status,
  }));
}

// ----------------------------------------------------------------------------
// Dashboard stats
// ----------------------------------------------------------------------------

export interface DashboardStats {
  segments: number;
  assets: number;
  openAlerts: number;
  criticalAlerts: number;
  avgHealth: number;
  riskDistribution: Record<RiskLevel, number>;
  statusDistribution: Record<AssetStatus, number>;
  worstAssets: { id: string; name: string; kind: string; rulDays: number; healthScore: number }[];
  highestRiskSegments: { id: string; name: string; riskScore: number; riskLevel: RiskLevel }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [segments, assets, alerts] = await Promise.all([
    listSegments(),
    listAssets(),
    listAlerts(),
  ]);

  const riskDistribution: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const s of segments) riskDistribution[s.riskLevel]++;

  const statusDistribution: Record<AssetStatus, number> = { ok: 0, watch: 0, warning: 0, critical: 0 };
  for (const a of assets) statusDistribution[a.status]++;

  const avgHealth = assets.length
    ? assets.reduce((sum, a) => sum + a.healthScore, 0) / assets.length
    : 0;

  const worstAssets = [...assets]
    .sort((a, b) => a.rulDays - b.rulDays)
    .slice(0, 6)
    .map((a) => ({ id: a.id, name: a.name, kind: a.kind, rulDays: a.rulDays, healthScore: a.healthScore }));

  const highestRiskSegments = [...segments]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map((s) => ({ id: s.id, name: `${s.fromName} → ${s.toName}`, riskScore: s.riskScore, riskLevel: s.riskLevel }));

  return {
    segments: segments.length,
    assets: assets.length,
    openAlerts: alerts.filter((a) => a.status !== 'resolved').length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length,
    avgHealth: round(avgHealth, 1),
    riskDistribution,
    statusDistribution,
    worstAssets,
    highestRiskSegments,
  };
}

export async function isDatabaseEmpty(): Promise<boolean> {
  const c = getRayfinClient();
  const page = await c.data.RouteSegment.select(['id']).first(1).executePaginated();
  return page.items.length === 0;
}

// ----------------------------------------------------------------------------
// Seed
// ----------------------------------------------------------------------------

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const VENDORS = ['Dostawca A', 'Dostawca B', 'Dostawca C', 'Dostawca D', 'Dostawca E', 'Dostawca F'];

const RECOMMENDATIONS: Record<AssetKind, string> = {
  track: 'Zaplanować podbijanie i regulację geometrii toru; ograniczyć prędkość do czasu interwencji.',
  switch: 'Przegląd napędu zwrotnicowego i smarowanie; kontrola luzów i drgań elementów ruchomych.',
  signal: 'Sprawdzić zasilanie i baterie buforowe sygnalizatora; diagnostyka obwodów SRK.',
  bridge: 'Inspekcja dźwigarów i łożysk; pomiar ugięcia pod obciążeniem, ocena korozji.',
};

const ALERT_TYPES: Record<AssetKind, string> = {
  track: 'Degradacja geometrii toru',
  switch: 'Wzrost drgań napędu zwrotnicy',
  signal: 'Spadek napięcia zasilania SRK',
  bridge: 'Rosnące ugięcie przęsła',
};

export interface SeedResult {
  stations: number;
  segments: number;
  assets: number;
  readings: number;
  alerts: number;
  trains: number;
}

export async function seedDemoData(_user: AuthUser): Promise<SeedResult> {
  const c = getRayfinClient();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // 1) Stacje
  await inChunks(STATIONS, 8, async (s) => {
    await c.data.Station.create({
      id: uuid(),
      seq: s.seq,
      name: s.name,
      code: s.code,
      km: s.km,
      lat: s.lat,
      lon: s.lon,
      isStop: s.isStop ? 1 : 0,
    });
  });

  // 2) Odcinki (między kolejnymi stacjami) + geometria
  interface SegSeed {
    id: string;
    seq: number;
    from: RouteStation;
    to: RouteStation;
    riskScore: number;
    riskLevel: RiskLevel;
  }
  const segSeeds: SegSeed[] = [];
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const from = STATIONS[i];
    const to = STATIONS[i + 1];
    // ryzyko: kilka odcinków celowo wysokich/krytycznych dla demo
    const base = 18 + Math.random() * 35;
    const bump = i === 4 ? 50 : i === 8 ? 38 : i === 10 ? 30 : 0;
    const riskScore = round(Math.min(96, base + bump), 2);
    segSeeds.push({
      id: uuid(),
      seq: i,
      from,
      to,
      riskScore,
      riskLevel: riskLevelFromScore(riskScore),
    });
  }

  await inChunks(segSeeds, 6, async (seg) => {
    const geometry: LonLat[] = [
      [seg.from.lon, seg.from.lat],
      [round(lerp(seg.from.lon, seg.to.lon, 0.5), 6), round(lerp(seg.from.lat, seg.to.lat, 0.5), 6)],
      [seg.to.lon, seg.to.lat],
    ];
    await c.data.RouteSegment.create({
      id: seg.id,
      seq: seg.seq,
      fromName: seg.from.name,
      toName: seg.to.name,
      kmStart: seg.from.km,
      kmEnd: seg.to.km,
      lengthKm: round(seg.to.km - seg.from.km, 2),
      maxSpeedKmh: seg.riskScore > 70 ? 120 : rand([160, 200, 200, 160, 140]),
      trackClass: rand(TRACK_CLASSES),
      geometryJson: JSON.stringify(geometry),
      riskScore: seg.riskScore,
      riskLevel: seg.riskLevel,
      lastMaintenance: new Date(now - (30 + Math.floor(Math.random() * 600)) * day),
      notes: seg.riskLevel === 'critical' ? 'Odcinek priorytetowy — przyspieszony harmonogram inspekcji.' : '',
    });
  });

  // 3) Assety wzdłuż odcinków
  interface AssetSeed {
    id: string;
    kind: AssetKind;
    name: string;
    code: string;
    km: number;
    lat: number;
    lon: number;
    healthScore: number;
    status: AssetStatus;
    rulDays: number;
    segId: string;
    monitored: boolean;
  }
  const assetSeeds: AssetSeed[] = [];
  let assetCounter = 0;

  for (const seg of segSeeds) {
    // liczba i typy assetów zależne od odcinka
    const plan: AssetKind[] = ['track', 'switch', 'signal'];
    // mosty na wybranych odcinkach (przeprawy)
    if ([2, 6, 9, 11].includes(seg.seq)) plan.push('bridge');

    for (const kind of plan) {
      const t = 0.2 + Math.random() * 0.6;
      const lon = round(lerp(seg.from.lon, seg.to.lon, t), 6);
      const lat = round(lerp(seg.from.lat, seg.to.lat, t), 6);
      const km = round(lerp(seg.from.km, seg.to.km, t), 2);

      // kondycja skorelowana z ryzykiem odcinka + szum
      const noise = (Math.random() - 0.5) * 30;
      let health = round(Math.max(20, Math.min(99, 100 - seg.riskScore * 0.7 + noise)), 2);
      // wymuś kilka krytycznych na najbardziej ryzykownych odcinkach
      if (seg.riskLevel === 'critical' && Math.random() < 0.5) health = round(30 + Math.random() * 15, 2);
      const status = statusFromHealth(health);
      const rulDays = Math.max(2, Math.round((health / 100) * 540 + (Math.random() - 0.5) * 60));

      assetCounter++;
      const code = `${kind.slice(0, 2).toUpperCase()}-${String(seg.from.km).padStart(3, '0')}-${assetCounter}`;
      const name = `${KIND_LABEL[kind]} ${seg.from.code}–${seg.to.code} (${km} km)`;

      assetSeeds.push({
        id: uuid(),
        kind,
        name,
        code,
        km,
        lat,
        lon,
        healthScore: health,
        status,
        rulDays,
        segId: seg.id,
        monitored: status !== 'ok',
      });
    }
  }

  await inChunks(assetSeeds, 12, async (a) => {
    await c.data.Asset.create({
      id: a.id,
      segment: { id: a.segId },
      kind: a.kind,
      name: a.name,
      code: a.code,
      km: a.km,
      lat: a.lat,
      lon: a.lon,
      healthScore: a.healthScore,
      rulDays: a.rulDays,
      status: a.status,
      vendor: rand(VENDORS),
      installedAt: new Date(now - (365 + Math.floor(Math.random() * 365 * 6)) * day),
      lastInspection: new Date(now - (5 + Math.floor(Math.random() * 120)) * day),
    });
  });

  // 4) Odczyty czujników — szereg czasowy dla monitorowanych + kilku OK
  const monitored = assetSeeds.filter((a) => a.monitored);
  const extraOk = assetSeeds.filter((a) => !a.monitored).slice(0, 6);
  const seriesAssets = [...monitored, ...extraOk];

  const POINTS = 20;
  let readingCount = 0;
  const readingJobs: { assetId: string; metric: string; unit: string; value: number; recordedAt: Date }[] = [];

  for (const a of seriesAssets) {
    const m = KIND_METRIC[a.kind];
    // poziom docelowy zależny od statusu
    const target =
      a.status === 'critical' ? m.crit * 1.05
      : a.status === 'warning' ? m.warn * 1.05
      : a.status === 'watch' ? m.warn * 0.8
      : m.warn * 0.45;
    const start = target * 0.55;
    for (let p = 0; p < POINTS; p++) {
      const frac = p / (POINTS - 1);
      const trend = lerp(start, target, frac);
      const jitter = trend * (Math.random() - 0.5) * 0.12;
      const value = round(Math.max(0, trend + jitter), 3);
      const recordedAt = new Date(now - (POINTS - 1 - p) * 3 * day);
      readingJobs.push({ assetId: a.id, metric: m.metric, unit: m.unit, value, recordedAt });
    }
  }

  await inChunks(readingJobs, 25, async (r) => {
    await c.data.SensorReading.create({
      id: uuid(),
      asset: { id: r.assetId },
      metric: r.metric,
      value: r.value,
      unit: r.unit,
      recordedAt: r.recordedAt,
    });
    readingCount++;
  });

  // 5) Alerty — dla assetów warning/critical
  const alertAssets = assetSeeds.filter((a) => a.status === 'warning' || a.status === 'critical');
  let alertCount = 0;
  await inChunks(alertAssets, 10, async (a) => {
    const severity: AlertSeverity = a.status === 'critical' ? 'critical' : 'warning';
    const m = KIND_METRIC[a.kind];
    await c.data.Alert.create({
      id: uuid(),
      asset: { id: a.id },
      severity,
      alertType: ALERT_TYPES[a.kind],
      title: `${ALERT_TYPES[a.kind]} — ${a.code}`,
      message:
        `Model PdM wykrył trend degradacji parametru "${m.metric}" przekraczający próg ostrzegawczy ` +
        `(${m.warn} ${m.unit}). Kondycja assetu: ${a.healthScore}%. Szacowany RUL: ${a.rulDays} dni.`,
      recommendation: RECOMMENDATIONS[a.kind],
      status: 'open',
      predictedFailureAt: new Date(now + a.rulDays * day),
      createdAt: new Date(now - Math.floor(Math.random() * 10) * day),
    });
    alertCount++;
  });

  // 6) Pociągi
  const TRAINS = [
    { name: 'Ekspres 101', number: '101', category: 'EX', direction: 'south', progress: 0.12, speedKmh: 188 },
    { name: 'Regio 230', number: '230', category: 'RE', direction: 'south', progress: 0.46, speedKmh: 142 },
    { name: 'Regio 232', number: '232', category: 'RE', direction: 'south', progress: 0.78, speedKmh: 118 },
    { name: 'Ekspres 102', number: '102', category: 'EX', direction: 'north', progress: 0.30, speedKmh: 196 },
    { name: 'Regio 231', number: '231', category: 'RE', direction: 'north', progress: 0.63, speedKmh: 135 },
    { name: 'Towarowy 7', number: 'T7', category: 'cargo', direction: 'north', progress: 0.90, speedKmh: 92 },
  ];
  await inChunks(TRAINS, 6, async (t) => {
    const health = round(70 + Math.random() * 29, 2);
    await c.data.Train.create({
      id: uuid(),
      name: t.name,
      number: t.number,
      category: t.category,
      direction: t.direction,
      progress: t.progress,
      speedKmh: t.speedKmh,
      healthScore: health,
      status: health < 80 ? 'alert' : 'running',
    });
  });

  return {
    stations: STATIONS.length,
    segments: segSeeds.length,
    assets: assetSeeds.length,
    readings: readingCount,
    alerts: alertCount,
    trains: TRAINS.length,
  };
}

// ----------------------------------------------------------------------------
// Wipe
// ----------------------------------------------------------------------------

export async function wipeAllData(): Promise<void> {
  const c = getRayfinClient();

  const readings = await c.data.SensorReading.select(['id']).execute();
  for (const r of readings) await c.data.SensorReading.delete({ id: r.id });

  const alerts = await c.data.Alert.select(['id']).execute();
  for (const a of alerts) await c.data.Alert.delete({ id: a.id });

  const assets = await c.data.Asset.select(['id']).execute();
  for (const a of assets) await c.data.Asset.delete({ id: a.id });

  const segments = await c.data.RouteSegment.select(['id']).execute();
  for (const s of segments) await c.data.RouteSegment.delete({ id: s.id });

  const stations = await c.data.Station.select(['id']).execute();
  for (const s of stations) await c.data.Station.delete({ id: s.id });

  const trains = await c.data.Train.select(['id']).execute();
  for (const t of trains) await c.data.Train.delete({ id: t.id });
}
