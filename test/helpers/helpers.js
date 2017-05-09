import path from 'path';
import fs from 'fs';
import shell from 'shelljs';
import resemble from 'node-resemble-js';
import electron from 'electron';
import { Application } from 'spectron';
import { createTestApp } from 'meteor-desktop-test-suite';

export async function getApp(t) {
    const app = t.context.app;
    await app.client.waitUntilWindowLoaded();
    t.is(await app.client.getWindowCount(), 1);
    return app;
}

export async function waitForSplashWindow(app) {
    await app.client.waitUntil((await app.client.getWindowCount()) === 2);
    await app.client.windowByIndex(1);
    await app.client.waitUntilWindowLoaded();
    await app.client.waitUntil(
        async () => app.client.execute(
            () => document.readyState === 'complete'
        )
    );
}

export function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

export async function isImageSimilar(
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

export async function before(appDir) {
    await createTestApp(appDir, 'meteor-desktop-splash-screen');
    shell.mkdir(path.join(appDir, 'assets'));
    shell.cp(path.join(__dirname, '..', 'assets', 'splashScreen.png'), path.join(appDir, 'assets'));
    shell.cp(path.join(__dirname, '..', 'assets', 'updateScreen.png'), path.join(appDir, 'assets'));
    shell.cp(path.join(__dirname, '..', 'assets', 'meteor.png'), path.join(appDir, 'assets'));
}

export async function beforeEach(appDir, cmd, t) {
    const args = cmd ? [appDir, cmd] : [appDir];
    t.context.app = new Application({ // eslint-disable-line
        path: electron,
        args,
        env: { ELECTRON_ENV: 'test', SPLASH_SCREEN_TEST: 1 }
    });
    await t.context.app.start();
}

export async function always(appDir, t) {
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
}
