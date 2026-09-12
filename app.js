const electron = require('electron');
const Positioner = require('electron-positioner');
const { IpcServer } = require('./ipc.js');
const { POSITIONS } = require('./constants.js');

// more useragents here: https://developers.whatismybrowser.com/useragents/explore/operating_platform/smart-tv/
const userAgent = 'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.1 TV Safari/538.1';
const ipcInstance = new IpcServer();
const app = electron.app;

ipcInstance.on('QUIT', (data, socket) => {
  ipcInstance.emit(socket, 'QUIT_HEARD', {});
  app.quit();
  process.exit();
});

app.once('ready', () => {
  electron.session.defaultSession.setUserAgent(userAgent);

  ipcInstance.on('SEND_CONFIG', (data, socket) => {
    const { url, position, width, height, x, y, idleTimeoutSeconds = 180, maxSessionHours = 12 } = data;

    const usingXY = x && y;

    // electron
    const windowOptions = {
      maxHeight: height,
      maxWidth: width,
      resize: false,
      width: width,
      height: height,
      darkTheme: true,
      alwayOnTop: true,
      show: false,
      frame: false,
      zoomFactor: 1.0,
      focusable: false,
      ...(usingXY ? { x, y } : {})
    };

    const screenCastWindow = new electron.BrowserWindow(windowOptions);

    if (!usingXY && POSITIONS[position]) {
      const positioner = new Positioner(screenCastWindow);
      positioner.move(POSITIONS[position]);
    }

    screenCastWindow.loadURL(url);

     // Show window when page is ready
    screenCastWindow.once('ready-to-show', () => {

      // this is messy for autoplay but youtube, due to chrome no longer supports
      // autoplay
      const autoPlayScript = `
        const videoEle = document.getElementsByTagName('video');
        if (!!videoEle && videoEle.length > 1) videoEle[0].play();
      `;

        //
        // THIS MIGHT NEED WORK
        //
        // maybe something like this:
        //
        // win.webContents.on('console-message', () => {
        //  // do the shit to cloes the window like above
        // })
        //
        // create a specific message or something to know that shit's done, or listen to whatever
        // https://electronjs.org/docs/api/web-contents#event-console-message
        //
        // ipc.server.on('screenCastWindow_config', (data, socket) => {
        //   const { extraScript, closeOnEnd } = data;
        //   const doScript = `${extraScript} ${closeOnEnd ? autoCloseScript : ''}`;
        //   screenCastWindow.webContents.executeJavaScript(doScript, true);

        //   ipc.server.emit(socket, 'quit');
        //   app.quit();
        //   process.exit();
        // });

        // ipc.server.broadcast('screenCastWindow_shown', { show: true });

      const autoCloseScript = `
        let videoEleStop;

       // consistently check the DOM for the video element
        const interval = setInterval(() => {
          videoEleStop = document.getElementsByTagName('video')[0];

         // if the video element exists add an event listener to it and stop the interval
          if (videoEleStop) {
            videoEleStop.addEventListener('ended', (event) => {
              console.log("mmm-screencast.exited");
            });
            clearInterval(interval);
          }
        }, 1000);
      `;

    const idleTimeoutScript = `
      (function() {
        let lastTime = -1;
        let stalledSince = null;
        const IDLE_TIMEOUT_MS = ${idleTimeoutSeconds * 1000};
        setInterval(() => {
          const video = document.getElementsByTagName('video')[0];
          if (!video) return;
          const stalled = video.paused || video.currentTime === lastTime;
          lastTime = video.currentTime;
          if (stalled) {
            if (stalledSince === null) stalledSince = Date.now();
            if (Date.now() - stalledSince >= IDLE_TIMEOUT_MS) {
              console.log("mmm-screencast.exited");
            }
          } else {
            stalledSince = null;
          }
        }, 5000);
      })();
    `;

      screenCastWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        if (message === "mmm-screencast.exited") {
           ipcInstance.server.emit(socket, 'quit');
           app.quit();
        }
      });

      screenCastWindow.show();
      // screenCastWindow.webContents.openDevTools();
      screenCastWindow.webContents.executeJavaScript(autoPlayScript, true);
      screenCastWindow.webContents.executeJavaScript(autoCloseScript, true);
      screenCastWindow.webContents.executeJavaScript(idleTimeoutScript, true);
    screenCastWindow.webContents.on('did-navigate', () => {
      screenCastWindow.webContents.executeJavaScript(autoCloseScript, true);
      screenCastWindow.webContents.executeJavaScript(idleTimeoutScript, true);
    });
      ipcInstance.emit(socket, 'APP_READY', {});

      // Hard cap: close after MAX_SESSION_MS regardless of playback activity.
      // Covers YouTube autoplay chains that keep advancing forever after the
      // sender disconnects - the idle-timeout above only catches paused/stalled video.
      const MAX_SESSION_MS = maxSessionHours * 60 * 60 * 1000;
      setTimeout(() => {
        console.log('MMM-Screencast: max session length reached, closing');
        ipcInstance.server.emit(socket, 'quit');
        app.quit();
      }, MAX_SESSION_MS);
    });
  });
});
