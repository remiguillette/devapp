const path = require('node:path');
const fs = require('node:fs/promises');
const express = require('express');

const VALID_ACCENTS = new Set(['amber', 'violet', 'cyan', 'red', 'green']);

function resolveAccent(value) {
  if (typeof value === 'string' && VALID_ACCENTS.has(value)) {
    return value;
  }

  return 'amber';
}

function mapAppDefinition(app) {
  const name = typeof app?.name === 'string' ? app.name.trim() : '';

  if (!name) {
    return null;
  }

  const iconName = typeof app.icon === 'string' ? app.icon : undefined;

  return {
    name,
    accent: resolveAccent(app.accent),
    icon: iconName,
  };
}

function createMenuRouter({ dataDir }) {
  if (!dataDir) {
    throw new Error('dataDir is required to initialise the menu router.');
  }

  const router = express.Router();
  const menuPath = path.join(dataDir, 'menu.json');

  router.head('/', (_req, res) => {
    res.status(200).end();
  });

  router.get('/', async (_req, res, next) => {
    try {
      const raw = await fs.readFile(menuPath, 'utf8');
      const parsed = JSON.parse(raw);
      const apps = Array.isArray(parsed?.apps)
        ? parsed.apps.map(mapAppDefinition).filter(Boolean)
        : [];

      res.status(200).json({ apps });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ message: 'Menu configuration not found.' });
        return;
      }

      if (error instanceof SyntaxError) {
        res.status(500).json({ message: 'Menu configuration is invalid JSON.' });
        return;
      }

      next(error);
    }
  });

  return router;
}

module.exports = {
  createMenuRouter,
};
