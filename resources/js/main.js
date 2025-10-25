(function () {
  if (typeof window === 'undefined') {
    return;
  }

  function resolveAppInfo() {
    return {
      id: typeof NL_APPID !== 'undefined' ? NL_APPID : 'unknown-app',
      port: typeof NL_PORT !== 'undefined' ? NL_PORT : 0,
      os: typeof NL_OS !== 'undefined' ? NL_OS : 'Unknown OS',
      version: typeof NL_VERSION !== 'undefined' ? NL_VERSION : '0.0.0',
      clientVersion:
        typeof NL_CVERSION !== 'undefined' ? NL_CVERSION : '0.0.0',
    };
  }

  function createFallbackBridge() {
    return {
      getAppInfo: resolveAppInfo,
      openDocs: function () {
        window.open('https://neutralino.js.org/docs', '_blank');
      },
      openTutorial: function () {
        window.open('https://www.youtube.com/c/CodeZri', '_blank');
      },
      onTrayEvent: function () {
        return function () {};
      },
      checkForUpdates: function () {
        return Promise.resolve(resolveAppInfo().version);
      },
      sendLog: function () {},
    };
  }

  if (typeof Neutralino === 'undefined') {
    window.dashboardBridge = createFallbackBridge();
    return;
  }

  var trayListeners = new Set();

  function setTray() {
    if (typeof NL_MODE !== 'undefined' && NL_MODE !== 'window') {
      console.log('INFO: Tray menu is only available in the window mode.');
      return;
    }

    var tray = {
      icon: '/resources/icons/trayIcon.png',
      menuItems: [
        { id: 'VERSION', text: 'Get version' },
        { id: 'SEP', text: '-' },
        { id: 'QUIT', text: 'Quit' },
      ],
    };

    Neutralino.os.setTray(tray);
  }

  function notifyTrayListeners(id) {
    var eventSnapshot = { id: id, timestamp: Date.now() };
    trayListeners.forEach(function (listener) {
      try {
        listener(eventSnapshot);
      } catch (error) {
        console.error('Tray listener failed', error);
      }
    });
  }

  function onTrayMenuItemClicked(event) {
    var detail = event && event.detail ? event.detail : { id: 'UNKNOWN' };

    switch (detail.id) {
      case 'VERSION':
        Neutralino.os.showMessageBox(
          'Version information',
          'Neutralinojs server: v' +
            NL_VERSION +
            ' | Neutralinojs client: v' +
            NL_CVERSION
        );
        break;
      case 'QUIT':
        Neutralino.app.exit();
        break;
    }

    notifyTrayListeners(detail.id);
  }

  function onWindowClose() {
    Neutralino.app.exit();
  }

  Neutralino.init();
  Neutralino.events.on('trayMenuItemClicked', onTrayMenuItemClicked);
  Neutralino.events.on('windowClose', onWindowClose);
  Neutralino.events.on('ready', function () {
    (async function () {
      try {
        var commandPromise = Neutralino.os.execCommand('node server.js');
        console.log('Node backend started on port 5000');
        await commandPromise;
      } catch (error) {
        console.error('Failed to start Node backend', error);
      }
    })();
  });

  if (typeof NL_OS !== 'undefined' && NL_OS !== 'Darwin') {
    setTray();
  }

  window.dashboardBridge = {
    getAppInfo: resolveAppInfo,
    openDocs: function () {
      Neutralino.os.open('https://neutralino.js.org/docs');
    },
    openTutorial: function () {
      Neutralino.os.open('https://www.youtube.com/c/CodeZri');
    },
    onTrayEvent: function (listener) {
      if (typeof listener !== 'function') {
        return function () {};
      }
      trayListeners.add(listener);
      return function () {
        trayListeners.delete(listener);
      };
    },
    checkForUpdates: function () {
      return Neutralino.app
        .getConfig()
        .then(function (config) {
          if (config && config.version) {
            return config.version;
          }
          return resolveAppInfo().version;
        })
        .catch(function () {
          return resolveAppInfo().version;
        });
    },
    sendLog: function (message) {
      if (
        Neutralino.debug &&
        typeof Neutralino.debug.log === 'function' &&
        typeof message === 'string'
      ) {
        try {
          Neutralino.debug.log(message);
        } catch (error) {
          console.error('Unable to write to Neutralino log', error);
        }
      }
    },
  };
})();
