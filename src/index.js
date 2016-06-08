import path from 'path';
import HtmlBody from './htmlBody';
import SplashWindow from './splashWindow';

/**
 * Settings object.
 * @typedef {Object} PluginSettings
 * @property {boolean} enabled        - Is splash screen enabled.
 * @property {string}  windowTitle    - Title of the window that shows splash screen. It defaults
 *                                      to the `name` from settings.json.
 * @property {string}  imagePath      - Path to the image relative to the .desktop dir.
 * @property {Object}  style          - Style of the html body that displays the image.
 * @property {Object}  windowSettings - Settings passed to BrowserWindow.
 * @property {Object}  module         - The Module class from Meteor Desktop.
 */

/**
 * Implements a simple splash screen for Meteor Desktop.
 *
 * @param {Object} log              - Winston logger instance.
 * @param {Object} app              - Reference to the Electron app.
 * @param {Object} appSettings      - settings.json object.
 * @param {Object} systemEvents     - Event emitter for listening or emitting events on the desktop
 *                                    side.
 * @param {Object} modules          - Reference to all loaded modules.
 * @param {PluginSettings} settings - Plugin settings.
 * @constructor
 */
class SplashScreen {

    constructor(log, app, appSettings, systemEvents, modules, settings, module) {
        if ('enabled' in settings && !settings.enabled) return;

        this.log = log;
        this.htmlBody = new HtmlBody(
            log,
            path.join(__dirname, 'splash.html'),
            path.resolve(path.join(__dirname, '..', '..', '..', 'splash.html')),
            ('windowTitle' in settings) ? settings.windowTitle : appSettings.name,
            ('imagePath' in settings) ? settings.imagePath : undefined,
            ('style' in settings) ? settings.style : {}
        );

        const windowSettings = ('windowSettings' in settings) ? settings.windowSettings : {};

        if ('window' in appSettings && 'icon' in appSettings.window) {
            windowSettings.icon = appSettings.window.icon;
        }

        this.splashWindow = new SplashWindow(
            log,
            this.htmlBody.getInstallPath(),
            windowSettings
        );

        this.registerToEvents();
    }

    registerToEvents() {
        this.systemEvents.on('beforeInitialization', () => {
            this.htmlBody.prepare();
            this.splashWindow.show();
        });

        this.systemEvents.on('beforeLoadingFinished',
            this.splashWindow.close.bind(this.splashWindow));
        this.systemEvents.on('startupFailed', this.splashWindow.close.bind(this.splashWindow));
        this.systemEvents.on('unhandledException', this.splashWindow.close.bind(this.splashWindow));
    }
}

module.exports = SplashScreen;
