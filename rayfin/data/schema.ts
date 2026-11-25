import { Station } from './Station.js';
import { RouteSegment } from './RouteSegment.js';
import { Asset } from './Asset.js';
import { SensorReading } from './SensorReading.js';
import { Alert } from './Alert.js';
import { Train } from './Train.js';

export type RailPdMSchema = {
  Station: Station;
  RouteSegment: RouteSegment;
  Asset: Asset;
  SensorReading: SensorReading;
  Alert: Alert;
  Train: Train;
};

export const schema = [Station, RouteSegment, Asset, SensorReading, Alert, Train];
