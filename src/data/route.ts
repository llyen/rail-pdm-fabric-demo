/**
 * Fikcyjna linia kolejowa Kaliniec Główny – Morawin Główny.
 * Nazwy stacji, kilometraż i współrzędne są zmyślone na potrzeby demo.
 * km to kilometraż liczony od Kalińca Głównego.
 */

export interface RouteStation {
  seq: number;
  name: string;
  code: string;
  km: number;
  lat: number;
  lon: number;
  isStop: boolean;
}

export const ROUTE_NAME = 'Kaliniec Główny – Morawin Główny (linia demonstracyjna L1)';

export const STATIONS: RouteStation[] = [
  { seq: 0, name: 'Kaliniec Główny', code: 'KAG', km: 0, lat: 52.2288, lon: 15.9970, isStop: true },
  { seq: 1, name: 'Kaliniec Zachodni', code: 'KAZ', km: 4, lat: 52.2197, lon: 16.0342, isStop: true },
  { seq: 2, name: 'Brzeźno Leśne', code: 'BRL', km: 33, lat: 52.1085, lon: 16.3661, isStop: true },
  { seq: 3, name: 'Posterunek Olszak', code: 'POL', km: 42, lat: 52.0500, lon: 16.4700, isStop: false },
  { seq: 4, name: 'Wrzosowo', code: 'WRZ', km: 110, lat: 51.4760, lon: 16.7140, isStop: true },
  { seq: 5, name: 'Jaskrów Południe', code: 'JAP', km: 124, lat: 51.3650, lon: 16.7600, isStop: true },
  { seq: 6, name: 'Modrzanka', code: 'MOD', km: 175, lat: 50.8620, lon: 17.0250, isStop: true },
  { seq: 7, name: 'Posterunek Kamionka', code: 'PKA', km: 210, lat: 50.5900, lon: 17.4800, isStop: false },
  { seq: 8, name: 'Dębnica Górna', code: 'DEG', km: 224, lat: 50.4880, lon: 17.5830, isStop: true },
  { seq: 9, name: 'Sitnowo', code: 'SIT', km: 244, lat: 50.3560, lon: 17.7380, isStop: true },
  { seq: 10, name: 'Rudnik Węzeł', code: 'RUW', km: 258, lat: 50.2410, lon: 17.7270, isStop: true },
  { seq: 11, name: 'Lipowiec Mały', code: 'LIM', km: 273, lat: 50.1600, lon: 17.5320, isStop: true },
  { seq: 12, name: 'Morawin Przedmieście', code: 'MOP', km: 290, lat: 50.0930, lon: 17.1500, isStop: false },
  { seq: 13, name: 'Morawin Główny', code: 'MOG', km: 297, lat: 50.0675, lon: 17.0550, isStop: true },
];

export const TRACK_CLASSES = ['linia dużych prędkości 200 km/h', 'magistrala', 'pierwszorzędna'];
