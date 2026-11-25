/** Proste narzędzia geo: projekcja lon/lat → współrzędne ekranu SVG. */

export type LonLat = [number, number];

export interface Projector {
  width: number;
  height: number;
  project: (lon: number, lat: number) => { x: number; y: number };
}

export interface Bounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

export function boundsOf(points: LonLat[]): Bounds {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lon, lat] of points) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, maxLon, minLat, maxLat };
}

/**
 * Projekcja equirectangular z korektą szerokości geograficznej, dopasowana do
 * prostokąta `width` x `height` z marginesem `pad` (w px). Zachowuje proporcje.
 */
export function makeProjector(
  bounds: Bounds,
  width: number,
  height: number,
  pad: number
): Projector {
  const meanLat = ((bounds.minLat + bounds.maxLat) / 2) * (Math.PI / 180);
  const kx = Math.cos(meanLat); // kompresja długości geo bliżej biegunów

  const geoW = (bounds.maxLon - bounds.minLon) * kx || 1e-6;
  const geoH = (bounds.maxLat - bounds.minLat) || 1e-6;

  const availW = width - pad * 2;
  const availH = height - pad * 2;
  const scale = Math.min(availW / geoW, availH / geoH);

  const drawW = geoW * scale;
  const drawH = geoH * scale;
  const offsetX = pad + (availW - drawW) / 2;
  const offsetY = pad + (availH - drawH) / 2;

  return {
    width,
    height,
    project(lon: number, lat: number) {
      const x = offsetX + (lon - bounds.minLon) * kx * scale;
      // lat rośnie ku górze → odwracamy oś Y
      const y = offsetY + (bounds.maxLat - lat) * scale;
      return { x, y };
    },
  };
}

/** Długość polilinii (suma odległości euklidesowych w przestrzeni ekranu). */
export function polylineLength(pts: { x: number; y: number }[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

/** Punkt na polilinii dla parametru t ∈ [0,1] (proporcjonalnie do długości). */
export function pointAt(
  pts: { x: number; y: number }[],
  t: number
): { x: number; y: number; angle: number } {
  if (pts.length === 0) return { x: 0, y: 0, angle: 0 };
  if (pts.length === 1) return { ...pts[0], angle: 0 };
  const total = polylineLength(pts);
  const target = Math.max(0, Math.min(1, t)) * total;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + seg >= target || i === pts.length - 1) {
      const local = seg === 0 ? 0 : (target - acc) / seg;
      const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * local;
      const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * local;
      const angle = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
      return { x, y, angle };
    }
    acc += seg;
  }
  return { ...pts[pts.length - 1], angle: 0 };
}
