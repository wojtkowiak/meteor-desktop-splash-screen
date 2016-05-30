/* eslint-disable no-unused-vars */
import path from 'path';
import HtmlBody from './htmlBody';
import SplashWindow from './splashWindow';

/**
 * Settings object.
 * @typedef {Object} PluginSettings
 * @property {boolean} enabled        - is splash screen enabled
 * @property {string}  windowTitle    - title of the window that shows splash screen - it defaults
 *                                      to the `name` from settings.json
 * @property {string}  imagePath      - path to the image relative to the .desktop dir
 * @property {Object}  style          - style of the html body that displays the image
 * @property {Object}  windowSettings - settings passed to BrowserWindow
 * @property {Object}  module         - the Module class from Meteor Desktop
 */

/**
 * Implements a simple splash screen for Meteor Desktop.
 *
 * @class
 */
export default class SplashScreen {

    /**
     * @param {Object} log              - Winston logger
     * @param {Object} app              - reference to the Electron app
     * @param {Object} appSettings      - settings.json object
     * @param {Object} eventsBus        - event emitter for listening or emitting events on the
     *                                    desktop side
     * @param {Object} modules          - reference to all loaded modules
     * @param {PluginSettings} settings - module settings
     * @param {Object} Module           - reference to Module class
     */
    constructor(log, app, appSettings, eventsBus, modules, settings, Module) {
        if (process.env.METEOR_DESKTOP_NO_SPLASH_SCREEN ||
            ('enabled' in settings && !settings.enabled)) return;

        const appPath = app.getAppPath();

        const installPath = ~appPath.indexOf('asar') ?
            path.resolve(path.join(appPath, '..')) : appPath;

        this.eventsBus = eventsBus;

        this.log = log.loggers.get('meteor-desktop-splash-screen');
        this.htmlBody = new HtmlBody(
            this.log.getLoggerFor('html'),
            path.join(__dirname, 'splash.html'),
            // TODO: make this path configurable and absolute
            installPath,
            ('windowTitle' in settings) ? settings.windowTitle : appSettings.name,
            ('imagePath' in settings) ? settings.imagePath : undefined,
            ('style' in settings) ? settings.style : {}
        );

        const windowSettings = ('windowSettings' in settings) ? settings.windowSettings : {};

        if ('window' in appSettings && 'icon' in appSettings.window) {
            windowSettings.icon = appSettings.window.icon;
        }

        this.splashWindow = new SplashWindow(
            this.log.getLoggerFor('splashWindow'),
            this.htmlBody.getInstallPath(),
            windowSettings
        );

        this.registerToEvents();
    }

    /**
     * Registers listeners on crucial events emitted on the events bus.
     */
    registerToEvents() {
        // beforeModulesLoad is invoked directly before the skeleton starts loading modules.
        this.eventsBus.on('beforeModulesLoad', () => {
            this.htmlBody.prepare();
            this.splashWindow.show();
        });

        // beforeLoadFinish is emitted just before the app window is shown, so it is the best time
        // to hide the splashscreen.
        this.eventsBus.on('beforeLoadFinish',
            this.splashWindow.close.bind(this.splashWindow));

        // We need to close the splash screen in case something went wrong.
        this.eventsBus.on('startupFailed', this.splashWindow.close.bind(this.splashWindow));
        this.eventsBus.on('unhandledException', this.splashWindow.close.bind(this.splashWindow));
    }
}
