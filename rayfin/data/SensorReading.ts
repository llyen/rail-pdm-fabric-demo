import { entity, role, text, decimal, date, uuid, one } from '@microsoft/rayfin-core';
import { Asset } from './Asset.js';

/** Pojedynczy odczyt czujnika dla assetu (szereg czasowy do wykresów trendu). */
@entity()
@role('authenticated', '*')
export class SensorReading {
  @uuid() id!: string;
  @one(() => Asset) asset!: Asset;

  /** 'vibration' | 'temperature' | 'wear' | 'voltage' | 'deflection' | 'geometry' */
  @text({ max: 30 }) metric!: string;
  @decimal({ precision: 10, scale: 3 }) value!: number;
  @text({ max: 12 }) unit!: string;
  @date() recordedAt!: Date;
}
