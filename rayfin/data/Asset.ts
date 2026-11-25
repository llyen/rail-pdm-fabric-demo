import { entity, role, text, int, decimal, date, uuid, one } from '@microsoft/rayfin-core';
import { RouteSegment } from './RouteSegment.js';

/** Monitorowany element infrastruktury: tor, rozjazd, sygnalizacja lub most. */
@entity()
@role('authenticated', '*')
export class Asset {
  @uuid() id!: string;
  @one(() => RouteSegment) segment!: RouteSegment;

  /** 'track' | 'switch' | 'signal' | 'bridge' */
  @text({ max: 20 }) kind!: string;
  @text({ min: 1, max: 120 }) name!: string;
  @text({ max: 40 }) code!: string;
  @decimal({ precision: 7, scale: 2 }) km!: number;
  @decimal({ precision: 9, scale: 6 }) lat!: number;
  @decimal({ precision: 9, scale: 6 }) lon!: number;
  /** 0..100 — kondycja techniczna (100 = idealna). */
  @decimal({ precision: 5, scale: 2 }) healthScore!: number;
  /** Remaining Useful Life — szacowany pozostały czas pracy w dniach. */
  @int() rulDays!: number;
  /** 'ok' | 'watch' | 'warning' | 'critical' */
  @text({ max: 16 }) status!: string;
  @text({ max: 80 }) vendor!: string;
  @date() installedAt!: Date;
  @date() lastInspection!: Date;
}
