const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require('node:path').join(__dirname, '../activity.js'), 'utf8');

function page(initial) {
  let now = '2026-10-22T15:59:00Z';
  const listeners = {}, docListeners = {}, timers = [];
  const value = {textContent: ''}, sync = {textContent: ''};
  const section = {
    dataset: {}, setAttribute() {},
    querySelector: s => s === '#todayActivityValue' ? value : sync
  };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } }
  const document = {
    hidden: false, head: {appendChild() {}},
    createElement: tag => tag === 'section' ? section : {},
    querySelector: () => ({insertAdjacentElement() {}}),
    addEventListener: (name, fn) => { docListeners[name] = fn; }
  };
  const window = {
    worktimeLastData: initial,
    addEventListener: (name, fn) => { listeners[name] = fn; }
  };
  vm.runInNewContext(source, {document, window, Date: Clock, Intl,
    setInterval: fn => timers.push(fn)});
  return {value, sync, section,
    data: data => listeners['worktime:data']({detail: data}),
    offline: () => listeners['worktime:network-error'](),
    midnight: () => { now = '2026-10-22T16:01:00Z'; },
    tick: () => timers.forEach(fn => fn()),
    visible: () => docListeners.visibilitychange()
  };
}
const record = activity => ({date: '2026-10-22', first_clock_in: '08:30', leave_time: '17:30', activity});

test('presets update from shared data without mutating clock-in fields', () => {
  const p = page();
  for (const [code, label] of [['mahjong', '今天打牌'], ['gym', '今天健身'], ['pass', '今天 PASS']]) {
    const data = Object.freeze(record(code));
    p.data(data);
    assert.equal(p.value.textContent, label);
    assert.equal(data.first_clock_in, '08:30');
    assert.equal(data.leave_time, '17:30');
  }
});
test('loads data fetched before deferred script', () => {
  assert.equal(page(record('gym')).value.textContent, '今天健身');
});
test('activity date overrides clock-in date and old schema remains valid', () => {
  const p = page({...record('gym'), activity_date: '2026-10-21'});
  assert.equal(p.value.textContent, '今天尚未公告');
  p.data(record('pass'));
  assert.equal(p.value.textContent, '今天 PASS');
});
test('clears expired announcement at midnight while offline', () => {
  const p = page(record('mahjong'));
  p.midnight(); p.offline(); p.tick();
  assert.equal(p.value.textContent, '今天尚未公告');
  assert.equal(p.section.dataset.state, 'empty');
  assert.match(p.sync.textContent, /連線中斷/);
});
test('clears expired announcement on return to tab', () => {
  const p = page(record('gym'));
  p.midnight(); p.visible();
  assert.equal(p.value.textContent, '今天尚未公告');
});
test('retains same-day activity on network failure and recovers', () => {
  const p = page(record('gym'));
  p.offline();
  assert.equal(p.value.textContent, '今天健身');
  p.data(record('pass'));
  assert.equal(p.value.textContent, '今天 PASS');
  assert.match(p.sync.textContent, /同步於/);
});
test('custom content is text; missing activity stays empty', () => {
  const p = page(record('<img onerror=alert(1)>'));
  assert.equal(p.value.textContent, '<img onerror=alert(1)>');
  p.data(record(undefined));
  assert.equal(p.value.textContent, '今天尚未公告');
});
