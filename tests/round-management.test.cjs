const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '../index.html'), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).join('\n');

function element(value = '') {
    const classes = new Set();
    return {
        value, innerHTML: '', textContent: '', disabled: false,
        classList: {
            contains: name => classes.has(name),
            add: name => classes.add(name), remove: name => classes.delete(name),
            toggle: (name, on) => on ? classes.add(name) : classes.delete(name)
        }, focus() {}
    };
}

function harness() {
    const elements = new Map();
    for (const id of ['sbody', 'ebody', 'rbody', 'stabs2', 'v-entry', 'v-runden',
        'nav-entry', 'nav-runden', 'pinf', 'perr', 'sync-btn']) elements.set(id, element());
    const messages = [], writes = [];
    const context = vm.createContext({
        window: { addEventListener() {} }, navigator: { onLine: true },
        document: { getElementById: id => elements.get(id) || null,
            querySelectorAll: () => [...elements.values()] },
        confirm: () => true, URLSearchParams,
        fetch: async () => { throw new Error('Unexpected real fetch'); }
    });
    vm.runInContext(script, context);
    const api = context.pbWrite;
    const run = code => vm.runInContext(code, context);
    const data = {
        players: [
            { id: 'smnwha4pdevoa0k', name: 'Aktiv', active: true },
            { id: '012345678901234', name: 'Inaktiv', active: false },
            { id: 'newplayer123456', name: 'Neu', active: true }
        ],
        seasons: [{ id: 'season123456789', year: 2026 }],
        rounds: [
            { id: 'round1234567890', season: 'season123456789', round_number: 1, played_on: '2026-10-01 00:00:00.000Z' },
            { id: 'other1234567890', season: 'season123456789', round_number: 2, played_on: '' }
        ],
        round_scores: [
            { id: 'score1234567890', round: 'round1234567890', player: 'smnwha4pdevoa0k', points: -8, games_played: 2 },
            { id: 'score2234567890', round: 'round1234567890', player: '012345678901234', points: 8, games_played: 2 },
            { id: 'otherscore12345', round: 'other1234567890', player: 'smnwha4pdevoa0k', points: 0, games_played: 4 }
        ]
    };
    run(`Object.assign(S, ${JSON.stringify({ ...data, scores: data.round_scores, pinOk: true, selYearR: 2026 })});`);
    context.toast = (message, type) => messages.push({ message, type });
    let syncs = 0;
    context.doSync = async () => { syncs++; };
    context.pbWrite = async (method, coll, id, body) => {
        writes.push({ method, coll, id, body: body && JSON.parse(JSON.stringify(body)) });
        if (h.fail) await h.fail(method, coll, id, body, writes.length);
        const records = data[coll];
        const index = records.findIndex(record => record.id === id);
        if (method === 'PATCH') {
            assert.ok(index >= 0);
            return Object.assign(records[index], body);
        }
        if (method === 'DELETE') {
            assert.ok(index >= 0);
            records.splice(index, 1);
            return null;
        }
        assert.equal(method, 'POST');
        const record = { id: `created${writes.length}`, ...body };
        records.push(record);
        return record;
    };
    const h = { context, run, elements, data, messages, writes, api,
        get syncs() { return syncs; },
        form() {
            run("S.editRoundId = 'round1234567890';");
            for (const [id, value] of Object.entries({ rseason: 'season123456789', rnr: '3', rdate: '2026-10-16' })) {
                elements.set(id, element(value));
            }
            for (const [index, player] of data.players.entries()) {
                const toggle = element();
                if (index < 2) toggle.classList.add('on');
                elements.set('tog-' + player.id, toggle);
                elements.set('pts-' + player.id, element(index === 0 ? '-12' : '12'));
                elements.set('gms-' + player.id, element('2'));
            }
        }
    };
    return h;
}

test('round cards offer edit and delete actions with string IDs', () => {
    const h = harness();
    h.context.renderRunden();
    assert.match(h.elements.get('rbody').innerHTML, /editRound\('round1234567890'\)/);
    assert.match(h.elements.get('rbody').innerHTML, /deleteRound\('round1234567890'\)/);
});

test('editing prefills metadata and includes existing inactive participants', () => {
    const h = harness();
    h.context.editRound('round1234567890');
    const markup = h.elements.get('ebody').innerHTML;
    assert.match(markup, /Runde 1 bearbeiten/);
    assert.match(markup, /id="rnr"[^>]*value="1"/);
    assert.match(markup, /id="rdate"[^>]*value="2026-10-01"/);
    assert.match(markup, /id="pts-smnwha4pdevoa0k"[^>]*value="-8"/);
    assert.match(markup, /id="gms-012345678901234"[^>]*value="2"/);
    assert.match(markup, /Änderungen speichern/);
    assert.match(markup, /Abbrechen/);
});

