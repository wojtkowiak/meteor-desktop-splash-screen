/* eslint-disable no-param-reassign, no-console */
import test from 'ava';
import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import { constructPlugin, fireEventsBusEvent } from 'meteor-desktop-test-suite';
import { before, beforeEach, always, getApp, waitForSplashWindow, wait, isImageSimilar }
    from './helpers/helpers';

const appDir = path.join(__dirname, '.testApp');

test.before(before.bind(null, appDir));
test.beforeEach(beforeEach.bind(null, appDir, undefined));
test.afterEach.always(always.bind(null, appDir));
test.after(
    () => shell.rm('-rf', appDir)
);

test('the test app', async t => getApp(t));

test('if splash screen is displayed', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);
    t.true(await app.client.getWindowCount() === 2);
});

test('if splash screen is closed', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);
    t.is(await app.client.getWindowCount(), 2);
    await fireEventsBusEvent(app, 'beforeLoadFinish');
    t.is(await app.client.getWindowCount(), 1);
});

test('if splash window title is set properly', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowTitle: 'SplashTest',
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);
    t.is(await app.client.getTitle(), 'SplashTest');
});

test('if window size is correct', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowTitle: 'SplashTest',
        windowSettings: { width: 200, height: 400, webPreferences: { nodeIntegration: true } }
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);
    const size = await app.browserWindow.getSize();
    t.true(size[0] === 200);
    t.true(size[1] === 400);
});

test('if splash screen can be disabled', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        enabled: false
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await wait(200);
    t.true(await app.client.getWindowCount() === 1);
});

test('if image is displayed', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);
    await wait(200);
    const imageBuffer = await app.browserWindow.capturePage();
    const pagePngPath = path.join(__dirname, 'page.png');
    fs.writeFileSync(pagePngPath, imageBuffer);

    t.true(await isImageSimilar(
        pagePngPath,
        path.join(__dirname, 'refs', 'splash.png')));

    fs.unlinkSync(pagePngPath);
});

test('if styles can be injected', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        style: { 'background-color': 'red' },
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);

    await wait(200);
    const imageBuffer = await app.browserWindow.capturePage();
    const page2PngPath = path.join(__dirname, 'page_2.png');
    fs.writeFileSync(page2PngPath, imageBuffer);

    t.true(await isImageSimilar(
        page2PngPath,
        path.join(__dirname, 'refs', 'splash_modified_style.png')));

    fs.unlinkSync(page2PngPath);
});

test('if window settings can be injected', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowSettings: {
            width: 200,
            height: 200,
            webPreferences: { nodeIntegration: true }
        }
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);

    t.deepEqual(await app.browserWindow.getSize(), [200, 200]);
});

// TODO: implement unit test instead of this incomplete functional one.
test('if splash screen is displayed with proper window icon [incomplete test]', async (t) => {
    const app = await getApp(t);
    await constructPlugin(
        app,
        undefined,
        undefined,
        {
            window: {
                icon: path.join(appDir, 'assets', 'meteor.png')
            }
        },
        undefined,
        undefined, {
            windowSettings: { webPreferences: { nodeIntegration: true } }
        }
    );
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);

    // TODO: how to check if windows is displayed with proper icon? is this possible in spectron?

    // For now you can test it manually here, uncomment line below and you will have 20 secs to
    // verify it :)

    // await wait(20000);
});
