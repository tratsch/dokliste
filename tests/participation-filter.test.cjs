const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '../index.html'), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');

function fixture({ years = [2015, 2016, 2017], totalRounds = 12, guestRounds } = {}) {
    const data = {
        players: ['Andy', 'Rolo', 'Peter'].map(name => ({ id: name, name, active: true })),
        seasons: years.map(year => ({ id: `s${year}`, year })), rounds: [], scores: []
    };
    years.forEach((year, yearIndex) => {
        for (let index = 0; index < totalRounds; index++) {
            const round = { id: `r${year}${String(index).padStart(10, '0')}`, season: `s${year}`, round_number: index + 1, played_on: '' };
            data.rounds.push(round);
            for (const [name, count, points] of [
                ['Andy', Math.min(10, totalRounds), 32], ['Rolo', Math.min(10, totalRounds), 48],
                ['Peter', guestRounds ?? (yearIndex === 0 ? 1 : 3), yearIndex === 0 ? 0 : 16]
            ]) {
                if (index < count) data.scores.push({ id: `${name}${round.id}`, player: name, round: round.id, points, games_played: 16 });
            }
        }
    });
    return data;
}

function harness(data = fixture()) {
    const elements = new Map();
    for (const id of ['sbody', 'stabs', 'rbody', 'stabs2', 'ebody', 'bbody', 'cleg', 'participation-filter', 'filter-status']) {
        const classes = new Set(), attributes = {};
        let markup = '', writes = 0;
        elements.set(id, {
            get innerHTML() { return markup; }, set innerHTML(value) { markup = value; writes++; },
            get writes() { return writes; }, textContent: '', attributes,
            classList: { toggle: (name, on) => on ? classes.add(name) : classes.delete(name), contains: name => classes.has(name) },
            setAttribute: (name, value) => { attributes[name] = value; }
        });
    }
    const ctx = { clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, setLineDash() {}, stroke() {}, fillText() {}, arc() {}, fill() {}, measureText: text => ({ width: text.length * 8 }) };
    elements.set('chart', { parentElement: { clientWidth: 375 }, getContext: () => ctx });
    const context = vm.createContext({
        window: { addEventListener() {} }, navigator: { onLine: true },
        document: { getElementById: id => elements.get(id) || null, querySelectorAll: () => [] }
    });
    vm.runInContext(script, context);
    const run = code => vm.runInContext(code, context);
    run(`Object.assign(S, ${JSON.stringify(data)}, {selYear:2015, selYearR:2015}); buildViews();`);
    return { context, elements, run, json: code => JSON.parse(JSON.stringify(run(code))), filter: () => context.toggleFilter() };
}

test('2015: denominator is all 12 season rounds, not the maximum of 10 participations', () => {
    const h = harness(); h.filter();
    assert.equal(h.context.qualifiesForYear('Peter', 2015), false);
    assert.equal(h.context.qualifiesForYear('Andy', 2015), true);
    assert.ok(!h.elements.get('sbody').innerHTML.includes('Peter'));
    assert.ok(h.elements.get('sbody').innerHTML.includes('Andy'));
});

test('two out of twelve rounds qualify', () => {
    const h = harness(fixture({ years: [2015], guestRounds: 2 })); h.filter();
    assert.equal(h.context.qualifiesForYear('Peter', 2015), true);
});

for (const totalRounds of [10, 20]) {
    test(`exactly 10% of ${totalRounds} rounds do not satisfy >10%`, () => {
        const h = harness(fixture({ years: [2015], totalRounds, guestRounds: totalRounds / 10 })); h.filter();
        assert.equal(h.context.qualifiesForYear('Peter', 2015), false);
    });
}

test('empty rounds remain part of the denominator and empty seasons qualify nobody', () => {
    const data = fixture({ years: [2015] });
    data.seasons.push({ id: 's2018', year: 2018 });
    const h = harness(data); h.filter();
    assert.equal(h.context.qualifiesForYear('Peter', 2015), false);
    assert.equal(h.context.qualifiesForYear('Andy', 2018), false);
});

