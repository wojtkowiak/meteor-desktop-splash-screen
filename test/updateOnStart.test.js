/* eslint-disable no-param-reassign, no-console */
import test from 'ava';
import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { constructPlugin, fireEventsBusEvent } from 'meteor-desktop-test-suite';
import { before, beforeEach, always, getApp, waitForSplashWindow, wait, isImageSimilar }
    from './helpers/helpers';

const appDir = path.join(__dirname, '.testApp3');

test.before(before.bind(null, appDir));
test.beforeEach(beforeEach.bind(null, appDir, '--hcp'));
test.afterEach.always(always.bind(null, appDir));
test.after(
    () => shell.rm('-rf', appDir)
);

test('the test app', async t => getApp(t));

test('if update image is displayed on startup', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } },
        updateScreen: true,
        style: { 'background-size': 'auto auto', 'background-color': 'black' },
        updateScreenSettings: {
            style: { append: true }
        }
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
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

test('if update screen is closed on startup', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } },
        updateScreen: true
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);
    t.is(await app.client.getWindowCount(), 2);
    await fireEventsBusEvent(app, 'beforeLoadFinish');
    t.is(await app.client.getWindowCount(), 1);
});
