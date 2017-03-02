import fs from 'fs';
import path from 'path';

/**
 * Represents the HTML body of the window that should display the splash screen.
 * @class
 */
export default class HtmlBody {
    /**
     * @param {Object} log          - logger instance
     * @param {string} templatePath - path to the template
     * @param {string} appPath      - application path
     * @param {string} installPath      - generated splash.html path
     * @param {string} title        - title of the html
     * @param {string} imagePath    - path to the image
     * @param {Object} style        - styles to use instead of the defaults
     */
    constructor(log, templatePath, appPath, installPath, title = '', imagePath = 'splashScreen.png',
                style = {}) {
        this.log = log;
        this.templatePath = templatePath;
        this.installPath = path.join(installPath, 'splash.html');
        this.title = title;
        this.imagePath = imagePath;
        this.style = style;

        let backgroundImageUrl = encodeURI(
            path.join(appPath, 'desktop.asar', 'assets', this.imagePath).replace(/\\/gm, '/'));

        if (process.env.ELECTRON_ENV === 'test' && process.env.SPLASH_SCREEN_TEST) {
            backgroundImageUrl = encodeURI(
                path.join(appPath, 'assets', this.imagePath).replace(/\\/gm, '/'));
        }

        this.defaultStyle = {
            'background-image': `url('file:///${backgroundImageUrl}')`,
            'background-size': 'contain',
            'background-repeat': 'no-repeat',
            'background-attachment': 'fixed',
            'background-position': 'center center',
            'background-color': 'rgba(0, 0, 0, 0)'
        };

        // Apply custom style.
        Object.keys(this.style).forEach((rule) => {
            this.defaultStyle[rule] = this.style[rule];
        });
    }

    /**
     * Returns the css string from the style object.
     * @returns {string}
     */
    getStylesAsString() {
        return Object.keys(this.defaultStyle).reduce(
            (str, rule) => `${str}\n${rule}: ${this.defaultStyle[rule]};`, ''
        );
    }

    /**
     * Prepares the splash screen html.
     */
    prepare() {
        let splashHTML;
        this.log.info('preparing splash screen.');

        splashHTML = fs.readFileSync(this.templatePath, 'UTF-8');
        splashHTML = splashHTML.replace('{title}', this.title);
        splashHTML = splashHTML.replace('{style}', this.getStylesAsString());
        fs.writeFileSync(this.installPath, splashHTML);

        this.log.info('splash screen prepared.');
    }

    /**
     * Install path getter.
     * @returns {string}
     */
    getInstallPath() {
        return this.installPath;
    }
}
