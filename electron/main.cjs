const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
app.setName('推小球闯关');
// A stable writable profile shared by installed and portable editions.
const profile = app.commandLine.getSwitchValue('user-data-dir');
app.setPath('userData', profile || path.join(app.getPath('appData'), 'Ballgame'));
function createWindow() {
  const page = path.join(__dirname, '../dist-desktop/index.html');
  const localURL = pathToFileURL(page).href;
  const win = new BrowserWindow({
    width: 1280, height: 720, useContentSize: true, title: '推小球闯关',
    backgroundColor: '#eee6e3', icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true },
  });
  win.webContents.on('page-title-updated', event => event.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== localURL) event.preventDefault();
  });
  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.alt && input.key === 'Enter') {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
    } else if (input.key === 'Escape' && win.isFullScreen()) {
      event.preventDefault();
      win.setFullScreen(false);
    }
  });
  win.loadFile(page);
  // Keep the desktop chrome title stable while preserving the web page's own title.
  win.setTitle('推小球闯关');
}
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] },
    (_details, callback) => callback({ cancel: true }),
  );
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
