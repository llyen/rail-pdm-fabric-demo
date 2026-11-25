import { RayfinClient } from '@microsoft/rayfin-client';

import type { RailPdMSchema } from '../../rayfin/data/schema';

export interface RayfinClientConfig {
  baseUrl: string;
  publishableKey: string;
  functionsBaseUrl?: string;
  localDev: boolean;
}

let client: RayfinClient<RailPdMSchema> | null = null;
let localDev = false;

export function initRayfinClient(
  config: RayfinClientConfig
): RayfinClient<RailPdMSchema> {
  if (client) {
    throw new Error('Rayfin client is already initialized.');
  }
  client = new RayfinClient<RailPdMSchema>({
    baseUrl: config.baseUrl,
    publishableKey: config.publishableKey,
    functionsBaseUrl: config.functionsBaseUrl,
    useProxy: false,
    authStorage: true,
  });
  localDev = config.localDev;
  return client;
}

export function getRayfinClient(): RayfinClient<RailPdMSchema> {
  if (!client) {
    throw new Error(
      'Rayfin client not initialized. Call bootstrapAuth() first.'
    );
  }
  return client;
}

export function isLocalBackend(): boolean {
  return localDev;
}
