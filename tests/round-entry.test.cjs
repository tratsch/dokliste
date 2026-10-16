const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).join('\n');

for (const id of ['smnwha4pdevoa0k', '123456789012345', '012345678901234', '1mnwha4pdevoa0k']) {
    test(`participant ${id} can be selected and deselected`, () => {
        const elements = new Map();
        const context = vm.createContext({
            window: { addEventListener() {} },
            navigator: { onLine: true },
            document: {
                getElementById: key => elements.get(key)
            }
        });
        elements.set('sbody', {});
        elements.set('ebody', {});
        vm.runInContext(script, context);
        vm.runInContext(`
            S.players = [{ id: ${JSON.stringify(id)}, name: 'Testspieler', active: true }];
            S.seasons = [{ id: 'season123456789', year: 2026 }];
            renderEntryForm();
        `, context);

        // Execute the actual generated click handler, as a browser does.
        const markup = elements.get('ebody').innerHTML;
        const button = markup.match(new RegExp(`<button[^>]*id="tog-${id}"[^>]*onclick="([^"]+)"`));
        assert.ok(button, 'participant button is rendered');
        const selected = new Set();
        const fields = new Set(['hide']);
        const classList = values => ({
            contains: value => values.has(value),
            toggle: (value, on) => on ? values.add(value) : values.delete(value)
        });
        const toggle = { classList: classList(selected), textContent: 'Dabei?' };
        let focused = false;
        elements.set(`tog-${id}`, toggle);
        elements.set(`pf-${id}`, { classList: classList(fields) });
        elements.set(`pts-${id}`, { focus() { focused = true; } });

        vm.runInContext(button[1], context);
        assert.ok(selected.has('on'));
        assert.ok(!fields.has('hide'));
        assert.equal(toggle.textContent, '✓ Dabei');
        assert.ok(focused, 'points input receives focus');

        vm.runInContext(button[1], context);
        assert.ok(!selected.has('on'));
        assert.ok(fields.has('hide'));
        assert.equal(toggle.textContent, 'Dabei?');
    });
}
