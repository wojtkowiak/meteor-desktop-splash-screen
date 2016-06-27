import fs from 'fs';
import path from 'path';

/**
 * Represents the HTML body of the window that should display the splash screen.
 */
export default class HtmlBody {
    /**
     * @param {Object} log          - Logger instance.
     * @param {string} templatePath - Path to the template.
     * @param {string} installPath  - Installation path.
     * @param {string} title        - Title of the html.
     * @param {string} imagePath    - Path to the image.
     * @param {Object} style        - Styles to use instead of the defaults.
     */
    constructor(log, templatePath, installPath, title = '', imagePath = 'splashScreen.png',
                style = {}) {
        this.log = log;
        this.templatePath = templatePath;
        this.installPath = path.join(installPath, 'splash.html');
        this.title = title;
        this.imagePath = imagePath;
        this.style = style;

        let backgroundImageUrl = encodeURI(
            path.join(installPath, 'desktop.asar', 'assets', this.imagePath).replace(/\\/gm, '/'));

        if (process.env.ELECTRON_ENV === 'test') {
            backgroundImageUrl = encodeURI(
                path.join(installPath, 'assets', this.imagePath).replace(/\\/gm, '/'));
        }

        this.defaultStyle = {
            'background-image': `url(file:///${backgroundImageUrl})`,
            'background-size': 'contain',
            'background-repeat': 'no-repeat',
            'background-attachment': 'fixed',
            'background-position': 'center center',
            'background-color': 'rgba(0, 0, 0, 0)'
        };

        Object.keys(this.style).forEach((rule) => {
            this.defaultStyle[rule] = this.style[rule];
        });
    }

    getStylesAsString() {
        return Object.keys(this.defaultStyle).reduce(
            (str, rule) => `${str}\n${rule}: ${this.defaultStyle[rule]};`, ''
        );
    }

    prepare() {
        let splashHTML;
        this.log.info('Preparing splash screen.');

        splashHTML = fs.readFileSync(this.templatePath, 'UTF-8');
        splashHTML = splashHTML.replace('{title}', this.title);
        splashHTML = splashHTML.replace('{style}', this.getStylesAsString());
        fs.writeFileSync(this.installPath, splashHTML);

        this.log.info('Splash screen prepared.');
    }

    getInstallPath() {
        return this.installPath;
    }
}
