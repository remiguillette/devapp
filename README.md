# BeaverKiosk

BeaverKiosk ships as an Electron application with a dedicated Node.js backend and a Vite-powered React renderer. The backend expo
ses a `/api/menu` endpoint that serves JSON from the `backend/data` directory while the renderer bundles a modern React experienc
e with Lucide icons.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the app in development**

   ```bash
   npm run dev
   ```

   This command starts the Express backend on port `5000`, the Vite dev server on port `5173`, and then boots Electron pointed at
 the dev renderer.

3. **Package the application**

   ```bash
   npm run package
   ```

   Running the packaging script builds the React renderer and creates distributables with `electron-builder`. Output artifacts are
 written to the `release/` directory.

4. **Run the backend in isolation (optional)**

   ```bash
   npm run backend
   ```

   This starts the standalone backend server defined in `backend/server.js`. The API will be available at `http://127.0.0.1:5000`
.

## Project structure

```
├── backend/
│   ├── data/                  # JSON payloads consumed by the backend
│   ├── routes/                # Express route modules
│   └── server.js              # Express server with health check and /api/menu endpoint
├── electron/
│   ├── builder.config.json    # electron-builder configuration
│   ├── icons/                 # Application icons and build resources
│   ├── main.js                # Electron main process entry
│   └── preload.js             # Isolated preload bridge for the renderer
├── src/
│   ├── api/                   # Fetch helpers for backend communication
│   ├── components/            # Reusable React components
│   ├── pages/                 # Top-level React screens
│   ├── styles/                # Global styling
│   ├── App.jsx                # Root React component
│   └── main.jsx               # React entry point used by Vite
├── index.html                 # Vite HTML entry point
├── package.json               # npm metadata, scripts, and dependencies
└── vite.config.js             # Vite configuration for the renderer build
```

## Configuration

- **Backend port** – Override the `PORT` environment variable to change the port used by the backend server and Electron shell.
- **Menu content** – Update `backend/data/menu.json` to manage the tiles shown in the launcher.

## License

This project is licensed under the [MIT License](LICENSE).
