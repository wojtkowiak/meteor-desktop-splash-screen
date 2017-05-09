import { BrowserWindow } from 'electron';

/**
 * Represents the window that displays the splash screen.
 */
export default class SplashWindow {

    /**
     * @param {Object}  log            - logger instance
     * @param {string}  bodyPath       - path to the html to display
     * @param {Object}  windowSettings - window settings to use
     * @param {boolean} debug          - enables devTools, makes the window remain open,
     *                                   sets `resizable` and `alwaysOnTop` to false
     */
    constructor(log, bodyPath, windowSettings, debug = false) {
        this.log = log;
        this.opened = false;
        this.debug = debug;
        this.bodyPath = bodyPath;
        this.windowSettings = {
            width: 1024,
            height: 768,
            alwaysOnTop: true,
            frame: false,
            transparent: true,
            resizable: false,
            show: false,
            webPreferences: { nodeIntegration: false }
        };

        // Apply custom window settings.
        Object.keys(windowSettings).forEach((rule) => {
            this.windowSettings[rule] = windowSettings[rule];
        });

        if (debug) {
            Object.assign(this.windowSettings, { alwaysOnTop: false, resizable: false });
        }

        // TODO: show the window on the same screen the app is.
    }

    /**
     * Opens the window with splash screen html.
     */
    show() {
        this.log.info(`displaying splash screen from file://${this.bodyPath}`);

        this.splashWindow = new BrowserWindow(this.windowSettings);
        this.splashWindow.once('ready-to-show', () => {
            if (this.windowSettings.clickThrough) {
                this.log.verbose('enabling click through');
                this.splashWindow.setIgnoreMouseEvents(true); // Enable click-through over window.
            }
            this.splashWindow.show();
            this.splashWindow.focus();
            this.opened = true;
        });

        this.splashWindow.on('closed', () => {
            this.splashWindow = null;
            this.opened = false;
        });

        if (!this.debug) {
            // Ensure dev tools will not appear.
            this.splashWindow.webContents.closeDevTools();
        } else {
            this.splashWindow.webContents.openDevTools({ mode: 'undocked' });
        }

        this.splashWindow.loadURL(`file://${this.bodyPath}`);
    }

    /**
     * Closes the window.
     */
    close() {
        if (this.opened && !this.debug) {
            this.splashWindow.close();
        }
    }
}
