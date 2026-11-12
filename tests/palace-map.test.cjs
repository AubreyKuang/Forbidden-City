const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const {runGameScripts} = require('./game-scripts.cjs');

// Same stub-DOM approach as tests/palace-flow.cjs, but document.createElement
// records every element so the test can find the .mlab map buttons mountMap
// creates and invoke their handlers like a real click would.
function setup() {
  const noop = () => {};
  const canvas = new Proxy({measureText: () => ({width: 100}), getImageData: () => ({data: []}), createImageData: (w, h) => ({data: new Uint8Array(w * h * 4)})}, {get: (o, k) => o[k] || noop});
  const created = [];
  const el = () => {
    const e = {hidden: false, innerHTML: '', value: '', style: {}, className: '', textContent: '',
      getContext: () => canvas, toDataURL: () => '', setAttribute: noop, addEventListener: noop,
      appendChild: noop, scrollIntoView: noop, remove: noop};
    created.push(e);
    return e;
  };
  const elements = new Map();
  const storage = new Map();
  const document = {
    querySelector: key => {if (!elements.has(key)) elements.set(key, el()); return elements.get(key);},
    createElement: el,
    addEventListener: noop,
  };
  const math = Object.create(Math);
  let seed = 98123;
  math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const ctx = vm.createContext({Math: math, document,
    localStorage: {getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v)},
    requestAnimationFrame: noop, setTimeout: noop, setInterval: noop,
    getComputedStyle: () => ({getPropertyValue: () => 'sans-serif'}), console, assert});
  runGameScripts(ctx);
  return {ctx, created};
}

function startGame(ctx) {
  vm.runInContext(`
    const drain = () => {
      for (let i = 0; modalOpen && i < 150; i++) {
        if ($('#mbox').innerHTML.includes('onclick="nextEv()"')) nextEv();
        else choose(curEv.choices.findIndex(c => !c.cond || c.cond()));
      }
      assert.equal(modalOpen, false, 'modal queue drained');
    };
    A.newGame();
    A.start();
    drain();
    A.go('map');
    assert.equal(UI.view, 'map');
  `, ctx);
}

function mapButton(created, name) {
  const buttons = created.filter(e => typeof e.className === 'string' && e.className.includes('mlab') && e.textContent === name);
  assert.ok(buttons.length, `map button ${name} exists`);
  return buttons[buttons.length - 1];
}

test('single click on a palace button travels there at once (no walk, no second click)', () => {
  const {ctx, created} = setup();
  startGame(ctx);
  // Legend must describe the actual behaviour: one click on a name goes directly.
  const legend = vm.runInContext(`$('#panel').innerHTML`, ctx);
  assert.match(legend, /点宫殿名直达/);
  assert.doesNotMatch(legend, /双击宫殿名直达/);
  const btn = mapButton(created, '翊坤宫');
  assert.equal(typeof btn.onclick, 'function');
  btn.onclick();
  // Arrival is immediate: no mapTick has run since the click.
  assert.equal(vm.runInContext('UI.view', ctx), 'palace');
  assert.equal(vm.runInContext('UI.sel', ctx), '翊坤宫');
  assert.match(vm.runInContext(`$('#panel').innerHTML`, ctx), /翊坤宫/);
});

test('clicking a palace on the map itself still walks the emperor there', () => {
  const {ctx} = setup();
  startGame(ctx);
  vm.runInContext(`goPlace(PLACES.find(p => p.id === 'yh'))`, ctx);
  assert.equal(vm.runInContext('emp.path.length > 0', ctx), true);
  let arrived = false;
  for (let i = 0; i < 500; i++) {
    vm.runInContext('mapTick()', ctx);
    if (vm.runInContext(`UI.view === 'place' && UI.sel === 'yh'`, ctx)) {arrived = true; break;}
  }
  assert.ok(arrived, 'emperor walks to 御花园 and arrives');
  assert.match(vm.runInContext(`$('#panel').innerHTML`, ctx), /御花园/);
});

test('palace panel lists every resident with rank, favor and mood, plus the palace note', () => {
  const {ctx} = setup();
  startGame(ctx);
  vm.runInContext(`
    S.consorts[0].palace = '翊坤宫';
    S.consorts[1].palace = '翊坤宫';
    UI.view = 'palace'; UI.sel = '翊坤宫'; render();
    const html = $('#panel').innerHTML;
    assert.match(html, /住着 2 位妃嫔/);
    assert.match(html, /西六宫之一，院墙高高，里头常飘出琴声。/);
    for (const c of S.consorts) assert.ok(html.includes(fullName(c)), 'resident ' + fullName(c) + ' listed');
    assert.match(html, /恩宠/);
    assert.match(html, /心情/);
    // Cold palace keeps its own wording and still lists its residents.
    S.consorts[0].cold = true; S.consorts[0].palace = '冷宫';
    UI.view = 'palace'; UI.sel = '冷宫'; render();
    assert.match($('#panel').innerHTML, /冷宫里关着 1 人/);
    assert.match($('#panel').innerHTML, /荒草萋萋，宫门深锁。/);
  `, ctx);
});

test('coronation trait choice shows a check badge, not just a color change', () => {
  const {ctx} = setup();
  vm.runInContext(`A.newGame();`, ctx);
  const html = vm.runInContext(`$('#panel').innerHTML`, ctx);
  assert.match(html, /帝王性情/);
  assert.match(html, /opt-check/);
  assert.match(html, /✓ 已选/);
  const css = fs.readFileSync(path.join(__dirname, '..', 'palace.css'), 'utf8');
  assert.ok(css.includes('.coronation-styles .opt:has(input:checked) .opt-check'),
    'checked badge is only shown for the selected option');
  assert.ok(css.includes('.coronation-styles .opt:has(input:checked){background:#754337;border-color:#e5b778;box-shadow:0 0 0 1px #e5b778}'),
    'selected option also gets a gold ring');
});