test('locked edit resumes after correct PIN without writing', () => {
    const h = harness();
    h.run('S.pinOk = false;');
    h.context.editRound('round1234567890');
    assert.match(h.elements.get('ebody').innerHTML, /PIN eingeben/);
    assert.equal(h.run('S.editRoundId'), null);
    h.elements.get('pinf').value = 'wrong';
    h.context.chkPin({ key: 'Enter' });
    assert.equal(h.run('S.pinOk'), false);
    h.elements.get('pinf').value = '1234';
    h.context.chkPin({ key: 'Enter' });
    assert.equal(h.run('S.editRoundId'), 'round1234567890');
    assert.equal(h.writes.length, 0);
});

test('cancel editing returns to rounds without writes', () => {
    const h = harness();
    h.context.editRound('round1234567890');
    h.context.cancelEditRound();
    assert.equal(h.run('S.editRoundId'), null);
    assert.equal(h.run('active'), 'runden');
    assert.equal(h.writes.length, 0);
});

test('save updates the same round and preserves inactive participant score IDs', async () => {
    const h = harness(); h.form();
    await h.context.submitRound();
    assert.equal(h.data.rounds.length, 2);
    assert.equal(h.data.rounds[0].round_number, 3);
    assert.equal(h.data.rounds[0].played_on, '2026-10-16 00:00:00.000Z');
    assert.equal(h.data.round_scores[0].id, 'score1234567890');
    assert.equal(h.data.round_scores[0].points, -12);
    assert.equal(h.data.round_scores[1].id, 'score2234567890');
    assert.equal(h.data.round_scores[1].points, 12);
    assert.equal(h.writes.filter(write => write.method === 'POST').length, 0);
    assert.equal(h.syncs, 1);
    assert.equal(h.run('S.editRoundId'), null);
});

test('save adds and removes participants while leaving other rounds untouched', async () => {
    const h = harness(); h.form();
    const other = structuredClone(h.data.round_scores[2]);
    h.elements.get('tog-012345678901234').classList.remove('on');
    h.elements.get('tog-newplayer123456').classList.add('on');
    await h.context.submitRound();
    assert.ok(!h.data.round_scores.some(score => score.player === '012345678901234'));
    assert.ok(h.data.round_scores.some(score => score.player === 'newplayer123456' && score.round === 'round1234567890'));
    assert.deepEqual(h.data.round_scores.find(score => score.id === other.id), other);
});

for (const [name, change, expected] of [
    ['duplicate round number', h => { h.elements.get('rnr').value = '2'; }, /existiert/],
    ['fractional round number', h => { h.elements.get('rnr').value = '1.5'; }, /positive ganze Zahl/],
    ['blank selected points', h => { h.elements.get('pts-smnwha4pdevoa0k').value = ''; }, /gültige Punkte/],
    ['fractional games', h => { h.elements.get('gms-smnwha4pdevoa0k').value = '1.5'; }, /Spielezahl/],
    ['non-divisible game sum', h => { h.elements.get('gms-smnwha4pdevoa0k').value = '1'; }, /nicht durch 4 teilbar/]
]) {
    test(`validation rejects ${name} before writing`, async () => {
        const h = harness(); h.form(); change(h);
        await h.context.submitRound();
        assert.equal(h.writes.length, 0);
        assert.equal(h.messages.at(-1).type, 'err');
        assert.match(h.messages.at(-1).message, expected);
        assert.equal(h.run('S.editRoundId'), 'round1234567890');
    });
}

test('edit failure rolls back earlier updates and keeps the form open', async () => {
    const h = harness(); h.form();
    const before = structuredClone(h.data);
    h.fail = async (method, coll, id, body, count) => {
        if (count === 3) throw Object.assign(new Error('write denied'), { status: 403 });
    };
    await h.context.submitRound();
    assert.deepEqual(h.data, before);
    assert.equal(h.run('S.editRoundId'), 'round1234567890');
    assert.equal(h.messages.at(-1).type, 'err');
    assert.equal(h.run('S.roundBusy'), false);
});

test('delete cancellation performs no writes', async () => {
    const h = harness();
    let confirmation;
    h.context.confirm = message => { confirmation = message; return false; };
    await h.context.deleteRound('round1234567890');
    assert.match(confirmation, /Runde 1/);
    assert.match(confirmation, /2026/);
    assert.equal(h.writes.length, 0);
});

test('delete removes only the chosen round and its scores, then refreshes', async () => {
    const h = harness();
    await h.context.deleteRound('round1234567890');
    assert.deepEqual(h.data.rounds.map(round => round.id), ['other1234567890']);
    assert.deepEqual(h.data.round_scores.map(score => score.id), ['otherscore12345']);
    assert.equal(h.writes.at(-1).coll, 'rounds');
    assert.equal(h.syncs, 1);
});

