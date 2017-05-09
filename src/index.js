/* eslint-disable no-param-reassign, no-underscore-dangle */
import path from 'path';
import { app } from 'electron';
import HtmlBody from './htmlBody';
import SplashWindow from './splashWindow';

/**
 * Settings object.
 * @typedef {Object} PluginSettings
 * @property {boolean} enabled                  - is splash screen enabled
 * @property {string}  windowTitle              - title of the window that shows splash screen -
 *                                                it defaults to the `name` from settings.json
 * @property {string}  imagePath                - path to the image relative to the .desktop dir
 * @property {Object}  style                    - style of the html body that displays the image
 * @property {Object}  windowSettings           - settings passed to BrowserWindow
 * @property {boolean} clickThrough             - enables window click-through [true by default]
 * @property {boolean} updateScreenOnDesktopHCP - true by default, shows update screen after app
 *                                                restart triggered by desktop HCP update, otherwise
 *                                                normal splash screen will be used
 * @property {boolean} updateScreen             - false by default, enables hot code push update
 *                                                screen
 * @property {Object}  updateScreenSettings     - object in which you can override `windowTitle`,
 *                                                `imagePath`, `style`, `windowSettings`,
 *                                                `clickThrough` for `style` and `windowSettings`
 *                                                you can set `append` fields to true if you want
 *                                                to merge the settings and append/override them
 * @property {boolean} debug                    - enables devTools, makes the window remain open,
 *                                                sets `resizable` and `alwaysOnTop` to false
 */

/**
 * Implements a simple splash screen for Meteor Desktop.
 *
 * @class
 */
export default class SplashScreen {

    /**
     * @param {Object} log              - Winston logger
     * @param {Object} appSettings      - settings.json object
     * @param {Object} eventsBus        - event emitter for listening or emitting events on the
     *                                    desktop side
     * @param {PluginSettings} settings - plugin settings
     */
    constructor({ log, appSettings, eventsBus, settings }) {
        if (process.env.METEOR_DESKTOP_NO_SPLASH_SCREEN ||
            ('enabled' in settings && !settings.enabled)) return;

        this.log = log;
        this.eventsBus = eventsBus;

        if (!('updateScreenOnDesktopHCP' in settings)) {
            settings.updateScreenOnDesktopHCP = true;
        }

        this.updateScreenOnStart = ~process.argv.indexOf('--hcp') &&
            settings.updateScreenOnDesktopHCP &&
            settings.updateScreen;

        const installPath = app.getPath('userData');
        const appPath = app.getAppPath();

        const resolvedAppPath = ~appPath.indexOf('asar') ?
            path.resolve(path.join(appPath, '..')) : appPath;

        if (!settings.updateScreenSettings || typeof settings.updateScreenSettings !== 'object') {
            settings.updateScreenSettings = {};
        }

        const splashScreenHtmlBodyOptions = {
            log: this.log.getLoggerFor('splashScreenHtml'),
            // TODO: make this path configurable and absolute
            appPath: resolvedAppPath,
            installPath: path.join(installPath, 'splash.html'),
            title: ('windowTitle' in settings) ? settings.windowTitle : appSettings.name,
            imagePath: ('imagePath' in settings) ? settings.imagePath : undefined,
            style: ('style' in settings) ? settings.style : {}
        };

        const windowSettings = ('windowSettings' in settings) ? settings.windowSettings : {};
        windowSettings.clickThrough = ('clickThrough' in settings) ? settings.clickThrough : true;

        if ('window' in appSettings && 'icon' in appSettings.window) {
            windowSettings.icon = appSettings.window.icon;
        }
        settings.windowSettings = windowSettings;

        this.splashScreenHtmlBody = new HtmlBody(splashScreenHtmlBodyOptions);

        const debug = process.env.METEOR_DESKTOP_DEBUG ? true : settings.debug;

        this.splashWindow = new SplashWindow(
            this.log.getLoggerFor('splashWindow'),
            this.splashScreenHtmlBody.getInstallPath(),
            windowSettings,
            debug
        );

        this.updateScreenEnabled = settings.updateScreen &&
            !process.env.METEOR_DESKTOP_NO_UPDATE_SCREEN;

        if (this.updateScreenEnabled) {
            SplashScreen.mergeOptions(settings, 'style', 'windowSettings');

            const updateScreenHtmlBodyOptions = {
                log: this.log.getLoggerFor('updateScreenHtml'),
                appPath: resolvedAppPath,
                installPath: path.join(installPath, 'update.html'),
                title: ('windowTitle' in settings.updateScreenSettings) ?
                    settings.updateScreenSettings.windowTitle : splashScreenHtmlBodyOptions.title,
                imagePath: ('imagePath' in settings.updateScreenSettings)
                    ? settings.updateScreenSettings.imagePath : 'updateScreen.png',
                style: settings.updateScreenSettings.style
            };

            this.updateSreenHtmlBody = new HtmlBody(updateScreenHtmlBodyOptions);

            settings.updateScreenSettings.windowSettings.clickThrough =
                ('clickThrough' in settings.updateScreenSettings) ?
                    settings.updateScreenSettings.clickThrough : windowSettings.clickThrough;

            this.updateWindow = new SplashWindow(
                this.log.getLoggerFor('updateWindow'),
                this.updateSreenHtmlBody.getInstallPath(),
                settings.updateScreenSettings.windowSettings,
                debug
            );
        }

        this.registerToEvents(settings);
    }

