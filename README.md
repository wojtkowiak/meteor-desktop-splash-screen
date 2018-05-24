# Meteor Desktop Splash Screen [![npm version](https://img.shields.io/npm/v/meteor-desktop-splash-screen.svg)](https://npmjs.org/package/meteor-desktop-splash-screen)

<sup>Travis</sup> [![Travis Build Status](https://travis-ci.org/wojtkowiak/meteor-desktop-splash-screen.svg?branch=master)](https://travis-ci.org/wojtkowiak/meteor-desktop-splash-screen) <sup>AppVeyor</sup> [![Build status](https://ci.appveyor.com/api/projects/status/f52xvrra1gouyg1t/branch/master?svg=true)](https://ci.appveyor.com/project/wojtkowiak/meteor-desktop-splash-screen) <sup>CircleCI</sup> [![CircleCI](https://circleci.com/gh/wojtkowiak/meteor-desktop-splash-screen/tree/master.svg?style=svg)](https://circleci.com/gh/wojtkowiak/meteor-desktop-splash-screen/tree/master)

---
A nice splash screen for you Meteor app on desktop! (and an update screen too!)

### Usage

In your `.desktop/settings.json` add this package to your plugins list:
```json
{
    "plugins": {
       "meteor-desktop-splash-screen": {
            "version": "0.4.3"
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
            "version": "0.4.3",
            "style": { 
                "box-sizing": "border-box",
                "border": "5px solid black",
                "border-radius": "5px"
            },
            "imagePath": "mySplashLogo.png",
            "windowSettings": { "width": 640, "height": 480 },
            "clickThrough": true,
            "updateScreen": true,
            "updateScreenSettings": {
                "imagePath": "updating.gif",
                "windowSettings": {
                    "width": 400,
                    "height": 300
                },
                "clickThrough": false,
                "style": {
                    "append": true,
                    "background-size": "auto"
                }
            }            
        }
    }
}
```
Note that `imagePath` should be relative to `assets` directory in your `.desktop`.

Here is a definition of what can be set:
```javascript
/**
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
```
`debug` can also be set at runtime by setting `METEOR_DESKTOP_DEBUG` environmental variable. 

If you have an icon set for the window in your settings.json it will be automatically used for splash screen's window - no need to set it here.

If you want to disable the splash screen temporarily for any reason you can use the `METEOR_DESKTOP_NO_SPLASH_SCREEN` env var.  

### Hot code push update screen

Place your update screen in `.desktop/assets/updateScreen.png` and tweak necessary settings. The update screen receives all the settings from the splash screen but you can override them in `updateScreenSettings`.
Also for `style` and `windowSettings` you can set `append` field to true if you want to merge those instead of overriding.

- **desktopHCP** - the same update screen is shown when the app is restarted after desktopHCP, you can however turn it off and show the splash screen instead by setting `updateScreenOnDesktopHCP` to `false` 


### Contribution

PRs are always welcome. Be sure to update the tests.

For smooth developing process you need to open two terminals. In the first one type `npm run build-watch` and in the second `npm run test-watch`. 

Tests are run by [AVA](https://github.com/avajs).

### Changelog
- **v0.4.3**
    - reverted workaround as it seems the window size issue is fixed in electron `2.0.2`
- **v0.4.2**
    - fix for the workaround messing with `fullscreen: true`
- **v0.4.1**
    - workaround for [meteor-desktop#173](https://github.com/wojtkowiak/meteor-desktop/issues/173)
    - the plugin is now transpiled in `babel7`
- **v0.4.0**
    - update screen functionality added
- **v0.3.0**
    - debug mode added - `debug` field added to `PluginSettings`
    - fixed splash screen not being shown when building and installing with NSIS and 32bit arch
- **v0.2.1**
    - fixed incorrectly released `0.2.0` (not all changes were included)
- **v0.2.0**
    - `clickThrough` field added to `PluginSettings` - allows to disable splash screen window 
    click-through which was enabled by default so far
    - the resultant generated `splash.html` is now saved to 
    [`userData`](http://electron.atom.io/docs/api/app/#appgetpathname)
      instead of application directory (fixes permission problems when installing for all users 
      with NSIS)
- **v0.1.0**
    - window is now click-through enabled
    - fixed [#3](https://github.com/wojtkowiak/meteor-desktop-splash-screen/issues/3)
- **v0.0.31** - fixed white background blinking before splash screen image load

### Roadmap

- [ ] support different settings for different platforms
 