test('locked delete requires PIN before confirmation and mutation', async () => {
    const h = harness();
    h.run('S.pinOk = false;');
    let confirmations = 0;
    h.context.confirm = () => { confirmations++; return false; };
    await h.context.deleteRound('round1234567890');
    assert.equal(confirmations, 0);
    assert.equal(h.writes.length, 0);
    h.elements.get('pinf').value = '1234';
    h.context.chkPin({ key: 'Enter' });
    assert.equal(confirmations, 1);
});

test('failed round deletion restores deleted scores with their original IDs', async () => {
    const h = harness();
    const before = structuredClone(h.data);
    h.fail = async (method, coll) => {
        if (method === 'DELETE' && coll === 'rounds') {
            throw Object.assign(new Error('round deletion denied'), { status: 403 });
        }
    };
    await h.context.deleteRound('round1234567890');
    assert.deepEqual(h.data.round_scores.sort((a, b) => a.id.localeCompare(b.id)),
        before.round_scores.sort((a, b) => a.id.localeCompare(b.id)));
    assert.deepEqual(h.data.rounds, before.rounds);
    assert.equal(h.messages.at(-1).type, 'err');
});

test('failed rollback warns that the data must be checked', async () => {
    const h = harness();
    h.fail = async (method, coll) => {
        if (coll === 'rounds' || method === 'POST') {
            throw Object.assign(new Error('denied'), { status: 403 });
        }
    };
    await h.context.deleteRound('round1234567890');
    assert.match(h.messages.at(-1).message, /prüfen/);
    assert.equal(h.run('S.roundBusy'), false);
});

test('uncertain network failure never claims a complete rollback', async () => {
    const h = harness();
    h.fail = async () => { throw new TypeError('Failed to fetch'); };
    await h.context.deleteRound('round1234567890');
    assert.match(h.messages.at(-1).message, /prüfen/);
});

test('mutation guard rejects repeated saves, deletes and edits', async () => {
    const h = harness(); h.form(); h.run('S.roundBusy = true;');
    await h.context.submitRound();
    await h.context.deleteRound('round1234567890');
    h.context.editRound('other1234567890');
    assert.equal(h.writes.length, 0);
    assert.equal(h.run('S.editRoundId'), 'round1234567890');
});

test('save cannot bypass the PIN guard', async () => {
    const h = harness(); h.form(); h.run('S.pinOk = false;');
    await h.context.submitRound();
    assert.equal(h.writes.length, 0);
});

test('new round creation still links every score to the created round', async () => {
    const h = harness(); h.form(); h.run('S.editRoundId = null;');
    h.elements.get('tog-newplayer123456').classList.add('on');
    await h.context.submitRound();
    const created = h.data.rounds.find(round => round.round_number === 3);
    assert.ok(created);
    const scores = h.data.round_scores.filter(score => score.round === created.id);
    assert.deepEqual(scores.map(score => score.player), ['smnwha4pdevoa0k', 'newplayer123456']);
});

test('failed new round creation removes created scores before removing the round', async () => {
    const h = harness(); h.form(); h.run('S.editRoundId = null;');
    h.elements.get('tog-newplayer123456').classList.add('on');
    const before = structuredClone(h.data);
    h.fail = async (method, coll, id, body, count) => {
        if (count === 3) throw Object.assign(new Error('score denied'), { status: 403 });
    };
    await h.context.submitRound();
    assert.deepEqual(h.data, before);
    assert.equal(h.writes.at(-2).coll, 'round_scores');
    assert.equal(h.writes.at(-1).coll, 'rounds');
});

test('HTTP adapter supports empty DELETE responses and preserves API error status', async () => {
    const h = harness();
    let sent;
    h.context.fetch = async (url, options) => {
        sent = { url, options };
        return new Response(null, { status: 204 });
    };
    assert.equal(await h.api('DELETE', 'rounds', 'round1234567890'), null);
    assert.equal(sent.url, '/api/collections/rounds/records/round1234567890');
    assert.equal(sent.options.method, 'DELETE');
    assert.equal(sent.options.body, undefined);
    h.context.fetch = async () => new Response(JSON.stringify({ message: 'Not allowed' }), { status: 403 });
    await assert.rejects(h.api('PATCH', 'rounds', 'round1234567890', {}), error => {
        assert.equal(error.status, 403);
        assert.equal(error.message, 'Not allowed');
        return true;
    });
});

test('offline mutations are rejected without writing', async () => {
    const h = harness(); h.form(); h.context.navigator.onLine = false;
    await h.context.submitRound();
    await h.context.deleteRound('round1234567890');
    assert.equal(h.writes.length, 0);
    assert.match(h.messages.at(-1).message, /Verbindung/);
});
