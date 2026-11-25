import type { AssetKind, AssetStatus, RiskLevel, AlertSeverity } from '@/services/railService';

export const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: 'niskie',
  medium: 'średnie',
  high: 'wysokie',
  critical: 'krytyczne',
};

export const STATUS_COLOR: Record<AssetStatus, string> = {
  ok: '#22c55e',
  watch: '#eab308',
  warning: '#f97316',
  critical: '#ef4444',
};

export const STATUS_LABEL: Record<AssetStatus, string> = {
  ok: 'sprawny',
  watch: 'obserwacja',
  warning: 'ostrzeżenie',
  critical: 'krytyczny',
};

export const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info: '#3b82f6',
  warning: '#f97316',
  critical: '#ef4444',
};

export const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: 'info',
  warning: 'ostrzeżenie',
  critical: 'krytyczny',
};

export const KIND_ICON: Record<AssetKind, string> = {
  track: '🛤️',
  switch: '🔀',
  signal: '🚦',
  bridge: '🌉',
};

export const CATEGORY_COLOR: Record<string, string> = {
  EX: '#7c3aed',
  RE: '#0891b2',
  cargo: '#64748b',
};
