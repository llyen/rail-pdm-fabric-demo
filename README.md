# Rail PdM Demo

A predictive maintenance demo for a fictional railway line (Kaliniec to Morawin), built as a Microsoft Fabric app with Rayfin. All data in the app is synthetic and generated in the browser.

Polish version: [README.pl.md](README.pl.md).

## What it does

After signing in, the user sees four tabs:

- **Dashboard** with segment risk distribution, asset health, the assets with the shortest remaining useful life (RUL) and the highest-risk segments.
- **Risk map**, an SVG schematic of the route with segments coloured by risk level, assets as points and trains animated along the line.
- **Alerts**, a list of predicted failures with a recommendation. Alerts can be moved between `open`, `ack` and `resolved`.
- **Assets** (track, switches, signalling, bridges) with health score, RUL and a sensor trend chart with warning and critical thresholds.

The "Generate demo data" button seeds stations, route segments, assets, sensor readings, alerts and trains using random values. "Clear" deletes everything. Station names, the line and its geometry are invented. All other values (risk, health, readings, vendors assigned to assets, trains) are random.

## Stack

- React 19, Vite 7, Tailwind CSS 4, TypeScript
- Rayfin (`@microsoft/rayfin-*` packages): auth, data (MSSQL dialect) and static hosting on Microsoft Fabric
- Data model in `rayfin/data/`: `Station`, `RouteSegment`, `Asset`, `SensorReading`, `Alert`, `Train`

## Running locally

Requirements: Node.js 20+, Docker Desktop (for the local Rayfin backend).

```bash
npm ci
npm run rayfin:db      # apply the schema to the local backend
npm run dev:local      # local backend in Docker + Vite on http://localhost:5173
```

With a localhost API URL the app uses email/password sign-in. Stop or reset the local backend with `npm run dev:local:stop`, `npm run dev:local:down` or `npm run dev:local:purge`.

## Deploying to Microsoft Fabric

```bash
npx rayfin login -t <TENANT_ID>
npm run up             # rayfin up: provisions the backend and deploys the static app
```

You need a Fabric workspace you can deploy to. When the API URL is not localhost, the app uses Fabric (Entra ID) sign-in. After the first deployment add the app URL to `allowedRedirectUris` in `rayfin/rayfin.yml` if the CLI has not done it.

## Disclaimer

This is a demo, not a production system. The data is synthetic and does not describe any real infrastructure condition, operator or vendor. Vendors appear only as placeholder labels (Dostawca A to F). The project is not an official Microsoft product.

## License

MIT, see [LICENSE](LICENSE).
