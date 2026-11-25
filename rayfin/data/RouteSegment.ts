import { entity, role, text, int, decimal, date, uuid } from '@microsoft/rayfin-core';

/** Odcinek linii między dwiema stacjami — nośnik oceny ryzyka PdM. */
@entity()
@role('authenticated', '*')
export class RouteSegment {
  @uuid() id!: string;
  @int() seq!: number;
  @text({ max: 120 }) fromName!: string;
  @text({ max: 120 }) toName!: string;
  @decimal({ precision: 7, scale: 2 }) kmStart!: number;
  @decimal({ precision: 7, scale: 2 }) kmEnd!: number;
  @decimal({ precision: 7, scale: 2 }) lengthKm!: number;
  @int() maxSpeedKmh!: number;
  @text({ max: 20 }) trackClass!: string;
  /** JSON: tablica punktów [lon, lat] tworzących polilinię odcinka. */
  @text({ max: 4000 }) geometryJson!: string;
  /** 0..100 — im wyżej, tym większe ryzyko awarii infrastruktury. */
  @decimal({ precision: 5, scale: 2 }) riskScore!: number;
  /** 'low' | 'medium' | 'high' | 'critical' */
  @text({ max: 12 }) riskLevel!: string;
  @date() lastMaintenance!: Date;
  @text({ max: 500, optional: true }) notes?: string;
}
