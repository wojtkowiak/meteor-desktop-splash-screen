# Meteor Desktop Splash Screen [![npm version](https://img.shields.io/npm/v/meteor-desktop-splash-screen.svg)](https://npmjs.org/package/meteor-desktop-splash-screen)

<sup>Travis</sup> [![Travis Build Status](https://travis-ci.org/wojtkowiak/meteor-desktop-splash-screen.svg?branch=master)](https://travis-ci.org/wojtkowiak/meteor-desktop-splash-screen) <sup>AppVeyor</sup> [![Build status](https://ci.appveyor.com/api/projects/status/f52xvrra1gouyg1t?svg=true)](https://ci.appveyor.com/project/wojtkowiak/meteor-desktop-splash-screen) <sup>CircleCI</sup> [![CircleCI](https://circleci.com/gh/wojtkowiak/meteor-desktop-splash-screen.svg?style=svg)](https://circleci.com/gh/wojtkowiak/meteor-desktop-splash-screen)

---
A nice splash screen for you Meteor app on desktop!

### Usage

In your `.desktop/settings.json` add this package to your plugins list:
```json
{
    "plugins": {
       "meteor-desktop-splash-screen": {
            "version": "0.0.30"
        }
    }
}
```
Now place your logo in `.desktop/assets/splashScreen.png`. It should be a png with transparency.
__On Linux this does not look so nice because transparency is not supported in Electron [out of the box](https://github.com/electron/electron/blob/master/docs/api/frameless-window.md#limitations).__
 
### Settings

You can pass custom settings to the plugin, for example:
```json
{
    "plugins": {
       "meteor-desktop-splash-screen": {
            "version": "0.0.30",
            "style": { 
                "box-sizing": "border-box",
                "border": "5px solid black",
                "border-radius": "5px"
            },
            "imagePath": "mySplashLogo.png",
            "windowSettings": { "width": 640, "height": 480 }
        }
    }
}
```
Note that `imagePath` should be relative to `assets` directory in your `.desktop`.

Here is a definition of what can be set:
```javascript
/**
 * @typedef {Object} PluginSettings
 * @property {boolean} enabled        - is splash screen enabled
 * @property {string}  windowTitle    - title of the window that shows splash screen - it defaults
 *                                      to the `name` from settings.json
 * @property {string}  imagePath      - path to the image relative to the .desktop dir
 * @property {Object}  style          - style of the html body that displays the image
 * @property {Object}  windowSettings - settings passed to BrowserWindow
 * @property {Object}  module         - the Module class from Meteor Desktop
 */
```

If you have an icon set for the window in your settings.json it will be automatically used for splash screen's window - no need to set it here.

If you want to disable the splash screen temporarily for any reason you can use the `METEOR_DESKTOP_NO_SPLASH_SCREEN` env var.  

### Contribution

PRs are always welcome. Be sure to update the tests.

For smooth developing process you need to open two terminals. In the first one type `npm run build-watch` and in the second `npm run test-watch`. 

Tests are run by [AVA](https://github.com/avajs).

### Changelog

- v0.0.31 - fixed white background blinking before splash screen image load

### Roadmap

- [ ] support different settings for different platforms
 
