import type { DashboardStats, RiskLevel, AssetStatus } from '@/services/railService';
import { RISK_COLOR, RISK_LABEL, STATUS_COLOR, STATUS_LABEL, KIND_ICON } from '@/utils/ui';

export function DashboardTab({
  stats,
  loading,
  empty,
}: {
  stats: DashboardStats | null;
  loading: boolean;
  empty: boolean;
}) {
  if (loading) return <div className="text-slate-500">Ładowanie metryk...</div>;
  if (empty)
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="text-5xl mb-3">🚄</div>
        <h2 className="text-lg font-semibold text-slate-900">Brak danych</h2>
        <p className="text-sm text-slate-500 mt-1">
          Kliknij <strong>Wygeneruj dane demo</strong> w prawym górnym rogu, aby utworzyć trasę,
          odcinki, assety, odczyty czujników, alerty i pociągi.
        </p>
      </div>
    );
  if (!stats) return null;

  const riskLevels: RiskLevel[] = ['critical', 'high', 'medium', 'low'];
  const statuses: AssetStatus[] = ['critical', 'warning', 'watch', 'ok'];
  const totalSeg = Object.values(stats.riskDistribution).reduce((a, b) => a + b, 0) || 1;
  const totalAss = Object.values(stats.statusDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Odcinki trasy" value={stats.segments} icon="🛤️" />
        <StatCard label="Assety PdM" value={stats.assets} icon="⚙️" />
        <StatCard label="Otwarte alerty" value={stats.openAlerts} icon="🔔" accent={stats.openAlerts > 0 ? 'amber' : 'green'} />
        <StatCard label="Alerty krytyczne" value={stats.criticalAlerts} icon="🚨" accent={stats.criticalAlerts > 0 ? 'red' : 'green'} />
        <StatCard label="Śr. kondycja" value={`${stats.avgHealth}%`} icon="📈" accent={stats.avgHealth >= 80 ? 'green' : stats.avgHealth >= 65 ? 'amber' : 'red'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Rozkład ryzyka odcinków</h3>
          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {riskLevels.map((lvl) =>
              stats.riskDistribution[lvl] > 0 ? (
                <div
                  key={lvl}
                  style={{ width: `${(stats.riskDistribution[lvl] / totalSeg) * 100}%`, background: RISK_COLOR[lvl] }}
                  title={`${RISK_LABEL[lvl]}: ${stats.riskDistribution[lvl]}`}
                />
              ) : null
            )}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {riskLevels.map((lvl) => (
              <li key={lvl} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: RISK_COLOR[lvl] }} />
                <span className="text-slate-600 capitalize">{RISK_LABEL[lvl]}</span>
                <span className="ml-auto font-medium text-slate-900">{stats.riskDistribution[lvl]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Stan techniczny assetów</h3>
          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {statuses.map((st) =>
              stats.statusDistribution[st] > 0 ? (
                <div
                  key={st}
                  style={{ width: `${(stats.statusDistribution[st] / totalAss) * 100}%`, background: STATUS_COLOR[st] }}
                  title={`${STATUS_LABEL[st]}: ${stats.statusDistribution[st]}`}
                />
              ) : null
            )}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {statuses.map((st) => (
              <li key={st} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLOR[st] }} />
                <span className="text-slate-600">{STATUS_LABEL[st]}</span>
                <span className="ml-auto font-medium text-slate-900">{stats.statusDistribution[st]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">⏳ Najpilniejsze assety (RUL)</h3>
          <ul className="space-y-2">
            {stats.worstAssets.map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span>{KIND_ICON[a.kind as keyof typeof KIND_ICON] ?? '⚙️'}</span>
                <span className="flex-1 truncate text-slate-700">{a.name}</span>
                <span className="text-xs text-slate-400">{a.healthScore}%</span>
                <span className={`font-semibold w-20 text-right ${a.rulDays < 30 ? 'text-red-600' : a.rulDays < 90 ? 'text-orange-600' : 'text-slate-700'}`}>
                  {a.rulDays} dni
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">⚠️ Odcinki o najwyższym ryzyku</h3>
          <ul className="space-y-2">
            {stats.highestRiskSegments.map((s) => (
              <li key={s.id} className="flex items-center gap-3 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: RISK_COLOR[s.riskLevel] }} />
                <span className="flex-1 truncate text-slate-700">{s.name}</span>
                <span className="font-semibold text-slate-900">{s.riskScore.toFixed(0)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: string;
  accent?: 'green' | 'amber' | 'red';
}) {
  const accentClass =
    accent === 'green' ? 'text-emerald-600'
    : accent === 'amber' ? 'text-amber-600'
    : accent === 'red' ? 'text-red-600'
    : 'text-slate-900';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`mt-2 text-2xl font-bold ${accentClass}`}>{value}</div>
    </div>
  );
}