test('season ranks, history, alltime totals and trophies use the same qualifying seasons', () => {
    const h = harness(); h.filter();
    assert.deepEqual(h.json('S.summary.filter(r => r.year === 2015).map(r => [r.player, r.season_rank])'), [['Andy', 1], ['Rolo', 2]]);
    assert.equal(h.run('S.history.some(r => r.player === "Peter" && r.year === 2015)'), false);
    const peter = h.json('S.alltime.find(r => r.player === "Peter")');
    assert.equal(peter.seasons_played, 2);
    assert.equal(peter.total_games_ever, 96);
    assert.equal(peter.alltime_avg, 1);
    assert.equal(h.run('S.alltime.find(r => r.player === "Andy").season_wins'), 1);
});

test('round result rows are filtered but cards and management actions remain available', () => {
    const h = harness(); h.filter(); h.context.renderRunden();
    const markup = h.elements.get('rbody').innerHTML;
    assert.ok(!markup.includes('Peter'));
    assert.ok(markup.includes('Andy'));
    assert.equal((markup.match(/class="round-actions"/g) || []).length, 12);
});

test('chart legend excludes players with no qualifying season', () => {
    const h = harness(fixture({ years: [2015] }));
    h.run('S.chartVis = new Set(["Andy", "Rolo", "Peter"]);');
    h.filter(); h.context.renderVerlauf();
    assert.ok(!h.elements.get('cleg').innerHTML.includes('Peter'));
    assert.ok(h.elements.get('cleg').innerHTML.includes('Andy'));
});

test('best list uses corrected yearly winner and does not include unqualified placement seasons', () => {
    const h = harness(); h.filter(); h.context.renderBest();
    const markup = h.elements.get('bbody').innerHTML;
    const winners = markup.split('Jahressieger')[1].split('Platzierungen')[0];
    assert.match(winners, /2015<\/span><span[^>]*>Andy<\/span>/);
    const placement = markup.split('Platzierungen')[1];
    assert.match(placement, />Peter<\/td><td[^>]*>–<\/td>/);
    assert.ok(!markup.includes('NaN'));
});

test('filter with no qualifying player never falls back to unfiltered winners or loading spinner', () => {
    const data = fixture({ years: [2015] });
    data.scores = data.scores.filter(score => score.round === data.rounds[0].id);
    const h = harness(data); h.filter(); h.context.renderBest();
    assert.equal(h.run('S.summary.length'), 0);
    assert.equal(h.run('S.alltime.length'), 0);
    assert.ok(!h.elements.get('bbody').innerHTML.includes('Lade'));
    assert.ok(!h.elements.get('bbody').innerHTML.includes('NaN'));
    assert.ok(h.elements.get('stabs').innerHTML.includes('2015'));
});

test('entry and edit forms remain complete when filter excludes a participant', () => {
    const h = harness(); h.filter();
    h.run('S.pinOk = true;'); h.context.renderEntryForm();
    assert.ok(h.elements.get('ebody').innerHTML.includes('id="tog-Peter"'));
    h.run('S.editRoundId = S.rounds[0].id;'); h.context.renderEntryForm();
    assert.match(h.elements.get('ebody').innerHTML, /id="pts-Peter"[^>]*value="0"/);
});

test('toggling on the entry page preserves the existing form and unsaved inputs', () => {
    const h = harness();
    h.run('S.pinOk = true; active = "entry";'); h.context.renderEntryForm();
    const writes = h.elements.get('ebody').writes;
    h.elements.set('rnr', { value: '987' });
    h.filter();
    assert.equal(h.elements.get('ebody').writes, writes);
    assert.equal(h.elements.get('rnr').value, '987');
    assert.equal(h.elements.get('participation-filter').attributes['aria-pressed'], 'true');
});

test('toggling off restores all derived data and never changes raw data', () => {
    const h = harness();
    const before = h.json('({players:S.players, seasons:S.seasons, rounds:S.rounds, scores:S.scores})');
    h.filter(); h.filter();
    assert.ok(h.run('S.summary.some(r => r.player === "Peter" && r.year === 2015)'));
    assert.equal(h.run('S.alltime.find(r => r.player === "Peter").seasons_played'), 3);
    assert.deepEqual(h.json('({players:S.players, seasons:S.seasons, rounds:S.rounds, scores:S.scores})'), before);
});

test('global toggle is outside individual views and blocked while writing', () => {
    assert.ok(html.includes('id="participation-filter"'));
    assert.ok(html.indexOf('id="participation-filter"') < html.indexOf('id="views"'));
    const h = harness(); h.run('S.roundBusy = true;'); h.filter();
    assert.equal(h.run('S.filterActive'), false);
});
