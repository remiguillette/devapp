# BeaverKiosk

BeaverKiosk is now powered by an Electron shell, a lightweight Node.js backend, and a React-based launcher interface. The backend serves menu data from the `resources/data` directory, while the Electron renderer renders the dashboard directly from the local `resources/index.html` file.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the Electron shell**

   ```bash
   npm start
   ```

   The startup script launches the Node.js backend on port `5000` and opens the Electron window that hosts the React UI.

3. **Run the backend without Electron (optional)**

   ```bash
   npm run backend
   ```

   This starts the standalone HTTP server defined in `server.js`. The API will be available at `http://127.0.0.1:5000`.

## Project structure

```
├── electron-main.js      # Electron entry point that boots the backend and window
├── server.js             # Reusable Node.js HTTP server with /api/menu endpoint
├── resources/
│   ├── data/             # JSON data consumed by the backend
│   ├── icons/            # Static application icons
│   ├── index.html        # React mount point loaded by Electron
│   ├── js/
│   │   ├── menu.jsx      # React dashboard logic compiled in-browser via Babel
│   │   └── vendor/       # Bundled vendor libraries (Lucide icons)
│   └── styles.css        # UI styling shared by the renderer
└── package.json          # npm metadata and scripts
```

## Configuration

* **Backend port** – Override the `PORT` environment variable to change the port used by the HTTP server and Electron shell.
* **Menu content** – Update `resources/data/menu.json` to manage the tiles shown in the launcher.

## License

This project is licensed under the [MIT License](LICENSE).