    /**
     * Merges options objects for splash and update screens.
     * @param {PluginSettings} settings - plugin settings object
     * @param {string[]}       fields   - fields to merge
     */
    static mergeOptions(settings, ...fields) {
        fields.forEach((field) => {
            if (field in settings.updateScreenSettings) {
                if (settings.updateScreenSettings[field].append === true && settings[field]) {
                    Object.assign(
                        settings.updateScreenSettings[field],
                        settings[field],
                        settings.updateScreenSettings[field]
                    );
                }
            } else {
                settings.updateScreenSettings[field] = settings[field];
            }
        });
    }

    /**
     * Registers listeners on crucial events emitted on the events bus.
     */
    registerToEvents(settings) {
        this.eventsBus.on('windowCreated', (window) => {
            this.window = window;
        });

        // beforeModulesLoad is invoked directly before the skeleton starts loading modules.
        this.eventsBus.on('beforeModulesLoad', () => {
            if (!this.updateScreenOnStart) {
                this.splashScreenHtmlBody.prepare();
                if (!settings._disableSplash) {
                    this.splashWindow.show();
                }
            } else {
                this.updateSreenHtmlBody.prepare();
                if (!settings._disableSplash) {
                    this.updateWindow.show();
                }
            }
        });

        if (this.updateScreenEnabled) {
            this.eventsBus.on('beforeModulesLoad', () => {
                this.updateSreenHtmlBody.prepare();
            });
            this.eventsBus.on('beforeReload', () => {
                this.updateWindow.show();
                this.window.hide();
            });
            this.eventsBus.on('startupDidComplete', () => {
                this.window.show();
                this.updateWindow.close.call(this.updateWindow);
                this.window.focus();
            });
        }

        // beforeLoadFinish is emitted just before the app window is shown, so it is the best time
        // to hide the splash screen.
        this.eventsBus.on('beforeLoadFinish', () => {
            if (!this.updateScreenOnStart) {
                this.splashWindow.close.call(this.splashWindow);
            } else {
                this.updateWindow.close.call(this.updateWindow);
            }
        });

        // We need to close the splash screen in case something went wrong.
        this.eventsBus.on('startupFailed', this.handleFailure.bind(this));
        this.eventsBus.on('unhandledException', this.handleFailure.bind(this));
    }

    /**
     * Closes the splash and update screens if they are open.
     */
    handleFailure() {
        this.splashWindow.close.bind(this.splashWindow);
        this.updateWindow.close.bind(this.updateWindow);
        this.showWindowIfPossible();
    }

    /**
     * Shows the main window in case it is hidden.
     */
    showWindowIfPossible() {
        try {
            if (this.window && !this.window.isVisible()) {
                this.window.show();
            }
        } catch (e) {
            // No harm...
        }
    }
}
