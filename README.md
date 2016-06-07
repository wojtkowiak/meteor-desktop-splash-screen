## Meteor Desktop Splash Screen

A nice splash screen for you Meteor app on desktop!

### Usage

In your `.desktop/settings.json` add this package to your plugins list:
```json
{
    "plugins": {
       "meteor-desktop-splash-screen": {
            "version": "0.0.3"
        }
    }
}
```
Now place your logo in `.desktop/assets/splashScreen.png`. It should be a png with transparency.
__On Linux this does not look so nice because transparency is not supported in Electron [out of the box](https://github.com/electron/electron/blob/master/docs/api/frameless-window.md#limitations).__
 
### Settings

You can pass custom settings to the plugin for example:
```json
{
    "plugins": {
       "meteor-desktop-splash-screen": {
            "version": "0.0.3",
            "style": { 
                "box-sizing": "border-box",
                "border": "5px solid black",
                "border-radius": "5px"
            },
            "imagePath": "assets/mySplashLogo.png",
            "windowSettings": { "width": 640, "height": 480 }
        }
    }
}
```

Here is a definition of what can be set:
```javascript
/**
 * Settings object.
 * @typedef {Object} PluginSettings
 * @property {boolean} enabled       - Is splash screen enabled.
 * @property {string} windowTitle    - title of the window that shows splash screen.
 * @property {string} imagePath      - Path to the image relative to the .desktop dir.
 * @property {Object} style          - Style of the html body that displays the image.
 * @property {Object} windowSettings - Settings passed to BrowserWindow.
 */
```

### Contribution

PRs are always welcome. Be sure to update the tests.

To run the tests you need to open two terminals.
In the first one type `npm run build-watch` and in the second `npm run test-watch`. 

Tests are run by [AVA](https://github.com/avajs).
