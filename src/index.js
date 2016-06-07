import path from 'path';
import HtmlBody from './htmlBody';
import SplashWindow from './splashWindow';

/**
 * Settings object.
 * @typedef {Object} PluginSettings
 * @property {boolean} enabled        - Is splash screen enabled.
 * @property {string}  windowTitle    - title of the window that shows splash screen.
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
        this.settings = settings;
        this.systemEvents = systemEvents;

        this.htmlBody = new HtmlBody(
            log,
            path.join(__dirname, 'splash.html'),
            path.resolve(path.join(__dirname, '..', '..', '..', 'splash.html')),
            ('windowTitle' in settings) ? settings.windowTitle : undefined,
            ('imagePath' in settings) ? settings.imagePath : undefined,
            ('style' in settings) ? settings.style : {}
        );

        this.splashWindow = new SplashWindow(
            log,
            this.htmlBody.getInstallPath(),
            ('windowSettings' in settings) ? settings.windowSettings : {}
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
