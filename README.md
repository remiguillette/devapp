# BeaverKiosk

BeaverKiosk combines an Electron shell with a TypeScript-powered Node.js service and a lightweight React dashboard. The desktop launcher UI shipped in `resources/` remains unchanged, while the new backend exposes hardware telemetry, IPC helpers, and a parallel web experience at `http://localhost:5000/dashboard`.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the Electron shell**

   ```bash
   npm start
   ```

   The startup script compiles the backend, launches it on port `5000`, and opens the Electron window that hosts the kiosk UI from `resources/index.html`.

3. **Run the backend without Electron (optional)**

   ```bash
   npm run backend
   ```

   This compiles and starts the standalone HTTP server. The API and dashboard will be available at `http://127.0.0.1:5000`.

## Project structure

```
├── electron-main.js            # Electron entry point that boots the backend and window
├── resources/                  # Existing kiosk UI assets (unchanged design)
├── scripts/
│   └── build-react.mjs         # esbuild bundler for the dashboard
├── src/
│   ├── backend/
│   │   ├── ipc/                # IPC server (UNIX socket today, replaceable later)
│   │   ├── services/           # System integrations (battery, Wi-Fi, commands)
│   │   └── server.ts           # Express HTTP server + API wiring
│   └── frontend/
│       └── react/              # Parallel dashboard served at /dashboard
├── dist/                       # Compiled backend + dashboard assets (gitignored)
├── server.js                   # Thin bridge that loads the compiled backend
├── tsconfig.json               # TypeScript configuration for the backend
└── package.json                # npm metadata and scripts
```

## Configuration

* **Backend port** – Override the `PORT` environment variable to change the port used by the HTTP server, Electron shell, and dashboard.
* **Menu content** – Update `resources/data/menu.json` to manage the tiles shown in the launcher.
* **IPC socket** – Set `BEAVERKIOSK_IPC` to override the default `/tmp/beaverkiosk.sock` path.

## License

This project is licensed under the [MIT License](LICENSE).
