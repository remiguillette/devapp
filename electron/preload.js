const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('beaver', {
  version: process.versions?.electron,
});
