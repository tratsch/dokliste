const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

for (const method of ['POST', 'PATCH', 'DELETE']) {
    test(`service worker leaves ${method} mutations to the network`, () => {
        const handlers = {};
        const context = vm.createContext({
            self: { addEventListener: (event, handler) => { handlers[event] = handler; } },
            URL,
            fetch() { assert.fail('mutation must not enter the caching handler'); }
        });
        vm.runInContext(readFileSync(join(__dirname, '../sw.js'), 'utf8'), context);
        handlers.fetch({
            request: { method, url: 'https://doko.test/api/collections/rounds/records/example' },
            respondWith() { assert.fail('mutation must not be handled by the cache'); }
        });
    });
}

function cacheHarness({ url, mode, networkError, fallback, status = 200 }) {
    const handlers = {}, lifetime = [], writes = [], cloneErrors = [];
    let resolveOpen, rejectOpen, responsePromise, openCalls = 0;
    const opened = new Promise((resolve, reject) => { resolveOpen = resolve; rejectOpen = reject; });
    const response = new Response('network body', { status });
    const clone = response.clone.bind(response);
    response.clone = () => {
        try { return clone(); }
        catch (error) {
            // Record the real stream error without leaking an unhandled rejection
            // from the old, detached cache promise into the test runner.
            cloneErrors.push(error);
            return new Response('clone failed');
        }
    };
    const cache = { async put(request, copy) { writes.push({ url: request.url, body: await copy.text() }); } };
    const context = vm.createContext({
        self: { addEventListener: (event, handler) => { handlers[event] = handler; } },
        URL, Response,
        fetch: () => networkError ? Promise.reject(networkError) : Promise.resolve(response),
        caches: {
            open() { openCalls++; return opened; },
            match: async () => fallback
        }
    });
    vm.runInContext(readFileSync(join(__dirname, '../sw.js'), 'utf8'), context);
    handlers.fetch({
        request: { method: 'GET', url, mode },
        respondWith(promise) { responsePromise = Promise.resolve(promise); },
        waitUntil(promise) { lifetime.push(promise); }
    });
    return {
        response: responsePromise, lifetime, writes, cloneErrors, cache,
        resolveOpen: () => resolveOpen(cache), rejectOpen,
        get openCalls() { return openCalls; }
    };
}

for (const [name, url, mode] of [
    ['API', 'https://doko.test/api/collections/players/records', 'cors'],
    ['navigation', 'https://doko.test/dokliste/index.html', 'navigate']
]) {
    test(`${name}: slow cache opening cannot clone an already consumed response`, async () => {
        const h = cacheHarness({ url, mode });
        const response = await h.response;
        assert.equal(await response.text(), 'network body');
        // The app has consumed the returned response before caches.open resolves.
        h.resolveOpen();
        await Promise.all(h.lifetime);
        await new Promise(setImmediate);
        assert.equal(h.cloneErrors.length, 0, h.cloneErrors[0]?.message);
        assert.deepEqual(h.writes, [{ url, body: 'network body' }]);
        assert.equal(h.lifetime.length, 1, 'cache update belongs to the fetch event lifetime');
    });

    test(`${name}: cache opening failure does not reject the successful response or event lifetime`, async () => {
        const h = cacheHarness({ url, mode });
        assert.equal(h.lifetime.length, 1, 'background cache update must be tracked');
        assert.equal(await (await h.response).text(), 'network body');
        h.rejectOpen(new Error('Cache unavailable'));
        assert.deepEqual((await Promise.allSettled(h.lifetime)).map(result => result.status), ['fulfilled']);
    });

    test(`${name}: cache write failure is handled without losing the network response`, async () => {
        const h = cacheHarness({ url, mode });
        assert.equal(h.lifetime.length, 1);
        h.cache.put = async () => { throw new Error('Quota exceeded'); };
        assert.equal(await (await h.response).text(), 'network body');
        h.resolveOpen();
        assert.deepEqual((await Promise.allSettled(h.lifetime)).map(result => result.status), ['fulfilled']);
    });

    test(`${name}: network failure still returns the cached response`, async () => {
        const h = cacheHarness({ url, mode, networkError: new TypeError('Failed to fetch'), fallback: new Response('offline body') });
        assert.equal(await (await h.response).text(), 'offline body');
        await Promise.all(h.lifetime);
        assert.equal(h.openCalls, 0);
    });

    test(`${name}: HTTP errors do not replace a usable cached response`, async () => {
        const h = cacheHarness({ url, mode, status: 500 });
        const response = await h.response;
        assert.equal(response.status, 500);
        await response.text();
        h.resolveOpen();
        await Promise.all(h.lifetime);
        await new Promise(setImmediate);
        assert.equal(h.writes.length, 0);
    });
}
