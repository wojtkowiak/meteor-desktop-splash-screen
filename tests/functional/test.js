/* eslint-disable no-param-reassign, no-console */
import test from 'ava';
import { Application } from 'spectron';
import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import resemble from 'node-resemble-js';
import electron from 'electron';
import { createTestApp, constructPlugin, fireEventsBusEvent } from 'meteor-desktop-test-suite';

async function getApp(t) {
    const app = t.context.app;
    await app.client.waitUntilWindowLoaded();
    t.is(await app.client.getWindowCount(), 1);
    return app;
}

async function waitForSplashWindow(app) {
    await app.client.waitUntil((await app.client.getWindowCount()) === 2);
    await app.client.windowByIndex(1);
    await app.client.waitUntilWindowLoaded();
    await app.client.waitUntil(
        async () => app.client.execute(
            () => document.readyState === 'complete'
        )
    );
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

async function isImageSimilar(
    source,
    reference,
    tolerance = (process.env.TRAVIS || process.env.APPVEYOR ? 15 : 5)
) {
    return new Promise((resolve) => {
        resemble(source)
            .compareTo(reference)
            .ignoreColors()
            .onComplete((data) => {
                if (data.misMatchPercentage <= tolerance) {
                    resolve(true);
                } else {
                    console.warn(`Images mismatch at ${data.misMatchPercentage}%`);
                    resolve(false);
                }
            });
    });
}

const appDir = path.join(__dirname, '..', '.testApp');

test.before(
    async () => {
        await createTestApp(appDir, 'meteor-desktop-splash-screen');
        shell.mkdir(path.join(appDir, 'assets'));
        shell.cp(path.join(__dirname, 'assets', 'splashScreen.png'), path.join(appDir, 'assets'));
        shell.cp(path.join(__dirname, 'assets', 'meteor.png'), path.join(appDir, 'assets'));
    }
);

test.after(
    () => shell.rm('-rf', appDir)
);

test.beforeEach(async (t) => {
    t.context.app = new Application({
        path: electron,
        args: [appDir],
        env: { ELECTRON_ENV: 'test', SPLASH_SCREEN_TEST: 1 }
    });
    await t.context.app.start();
});

test.afterEach.always(async (t) => {
    try {
        // Test app saves an error.txt file if it encounters an uncaught exception.
        // It is good to see it's contents if it is present.
        const errorFile = path.join(appDir, 'error.txt');
        console.log(
            'error caught in the test app:',
            fs.readFileSync(errorFile, 'utf8')
        );
        fs.unlinkSync(errorFile);
    } catch (e) {
        // There is no error file so we are good ;)
    }
    if (t.context.app && t.context.app.isRunning()) {
        await t.context.app.stop();
    }
});

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

test('if window title is set properly', async (t) => {
    const app = await getApp(t);
    await constructPlugin(app, undefined, undefined, undefined, undefined, undefined, {
        windowTitle: 'SplashTest',
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await fireEventsBusEvent(app, 'beforeModulesLoad');
    await waitForSplashWindow(app);
    t.is(await app.client.getTitle(), 'SplashTest');
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
        path.join(__dirname, 'refs', 'page.png')));

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
        path.join(__dirname, 'refs', 'page_modified_style.png')));

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
