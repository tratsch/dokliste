const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '../index.html'), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).join('\n');

function chart(history, selected = ['Armin'], qualifies = () => true) {
    const points = [], labels = [], lines = [];
    const ctx = {
        clearRect() {}, beginPath() {}, setLineDash() {}, stroke() {}, fill() {},
        moveTo(x, y) { lines.push({ type: 'move', color: this.strokeStyle, x, y }); },
        lineTo(x, y) { lines.push({ type: 'line', color: this.strokeStyle, x, y }); },
        arc(x, y) { points.push({ color: this.fillStyle, x, y }); },
        fillText(text, x, y) { labels.push({ text, align: this.textAlign, x, y }); },
        measureText(text) { return { width: text.length * 8 }; }
    };
    const canvas = { parentElement: { clientWidth: 300 }, getContext: () => ctx };
    const context = vm.createContext({
        window: { addEventListener() {} }, navigator: { onLine: true },
        document: { getElementById: id => id === 'chart' ? canvas : {} }
    });
    vm.runInContext(script, context);
    vm.runInContext(`S.history = ${JSON.stringify(history)}; S.chartVis = new Set(${JSON.stringify(selected)});`, context);
    context.qualifiesForYear = qualifies;
    const years = [...new Set(history.map(row => row.year))].sort();
    const players = [...new Set(history.map(row => row.player))];
    context.drawChart(years, players);
    return { points, lines, labels, axis: labels.filter(label => label.align === 'right').map(label => Number(label.text)) };
}

function history(values, player = 'Armin') {
    return values.map((value, index) => ({ player, year: 2023 + index, avg_points_per_game: value }));
}

test('Armin’s 3.25 average for 2026 is drawn and connected to 2025', () => {
    const result = chart([
        { player: 'Armin', year: 2025, avg_points_per_game: 238 / 144 },
        { player: 'Armin', year: 2026, avg_points_per_game: 104 / 32 }
    ]);
    assert.equal(result.points.length, 2);
    assert.ok(Math.max(...result.axis) >= 3.25);
    assert.ok(Math.min(...result.axis) <= 238 / 144);
    const line = result.lines.filter(line => line.color === '#e65100');
    assert.deepEqual(line.map(line => line.type), ['move', 'line']);
    assert.equal(line.at(-1).x, result.points.at(-1).x);
    assert.equal(line.at(-1).y, result.points.at(-1).y);
});

test('negative, zero and high averages are all drawn at distinct positions', () => {
    const values = [-2, 0, 3.25, 7.8];
    const result = chart(history(values));
    assert.equal(result.points.length, values.length);
    assert.equal(new Set(result.points.map(point => point.y)).size, values.length);
    assert.ok(result.points.every(point => point.y >= 12 && point.y <= 268));
    assert.ok(Math.min(...result.axis) <= -2);
    assert.ok(Math.max(...result.axis) >= 7.8);
});

test('identical values and a single year have a finite nonzero scale', () => {
    for (const values of [[0], [3.25], [-4, -4], [2.5, 2.5]]) {
        const result = chart(history(values));
        assert.equal(result.points.length, values.length);
        assert.ok(result.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
        assert.ok(Math.min(...result.axis) < values[0]);
        assert.ok(Math.max(...result.axis) > values[0]);
    }
});

test('hidden players do not stretch the visible scale', () => {
    const result = chart([...history([2, 3.25]), ...history([100, 200], 'Rolo')]);
    assert.equal(result.points.length, 2);
    assert.ok(Math.max(...result.axis) >= 3.25);
    assert.ok(Math.max(...result.axis) < 100);
});

test('participation filter applies to both markers and automatic scale', () => {
    const result = chart(history([2, 3.25, 200]), ['Armin'], (player, year) => year !== 2025);
    assert.equal(result.points.length, 2);
    assert.ok(Math.max(...result.axis) >= 3.25);
    assert.ok(Math.max(...result.axis) < 200);
});

test('missing or invalid values do not create artificial zero points', () => {
    const result = chart(history([2, null, 3.25, 'invalid']));
    assert.equal(result.points.length, 2);
    assert.ok(Math.min(...result.axis) > 0);
    assert.ok(result.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
});

test('empty and completely hidden charts still have valid axes', () => {
    for (const result of [chart([]), chart(history([2, 3.25]), [])]) {
        assert.equal(result.points.length, 0);
        assert.ok(result.axis.length >= 2);
        assert.ok(result.axis.every(Number.isFinite));
        assert.ok(Math.max(...result.axis) > Math.min(...result.axis));
    }
});

test('large values leave enough room for readable axis labels', () => {
    const result = chart(history([1000, 5000]));
    assert.equal(result.points.length, 2);
    assert.ok(Math.max(...result.axis) >= 5000);
    assert.ok(result.labels.filter(label => label.align === 'right').every(label => label.x >= label.text.length * 8));
});
