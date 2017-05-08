/* eslint-disable no-param-reassign, no-console */
import test from 'ava';
import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { constructPlugin, fireEventsBusEvent, emitWindowCreated } from 'meteor-desktop-test-suite';
import { before, beforeEach, always, getApp, waitForSplashWindow, wait, isImageSimilar }
    from './helpers/helpers';

const appDir = path.join(__dirname, '.testApp2');

test.before(before.bind(null, appDir));
test.beforeEach(beforeEach.bind(null, appDir, undefined));
test.afterEach.always(always.bind(null, appDir));
test.after(
    () => shell.rm('-rf', appDir)
);

test('the test app', async t => getApp(t));

test('if update screen is displayed', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } },
        updateScreen: true,
        _disableSplash: true
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await emitWindowCreated(app);
    await fireEventsBusEvent(app, 'beforeReload');
    await waitForSplashWindow(app);
    t.true(await app.client.getWindowCount() === 2);
});

test('if update screen is closed', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } },
        updateScreen: true,
        _disableSplash: true
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await emitWindowCreated(app);
    await fireEventsBusEvent(app, 'beforeReload');
    await waitForSplashWindow(app);
    t.is(await app.client.getWindowCount(), 2);
    await fireEventsBusEvent(app, 'startupDidComplete');
    t.is(await app.client.getWindowCount(), 1);

});

test('if update window title is set properly', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowTitle: 'SplashTest',
        windowSettings: { webPreferences: { nodeIntegration: true } },
        updateScreen: true,
        updateScreenSettings: {
            windowTitle: 'Update Test'
        },
        _disableSplash: true
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await emitWindowCreated(app);
    await fireEventsBusEvent(app, 'beforeReload');
    await waitForSplashWindow(app);
    t.is(await app.client.getTitle(), 'Update Test');
});

test('if update image is displayed', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } },
        updateScreen: true,
        style: { 'background-size': 'auto auto', 'background-color': 'black' },
        updateScreenSettings: {
            style: { append: true }
        },
        _disableSplash: true
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await emitWindowCreated(app);
    await fireEventsBusEvent(app, 'beforeReload');
    await waitForSplashWindow(app);
    await wait(200);
    const imageBuffer = await app.browserWindow.capturePage();
    const updatePngPath = path.join(__dirname, 'update.png');
    fs.writeFileSync(updatePngPath, imageBuffer);

    t.true(await isImageSimilar(
        updatePngPath,
        path.join(__dirname, 'refs', 'update.png')));

    fs.unlinkSync(updatePngPath);
});
