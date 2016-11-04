import { BrowserWindow } from 'electron';

/**
 * Represents the window that displays the splash screen.
 */
export default class SplashWindow {

    /**
     * @param {Object} log            - logger instance
     * @param {string} bodyPath       - path to the html to display
     * @param {Object} windowSettings - window settings to use
     */
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

        // Apply custom window settings.
        Object.keys(windowSettings).forEach((rule) => {
            this.windowSettings[rule] = windowSettings[rule];
        });
    }

    /**
     * Opens the window with splash screen html.
     */
    show() {
        this.log.info(`displaying splash screen from file://${this.bodyPath}`);

        this.splashWindow = new BrowserWindow(this.windowSettings);
        this.splashWindow.focus();

        this.opened = true;
        this.splashWindow.on('closed', () => {
            this.splashWindow = null;
            this.opened = false;
        });
        // Ensure dev tools will not appear.
        this.splashWindow.webContents.closeDevTools();

        this.splashWindow.loadURL(`file://${this.bodyPath}`);
    }

    /**
     * Closes the window.
     */
    close() {
        if (this.opened) {
            this.splashWindow.close();
        }
    }
}
