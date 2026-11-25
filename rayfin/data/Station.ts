import { entity, role, text, int, decimal, uuid } from '@microsoft/rayfin-core';

/** Stacja lub punkt charakterystyczny na fikcyjnej linii Kaliniec–Morawin. */
@entity()
@role('authenticated', '*')
export class Station {
  @uuid() id!: string;
  @int() seq!: number;
  @text({ min: 1, max: 120 }) name!: string;
  @text({ max: 20 }) code!: string;
  @decimal({ precision: 7, scale: 2 }) km!: number;
  @decimal({ precision: 9, scale: 6 }) lat!: number;
  @decimal({ precision: 9, scale: 6 }) lon!: number;
  /** 1 = stacja postojowa, 0 = punkt trasy */
  @int() isStop!: number;
}
