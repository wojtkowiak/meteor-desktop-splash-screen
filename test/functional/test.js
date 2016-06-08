import test from 'ava';
import { Application } from 'spectron';
import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import resemble from 'node-resemble-js';
import { getElectronPath, createTestApp, sendIpc } from 'meteor-desktop-plugin-test-suite';

async function getApp(t) {
    const app = t.context.app;
    await app.client.waitUntilWindowLoaded();
    t.is(await app.client.getWindowCount(), 1);
    return app;
}

async function waitForSplashWindow(t, app) {
    await app.client.waitUntil((await app.client.getWindowCount()) == 2);
    await app.client.windowByIndex(1);
    await app.client.waitUntilWindowLoaded();
    await app.client.waitUntil(
        async() => await app.client.execute(
            () => document.readyState === 'complete'
        )
    );
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

async function isImageSimilar(source, reference, tolerance = 5) {
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

const appDir = path.join(__dirname, '..', 'testApp');

test.before(
    async () => {
        await createTestApp(appDir, 'meteor-desktop-splash-screen');
        shell.mkdir(path.join(appDir, 'assets'));
        shell.cp('splashScreen.png', path.join(appDir, 'assets'));
        shell.cp('meteor.png', path.join(appDir, 'assets'));
    }
);

test.after(
    () => shell.rm('-rf', appDir)
);

test.beforeEach(async t => {
    t.context.app = new Application({
        path: getElectronPath(),
        args: [path.join(__dirname, '..', 'testApp')]
    });
    await t.context.app.start();
});

test.afterEach.always(async t => {
    if (t.context.app && t.context.app.isRunning()) {
        await t.context.app.stop();
    }
});

test('the test app', async t => await getApp(t));

test('if splash screen is displayed', async t => {
    const app = await getApp(t);
    await sendIpc(app, 'constructPlugin', undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await sendIpc(app, 'fireSystemEvent', 'beforeInitialization');
    await waitForSplashWindow(t, app);
    t.true(await app.client.getWindowCount() === 2);
});

test('if splash screen is closed', async t => {
    const app = await getApp(t);
    await sendIpc(app, 'constructPlugin', undefined, undefined, undefined, undefined,
        undefined, { windowSettings: { webPreferences: { nodeIntegration: true } } }
    );
    await sendIpc(app, 'fireSystemEvent', 'beforeInitialization');
    await waitForSplashWindow(t, app);
    t.is(await app.client.getWindowCount(), 2);
    await sendIpc(app, 'fireSystemEvent', 'beforeLoadingFinished');
    t.is(await app.client.getWindowCount(), 1);
});

test('if window title is set properly', async t => {
    const app = await getApp(t);
    await sendIpc(app, 'constructPlugin', undefined, undefined, undefined, undefined, undefined, {
        windowTitle: 'SplashTest',
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await sendIpc(app, 'fireSystemEvent', 'beforeInitialization');
    await waitForSplashWindow(t, app);

    t.is(await app.client.getTitle(), 'SplashTest');
});

test('if splash screen can be disabled', async t => {
    const app = await getApp(t);
    await sendIpc(app, 'constructPlugin', undefined, undefined, undefined, undefined, undefined, {
        enabled: false
    });
    await sendIpc(app, 'fireSystemEvent', 'beforeInitialization');
    await wait(200);
    t.true(await app.client.getWindowCount() === 1);
});

test('if image is displayed', async t => {
    const app = await getApp(t);
    await sendIpc(app, 'constructPlugin', undefined, undefined, undefined, undefined, undefined, {
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await sendIpc(app, 'fireSystemEvent', 'beforeInitialization');
    await waitForSplashWindow(t, app);

    await wait(200);
    const imageBuffer = await app.browserWindow.capturePage();
    fs.writeFile('page.png', imageBuffer);

    t.true(await isImageSimilar('page.png', path.join('refs', 'page.png')));

    fs.unlinkSync('page.png');
});

test('if styles can be injected', async t => {
    const app = await getApp(t);
    await sendIpc(app, 'constructPlugin', undefined, undefined, undefined, undefined, undefined, {
        style: { 'background-color': 'red' },
        windowSettings: { webPreferences: { nodeIntegration: true } }
    });
    await sendIpc(app, 'fireSystemEvent', 'beforeInitialization');
    await waitForSplashWindow(t, app);

    await wait(200);
    const imageBuffer = await app.browserWindow.capturePage();
    fs.writeFile('page_2.png', imageBuffer);

    t.true(await isImageSimilar('page_2.png', path.join('refs', 'page_modified_style.png')));

    fs.unlinkSync('page_2.png');
});

test('if window settings can be injected', async t => {
    const app = await getApp(t);
    await sendIpc(app, 'constructPlugin', undefined, undefined, undefined, undefined, undefined, {
        windowSettings: {
            width: 200,
            height: 200,
            webPreferences: { nodeIntegration: true }
        }
    });
    await sendIpc(app, 'fireSystemEvent', 'beforeInitialization');
    await waitForSplashWindow(t, app);

    t.deepEqual(await app.browserWindow.getSize(), [200, 200]);
});

// TODO: implement unit test instead of this incomplete functional one.
test('if splash screen is displayed with proper window icon [incomplete test]', async t => {
    const app = await getApp(t);
    await sendIpc(
        app,
        'constructPlugin',
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
        });
    await sendIpc(app, 'fireSystemEvent', 'beforeInitialization');
    await waitForSplashWindow(t, app);

    // TODO: how to check if windows is displayed with proper icon? is this possible in spectron?

    // For now you can test it manually here, uncomment line below and you will have 20 secs to
    // verify it :)

    // await wait(20000);
});
