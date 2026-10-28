// 출석 키패드 판정·보낼 줄(지시서 045) — 화면(index.html)과 시뮬레이션(tools/kiosk/sim.js)이 같이 씀.
// 학생 정보는 이 파일에 없다. 명부는 서버(빠른 서버 kiosk)에서 기기 열쇠로 받아 기기 안에만 둔다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KioskCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var GAP3 = 180000, HOLD = 5000;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function kst(ms) { var d = new Date(ms + 9 * 3600000); return { day: d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()), hm: pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()), hms: pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) }; }

  // o: { post(body) → Promise<json>, store {get(k), set(k,v)}, now(), dev, key, test, onChange(), hold, gap3 }
  function create(o) {
    var store = o.store || { get: function () { return null; }, set: function () {} };
    var now = o.now || function () { return Date.now(); };
    var hold = o.hold === undefined ? HOLD : o.hold, gap3 = o.gap3 === undefined ? GAP3 : o.gap3;
    var P = 'kiosk_' + (o.test ? 't_' : '') + (o.ns || '');
    function load(k, d) { try { var v = store.get(P + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
    function save(k, v) { try { store.set(P + k, JSON.stringify(v)); } catch (e) {} }
    var S = {
      roster: load('roster', { v: '', list: [], at: 0 }),
      st: load('st', {}),          // { day: { 학생번호: {t, at} } } — 이 기기 + 서버에서 받은 상태
      out: load('out', []),        // 보낼 줄 [{key, at, dev, n, nm, c, t, hold}]
      net: { ok: null, lastOk: 0, lastErr: '', fails: 0, sending: false, lastMs: 0 },
      sent: 0,
    };
    var byD4 = {};
    function index() { byD4 = {}; (S.roster.list || []).forEach(function (s) { (s.p || []).forEach(function (d) { (byD4[d] = byD4[d] || []).push(s); }); }); Object.keys(byD4).forEach(function (d) { byD4[d].sort(function (a, b) { return a.nm < b.nm ? -1 : a.nm > b.nm ? 1 : 0; }); }); }
    index();
    function changed() { if (o.onChange) try { o.onChange(); } catch (e) {} }
    function dayNow() { return kst(now()).day; }
    function lastOf(n, day) { var m = S.st[day || dayNow()]; return m ? m[n] : null; }
    function keepDays() { var ks = Object.keys(S.st).sort(); while (ks.length > 3) delete S.st[ks.shift()]; }

    // 4자리 → 학생들(0명·1명·여러 명)
    function lookup(d4) { return (byD4[String(d4)] || []).slice(); }
    // 그 학생을 지금 누르면? → {t:'등원'|'하원'} 또는 {ignored:true, last}
    function decide(s) {
      var t = now(), L = lastOf(s.n);
      if (L && Math.abs(t - L.at) < gap3) return { ignored: true, last: L };
      return { t: !L || L.t === '하원' ? '등원' : '하원' };
    }
    // 기록 확정 → 보낼 줄(5초 기다렸다 보냄 — 그 안에 [취소] 가능)
    function commit(s) {
      var d = decide(s); if (d.ignored) return { ignored: true, last: d.last };
      var at = now(), day = kst(at).day, prev = lastOf(s.n, day) || null;
      var r = { key: String(o.dev) + '|' + at + '|' + s.n, at: at, dev: String(o.dev), n: s.n, nm: s.nm, c: s.c || '', t: d.t, hold: at + hold, prev: prev };
      (S.st[day] = S.st[day] || {})[s.n] = { t: d.t, at: at }; keepDays();
      S.out.push(r); save('out', S.out); save('st', S.st); changed();
      return { rec: r, t: d.t, hm: kst(at).hm };
    }
    function cancel(key) {
      for (var i = 0; i < S.out.length; i++) if (S.out[i].key === key) {
        var r = S.out[i]; if (r.sending) return false;
        S.out.splice(i, 1);
        var day = kst(r.at).day; if (S.st[day]) { if (r.prev) S.st[day][r.n] = r.prev; else delete S.st[day][r.n]; }
        save('out', S.out); save('st', S.st); changed(); return true;
      }
      return false;
    }
    // 서버에서 받은 그날 상태와 합침(더 늦게 누른 쪽)
    function merge(day, today) {
      if (!today) return; var m = S.st[day] = S.st[day] || {};
      Object.keys(today).forEach(function (n) { var x = today[n], L = m[n]; if (!L || x.at > L.at) m[n] = { t: x.t, at: x.at }; });
      save('st', S.st);
    }
    function base() { var b = { a: 'kiosk', k: o.key || '', dev: String(o.dev) }; if (o.test) b.test = 1; return b; }
    function netOk(ms) { S.net.ok = true; S.net.lastOk = now(); S.net.fails = 0; S.net.lastErr = ''; if (ms !== undefined) S.net.lastMs = ms; }
    function netErr(e) { S.net.ok = false; S.net.fails++; S.net.lastErr = String(e && e.message || e || '').slice(0, 60); }
    async function syncRoster() {
      var day = dayNow(), b = base(); b.op = 'roster'; b.v = S.roster.v; b.day = day;
      try {
        var j = await o.post(b);
        if (!j || !j.ok) throw new Error(j && j.error || 'roster');
        if (j.list) { S.roster = { v: j.v, list: j.list, at: now() }; index(); save('roster', S.roster); } else { S.roster.at = now(); save('roster', S.roster); }
        merge(j.day || day, j.today); netOk(); changed(); return true;
      } catch (e) { netErr(e); changed(); return false; }
    }
    // 보낼 줄 한 번 — 기다림 끝난 것 최대 batch개를 한 요청으로(한 번에 하나씩 순서대로)
    async function pumpOnce(batch) {
      if (S.net.sending) return 0;
      var t = now(), go = S.out.filter(function (r) { return r.hold <= t; }).slice(0, batch || 10);
      if (!go.length) return 0;
      S.net.sending = true; go.forEach(function (r) { r.sending = true; });
      var b = base(); b.op = 'rec'; b.recs = go.map(function (r) { return { key: r.key, at: r.at, dev: r.dev, n: r.n, nm: r.nm, c: r.c, t: r.t }; });
      var t0 = Date.now(), done = 0;
      try {
        var j = await o.post(b);
        if (!j || !j.ok) throw new Error(j && j.error || 'rec');
        var res = j.res || {}, fx = j.fix || {};
        go.forEach(function (r) { var t2 = fx[r.key]; if (!t2) return; r.t = t2; var m = S.st[kst(r.at).day]; if (m && m[r.n] && m[r.n].at === r.at) m[r.n].t = t2; save('st', S.st); }); // 2차: 서버가 다시 정한 등원/하원으로 고쳐 둠
        go.forEach(function (r) { var v = res[r.key]; if (v === 'ok' || v === 'dup' || v === 'skip3' || v === 'bad') { r.result = v; done++; } });
        S.out = S.out.filter(function (r) { return !r.result; });
        S.sent += done; netOk(Date.now() - t0);
        if (o.onSent) try { o.onSent(go.filter(function (r) { return r.result; }), Date.now() - t0); } catch (e) {}
      } catch (e) { netErr(e); }
      go.forEach(function (r) { delete r.sending; });
      S.net.sending = false; save('out', S.out); changed();
      return done;
    }
    // 뒤에서 계속: 보낼 것 있으면 바로, 실패하면 1→2→4→8→15초 기다렸다 다시
    var timer = null, stopped = false;
    function loop() {
      if (stopped) return;
      var wait = 300;
      pumpOnce().then(function () {
        if (S.net.ok === false) wait = Math.min(15000, 1000 * Math.pow(2, Math.min(S.net.fails - 1, 4)));
        else if (S.out.some(function (r) { return r.hold <= now(); })) wait = 50;
      }).catch(function () {}).then(function () { if (!stopped) timer = setTimeout(loop, wait); });
    }
    return {
      S: S, lookup: lookup, decide: decide, commit: commit, cancel: cancel, syncRoster: syncRoster, pumpOnce: pumpOnce, merge: merge,
      start: function () { stopped = false; loop(); }, stop: function () { stopped = true; if (timer) clearTimeout(timer); },
      pending: function () { return S.out.length; }, kst: kst, count: function () { return (S.roster.list || []).length; },
    };
  }
  return { create: create, kst: kst, GAP3: GAP3, HOLD: HOLD };
});
