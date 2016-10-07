import { BrowserWindow } from 'electron';

export default class SplashWindow {

    constructor(log, bodyPath, windowSettings) {
        this.log = log;
        this.opened = false;
        this.bodyPath = bodyPath;
        this.windowSettings = {
            width: 1024,
            height: 768,
            alwaysOnTop: true,
            frame: false,
            transparent: true,
            resizable: false,
            center: true,
            webPreferences: { nodeIntegration: false }
        };

        Object.keys(windowSettings).forEach((rule) => {
            this.windowSettings[rule] = windowSettings[rule];
        });
    }

    show() {
        this.log.info(`Displaying splash screen from file://${this.bodyPath}`);

        this.splashWindow = new BrowserWindow(this.windowSettings);
        this.splashWindow.focus();

        this.opened = true;

        this.splashWindow.on('closed', () => {
            this.splashWindow = null;
            this.opened = false;
        });
        this.splashWindow.webContents.closeDevTools();

        this.splashWindow.loadURL(`file://${this.bodyPath}`);
    }

    close() {
        if (this.opened) {
            this.splashWindow.close();
        }
    }
}
