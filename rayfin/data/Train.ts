import { entity, role, text, int, decimal, uuid } from '@microsoft/rayfin-core';

/** Pociąg poruszający się po trasie (pozycja animowana po stronie klienta). */
@entity()
@role('authenticated', '*')
export class Train {
  @uuid() id!: string;
  @text({ min: 1, max: 80 }) name!: string;
  @text({ max: 20 }) number!: string;
  /** 'EX' | 'RE' | 'cargo' */
  @text({ max: 30 }) category!: string;
  /** 'south' = Kaliniec→Morawin, 'north' = Morawin→Kaliniec */
  @text({ max: 12 }) direction!: string;
  /** 0..1 — postęp wzdłuż trasy (punkt startowy symulacji). */
  @decimal({ precision: 6, scale: 4 }) progress!: number;
  @int() speedKmh!: number;
  @decimal({ precision: 5, scale: 2 }) healthScore!: number;
  /** 'running' | 'dwell' | 'alert' */
  @text({ max: 16 }) status!: string;
}
