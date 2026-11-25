import { entity, role, text, date, uuid, one } from '@microsoft/rayfin-core';
import { Asset } from './Asset.js';

/** Alert predykcyjny wygenerowany przez model PdM dla danego assetu. */
@entity()
@role('authenticated', '*')
export class Alert {
  @uuid() id!: string;
  @one(() => Asset) asset!: Asset;

  /** 'info' | 'warning' | 'critical' */
  @text({ max: 12 }) severity!: string;
  @text({ max: 60 }) alertType!: string;
  @text({ max: 160 }) title!: string;
  @text({ max: 1000 }) message!: string;
  @text({ max: 1000 }) recommendation!: string;
  /** 'open' | 'ack' | 'resolved' */
  @text({ max: 16 }) status!: string;
  @date() predictedFailureAt!: Date;
  @date() createdAt!: Date;
}
