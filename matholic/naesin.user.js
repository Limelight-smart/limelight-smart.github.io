// ==UserScript==
// @name         매쓰홀릭 → 내신로그 자동 업데이트
// @namespace    naesin-kyomusil-2026
// @version      2.13.2
// @description  (2.13.2 11/23: 매쓰홀릭 접속 열쇠(330초) 만료 전 미리 갱신 · 401/403이면 한 번 갱신 뒤 재시도 / 2.13.1 11/23: 수업 시간 수집 창 변경 — 평일 18~22시 · 토 10~13시+14~20시(13~14시 쉼) · 일 10~13시 / 2.13.0 11/23: 열쇠(TOKEN·ACH_KEY)는 코드에 없음 — 크롬 localStorage 'naesinToken'·'naesinAchKey'에서 읽음(없으면 조용히 멈춤, 콘솔 '열쇠 없음'), 자동 업데이트 주소 = 공개 저장소, 보내는 자료에 버전(v)·PC 이름(pc = localStorage 'naesinPc')·실행 번호(run) · 소단원은 3천 줄씩 나눠 보냄(빠른 서버 본문 2MB 한도 — 그동안 빠른 서버가 0건이던 까닭) · 실패하면 까닭(busy·login·network·other)을, 끝나면 보낸 숫자(소단원 줄·수업별 학생·학습지·줄)를 빠른 서버 a=mhPing으로(서버가 쓴 숫자와 대조·계산 기억 지움) / 2.12.0 11/22: 소단원·학습 보내는 곳 = 빠른 서버(DB에 먼저 쌓고 시트에도 같이 씀) — 빠른 서버가 안 되면 옛 서버 주소로 한 번 더(같은 열쇠 덮어쓰기라 두 번 가도 같음) / 2.11.3 11/21: '[내신대비]'로 시작하는 수업도 내신 수업으로 수집 / 2.11.2 11/17: AI 예측 초록 문항 수를 소단원 줄 맨 끝(예측초록)에 따로 보냄 — 서버가 유형분석 초록 합계에 더함 / 2.11.1 11/17: 소단원 열쇠에 대단원 추가(1-1 3.2.x와 1-2 3.2.x가 같은 코드라 서로 덮던 것) / 2.11.0 11/17: '[기말대비]'·'[중간대비]' 수업도 내신 수업으로 읽음(소단원 범위 거르지 않음) · 6단계(실력 하·중, 심화 하·중 — 매쓰홀릭 tag 9) 소단원 줄('내신실력하'~'내신심화중') + 중단원 이름 · 새로 '학습' 탭(학습지별 처음 푼 결과·다시풀기·오답유사)을 수업마다 a=achLearn으로 · 옛 내신로그 주소가 없어도 새 전송만으로 돎 / 2.10.2 11/12: [기말내신] 수업 소단원별을 난이도별(교재 '내신개념'·'내신기본'·'내신실력'·'내신심화')로도 보냄(합친 '내신' 줄은 그대로), 학교 하나만 든 수업 이름이면 학교 칸 채움, 옛 내신로그 실패·[교과서] 수업 없음이어도 소단원별은 따로 보냄 / 2.10.1 11/10: 매쓰홀릭 '[기말내신] 학교' 수업(내신대비 교재 — 학생은 원래 반 + 추가)도 읽어 소단원별을 교재 '내신'으로 같이 보냄(개념~심화 합침), 옛 내신로그는 그대로 / 2.10.0 11/10: 소단원별 성취도 — 이미 받는 유형분석을 소단원×교재(교과서·개념·기본·실력·심화)×6색·완료·이해율·AI 예측으로 묶어 선생님앱_API a=achSub에도 보냄. 옛 내신로그 전송은 그대로, 매쓰홀릭 호출 수 그대로) 수업 시간(평일 18~22:30 · 토 10~22 · 일 10~18) 15분마다 + 매일 14:00·22:00 + 시트 버튼 요청. 화면 버튼 없음(집 PC 상시 실행용). (2.9.2: 15분·평일 22:30까지 / 2.9.1: 학원 PC 설치본 2.8의 이사벨 동아·내성 3.2 제외 합침 / 2.9: 요일별 시간 창·버튼 숨김 / 2.8.1: 금양중 범위에서 원부채꼴 제외 / 2.8: 로그인 정보 자동 갱신·재시도, 집중 모드 / 2.7: AI 예측은 회색 / 2.4: 인쇄 시 숨김)
// @match        https://teacher.matholic.com/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Limelight-smart/limelight-smart.github.io/main/matholic/naesin.user.js
// @downloadURL  https://raw.githubusercontent.com/Limelight-smart/limelight-smart.github.io/main/matholic/naesin.user.js
// ==/UserScript==
// 저장소가 원본(2026-10-19 v2.9~). 2.13.0~ 공개 저장소 사본으로 자동 업데이트 — 이 파일에 열쇠·학생 이름을 절대 넣지 않는다.
// 열쇠는 그 PC 크롬 매쓰홀릭 탭 콘솔에서 한 번: localStorage.naesinAchKey='…'(선생님앱_API 성취도소단원_열쇠보기 값) · localStorage.naesinToken='…'(옛 내신로그용, 없어도 됨) · localStorage.naesinPc='집 PC'
// 웹 앱 주소는 코드에 없음 — 크롬 localStorage 'naesinSheetUrl'. 주소가 없을 때만 버튼이 보이고, 버튼 우클릭으로 넣는다.
// 버튼을 다시 보려면 콘솔에서 localStorage.naesinShowBtn='1' 뒤 새로고침.
(function () {
  'use strict';
  const SLOTS = ['14:00', '22:00'];            // 자동 실행 시각
  // ★ 수업 시간 모드(2.9): 요일별 시간 창 안에서 every분마다 (로그인돼 있을 때만, 실패해도 조용히 다음 칸). 지시서 024
  const RUSH = { on: true, every: 15, win: { 0: [['10:00', '13:00']], 6: [['10:00', '13:00'], ['14:00', '20:00']], wk: [['18:00', '22:00']] } };   // 0=일, 6=토, 그 외 평일. 창은 여러 개 가능. 11/23 01:56 킴쌤: 15분마다, 평일 18~22, 토 10~13·14~20, 일 10~13
  const rushWin = d => RUSH.win[d.getDay()] || RUSH.win.wk;
  const CATCHUP_H = 12;                        // 마지막 성공이 이보다 오래됐으면 탭을 열 때 한 번 실행
  const WINDOW_MIN = 50;                       // 시각이 지나고 이 시간 안에 탭이 열려 있으면 실행
  const LS = { url: 'naesinSheetUrl', done: 'naesinDone', last: 'naesinLast', lock: 'naesinLock', pending: 'naesinPending', ok: 'naesinLastOk', catchTry: 'naesinCatchTry', reqDone: 'naesinReqDone', rushDone: 'naesinRushDone' };
  const IN_FRAME = window.top !== window;      // 로그인 갱신용 숨은 창 안에서 도는 경우
  let lastInput = 0;   // 사용자가 마지막으로 마우스·키보드를 쓴 시각 (작업 중엔 새로고침하지 않기 위해)
  if (!IN_FRAME) ['keydown', 'mousedown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { lastInput = Date.now(); }, true));
  const URL_RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
               set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
               del: k => { try { localStorage.removeItem(k); } catch (e) {} } };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ── 인증 헤더 엿보기: 사이트가 jellyg API로 보내는 요청의 헤더를 계속 최신으로 기억 ──
  const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send, XH = XMLHttpRequest.prototype.setRequestHeader;
  let AUTH = null, authAt = 0, API = 'https://jellyg.matholic.com';
  const SKIP_H = /^(content-type|accept|x-requested-with)$/i;
  XMLHttpRequest.prototype.open = function (m, u) { this.__u = String(u); this.__h = {}; return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) { if (this.__h) this.__h[k] = v; return XH.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    if (!this.__mine && /jellyg\.matholic\.com\/api\//.test(this.__u || '')) {
      const h = {}; for (const [k, v] of Object.entries(this.__h || {})) if (!SKIP_H.test(k)) h[k] = v;
      AUTH = h; authAt = Date.now(); API = this.__u.split('/api/')[0];
      if (IN_FRAME) { try { window.parent.postMessage({ naesinAuth: h, api: API }, location.origin); } catch (e) {} }
    }
    return XS.apply(this, arguments);
  };
  if (IN_FRAME) return;   // 숨은 창에서는 헤더만 넘겨주고 끝
  addEventListener('message', e => {
    if (e.origin === location.origin && e.data && e.data.naesinAuth) { AUTH = e.data.naesinAuth; authAt = Date.now(); if (e.data.api) API = e.data.api; }
  });

  const VER = '2.13.2';
  // 2.13.0: 열쇠는 localStorage에서만(코드·공개 저장소에 없음)
  const TOKEN = (ls.get('naesinToken') || '').trim();
  const PC = (ls.get('naesinPc') || '').trim().slice(0, 30);
  const TEACHER_IDS = [1511203];         // 반 목록 주소의 teacher 번호 (여러 개 가능)
  const CHAPTERS = ['31749', '32310'];   // 중1-1, 중1-2 (반 정보에 없을 때만 사용)
  // 범위 6자리 = 기말 단원 [5.3 다각형, 6.1 다면체와 회전체, 6.2 입체도형의 겉넓이와 부피, 7 자료의 정리와 해석, (예비), (예비)] — 성취도 AU1~CD1 머리와 같은 순서 (2.9.3 11/1 기말 전환). [내신]범위 시트와 반드시 일치시킬 것
  const SCHOOL = [
    ['거제여', '거제여중', [1,1,1,1,0,0], '동아'],
    ['거성',   '거성중',   [1,1,1,1,0,0], '동아'],
    ['금양',   '금양중',   [1,1,1,1,0,0], '미래엔'],   // 2.8.1: 원부채꼴 제외 (시트 모수 심화67·실력102)
    ['내성',   '내성중',   [1,1,1,1,0,0], 'YBM', ['3.2']],   // 5번째: 빼는 소단원 번호(정비례·반비례 제외)
    ['부곡',   '부곡중',   [1,1,1,1,0,0], '비상'],
    ['브니엘', '브니엘예중', [1,1,1,1,0,0], '지학사'],
    ['사직여', '사직여중', [1,1,1,1,0,0], '천재(화)'],
    ['사직',   '사직중',   [1,1,1,1,0,0], '비상'],
    ['여명',   '여명중',   [1,1,1,1,0,0], 'YBM'],
    ['온천',   '온천중',   [1,1,1,1,0,0], '동아'],
    ['유락',   '유락여중', [1,1,1,1,0,0], '동아'],
    ['이사벨', '이사벨중', [1,1,1,1,0,0], '동아'],   // 학원 PC 설치본 2.8: 동아(저장소 사본의 '비상'은 옛 값)
  ];
  const CMAP = { STAR: 0, GREEN: 0, GRAY: 1, YELLOW: 2, RED: 3, SKULL: 4 };
  // 2.10.0 소단원별 성취도 → 선생님앱_API a=achSub (라임라잇_내신 '성취도_소단원' 탭). ACH_KEY = 선생님앱_API 편집기 `성취도소단원_열쇠보기` 로그 값(가림 그대로면 안 보냄)
  const ACH_KEY = (ls.get('naesinAchKey') || '').trim();
  const ACH_URL = 'https://script.google.com/macros/s/AKfycbxW5BKDfh3tuWTYDIaZILVPCZwRA4Vbsk0i09XN6-eEpJgauQjHp_hn5AP7x_xM2_Ra/exec';   // 선생님앱_API(옛 서버) — localStorage 'naesinAchUrl'이 있으면 그것
  const FAST_URL = 'https://limelight-fast-hrsvpdbbmq-du.a.run.app';   // 2.12.0 빠른 서버(DB 먼저 + 시트 거울) — localStorage 'naesinFastUrl'이 있으면 그것, 'off'면 옛 서버만
  // 소단원 범위 = 학교 RANGE·SKIP과 상관없이 기말 단원 전부(어디서 어긋나는지 보려고): blockOf 4칸 + 이름(원과 부채꼴 등)
  const SUB_RE = /다각형|부채꼴|다면체|회전체|겉넓이|부피|입체\s*도형|평면\s*도형|자료|통계|대푯값|도수/;
  const NAE_RE = /^\s*\[(?:(?:기말|중간)?내신|(?:기말|중간|내신)대비)\]/;   // 2.10.1: 내신 수업(킴쌤 11/10) — 소단원별만, 교재 '내신'(엔진 매쓰홀릭명단.js 매쓰명단_내신접두_와 같은 접두) · 2.11.0: '[기말대비]'·'[중간대비]'도(킴쌤 11/17) · 2.11.3: '[내신대비]'도(11/21)
  // 2.11.0 6단계: 문항 tags 중 rootTagId 9의 value — -1 개념 · 11 기본 · 21 실력 하 · 22 실력 중 · 31 심화 하 · 32 심화 중. 소단원 줄 교재 '내신' + 아래 이름(실력·심화 하/중만 따로 보냄)
  const SIX = { '21': '실력하', '22': '실력중', '31': '심화하', '32': '심화중' }, SIX_N = Object.values(SIX);
  const sixOf = it => SIX[String(((it && it.tags) || []).find(t => t && t.rootTagId === 9)?.value ?? '')] || '';
  const inSub = (ch, code) => !!code && (blockOf('', code) >= 0 || SUB_RE.test(`${ch.topChapterName || ''} ${ch.chapterName || ''}`));

  // 단원 → 블록 번호
  const blockOf = (top, code) => {   // 2.9.3 기말: 단원 번호(코드)로만 — 5.3 다각형 · 6.1 다면체와 회전체 · 6.2 겉넓이와 부피 · 7 자료의 정리와 해석 (4·5번 칸은 예비)
    if (code.startsWith('5.3.')) return 0;
    if (code.startsWith('6.1.')) return 1;
    if (code.startsWith('6.2.')) return 2;
    if (code.startsWith('7.')) return 3;
    return -1;
  };

  // ── 집계: 한 학생의 응답들 → 로그 행 / 교과서 행 ──────────────
  const tally = (chapters, RANGE, BOOK, SKIP = [], opt = {}) => {   // 2.11.0 opt.all = 소단원 범위(SUB_RE·blockOf) 거르지 않음 · opt.six = 6단계 줄도
    const z = () => [0, 0, 0, 0, 0];
    const blk = [...Array(6)].map(() => ({ s: z(), h: z() })); // 실력/심화 5색
    const book = [0, 0, 0, 0, 0, 0]; // 5색 + 미응시
    let nItems = 0;
    const LV = { '-1': 0, '1': 1, '2': 2, '3': 3 }; // 개념·기본·실력·심화
    const allLv = [...Array(4)].map(() => [0, 0, 0, 0, 0, 0]), bookLv = [...Array(4)].map(() => [0, 0, 0, 0, 0, 0]);
    const LVN = ['개념', '기본', '실력', '심화'], sub = new Map();   // 2.10.0: '코드|교재' → {top, code, name, k:[초록,회색,노랑,빨강,해골,미응시], ai} · 2.11.0 mid = 중단원 이름
    const addSub = (ch, code) => {
      const nm = String(ch.chapterName || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim();
      for (const [lv, items] of Object.entries(ch.scores || {})) {
        for (const it of items) {
          const c = it.predict ? CMAP.GRAY : CMAP[it.state], ci = c === undefined ? 5 : c;
          const gs = [LVN[LV[lv]]]; if ((it.tags || []).some(t => t.rootTagId === 14 && t.value === BOOK)) gs.push('교과서');
          if (opt.six) { const sx = sixOf(it); if (sx) gs.push(sx); }
          for (const g of gs) {
            if (!g) continue;
            const key = (ch.topChapterName || '') + '|' + code + '|' + g, x = sub.get(key) || { top: ch.topChapterName || '', code, name: nm, g, k: [0, 0, 0, 0, 0, 0], ai: 0, st: 0, pg: 0, mid: String(ch.middleChapterName || '').trim() };
            x.k[ci]++; if (it.predict) { x.ai++; if (it.state === 'GREEN' || it.state === 'STAR') x.pg++; } else if (it.state === 'STAR') x.st++; sub.set(key, x);   // 2.11.2 pg = AI 예측인데 초록인 문항(회색 칸에도 들어 있음 — 서버가 초록 합계에 더함)   // 2.10.2 st = 초록 중 ★(초록 칸에도 들어 있음)
          }
        }
      }
    };
    for (const ch of chapters.flat()) {
      const code = (ch.chapterName.match(/\d+\.\d+\.\d+/) || [''])[0];
      const b = blockOf(ch.topChapterName || ch.chapterName, code);
      if (opt.all ? !!code : inSub(ch, code)) addSub(ch, code);   // 2.11.0 내신 수업은 범위 거르지 않음(다른 학년·범위도) · 2.10.0: 소단원별은 학교 범위와 상관없이 따로 셈(아래 집계는 그대로)
      if (b < 0 || !RANGE[b]) continue;
      if (SKIP.some(p => code.startsWith(p))) continue;   // 학교 범위에서 빠진 소단원(학원 PC 설치본 2.8에서 가져옴)
      for (const [lv, items] of Object.entries(ch.scores || {})) {
        for (const it of items) {
          nItems++;
          const c = it.predict ? CMAP.GRAY : CMAP[it.state]; // 2.7: AI 예측(동그라미·물음표)은 안 푼 것 → 회색. 미학습(QUESTION)만 미응시
          if (lv === '2' && c !== undefined) blk[b].s[c]++;
          if (lv === '3' && c !== undefined) blk[b].h[c]++;
          const inBook = (it.tags || []).some(t => t.rootTagId === 14 && t.value === BOOK);
          if (inBook) c === undefined ? book[5]++ : book[c]++;
          const li = LV[lv], ci = c === undefined ? 5 : c;
          if (li !== undefined) { allLv[li][ci]++; if (inBook) bookLv[li][ci]++; }
        }
      }
    }
    const S = z(), H = z();
    blk.forEach((x, i) => { if (RANGE[i]) for (let k = 0; k < 5; k++) { S[k] += x.s[k]; H[k] += x.h[k]; } });
    const blocks = blk.flatMap((x, i) => RANGE[i] ? [...x.s, ...x.h] : Array(10).fill('b'));
    const subRows = [...sub.values()].map(x => { const done = x.k[0] + x.k[1] + x.k[2] + x.k[3] + x.k[4] - x.ai;   // 완료 = 실제로 푼 문항(미응시·AI 예측 뺌)
      return [x.g, x.top, x.code, x.name, ...x.k, done, done > 0 ? Math.round(x.k[0] / done * 100) : '', x.ai, x.st, x.mid, x.pg]; });   // 이해율 = 초록 ÷ 완료 · 2.10.2 끝에 ★ 수 · 2.11.0 끝에 중단원
    return { log: [...S, ...H, ...blocks], book, anal: [...allLv.flat(), ...bookLv.flat()], nItems, sub: subRows };
  };

  // 2.11.0 학습 탭: course/dashboard/v2 응답(학습지마다 1개) → a=achLearn 한 수업 묶음. 줄 = [학생, studentId, 학습지id, 제출, 맞은수, 전체, 점수, 제출시각ms,
  //   다시풀기 제출, 맞은수, 전체, 점수, 오답유사 제출, 맞은수, 전체, 점수] (값이 없으면 빈 칸)
  const learnPack = (course, dash) => {
    const nv = x => (x === null || x === undefined ? '' : x), yn = x => (x ? 1 : 0), sheets = [], rows = [];
    for (const w of (Array.isArray(dash) ? dash : [])) {
      if (!w || w.textbookLearningId === undefined || w.textbookLearningId === null) continue;
      const id = w.textbookLearningId; sheets.push({ id, name: String(w.name || ''), unitCount: nv(w.unitCount) });
      for (const s of (w.students || [])) {
        const name = String(s.studentFullName || s.studentName || '').replace(/^BXe/, '').trim(); if (!name || s.studentId === undefined) continue;
        rows.push([name, s.studentId, id, yn(s.solved), nv(s.rightUnitCount), nv(s.unitCount), nv(s.score), nv(s.solvedAt),
          yn(s.wrongAnswerSolved), nv(s.wrongAnswerRightUnitCount), nv(s.wrongAnswerUnitCount), nv(s.wrongAnswerScore),
          yn(s.wrongTypeSolved), nv(s.wrongTypeRightUnitCount), nv(s.wrongTypeUnitCount), nv(s.wrongTypeScore)]);
      }
    }
    return { course: { id: course.id, title: String(course.title || '').trim() }, sheets, rows };
  };

  // ── 로그인 정보 확인·갱신 (2.8) ───────────────────────────
  const JWT_RE = /eyJ[\w-]+\.[\w-]+\.[\w-]+/;
  const jwtExp = t => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp || 0; } catch (e) { return 0; } };
  const curJwt = () => { for (const v of Object.values(AUTH || {})) { const m = String(v).match(JWT_RE); if (m) return m[0]; } return null; };
  function authFresh() {
    if (!AUTH) return false;
    const j = curJwt(), e = j ? jwtExp(j) : 0;
    if (e) return e * 1000 > Date.now() + 2 * 60000;          // 토큰 만료 시각을 직접 확인 (2분 여유)
    return Date.now() - authAt < 15 * 60000;                   // 만료 시각을 모르면 15분 기준
  }
  // 사이트가 브라우저 저장소에 갱신해 둔 토큰이 있으면 그걸로 바꿔 끼움
  function swapStoredJwt() {
    const cur = curJwt(); if (!cur) return false;
    let best = null, bexp = jwtExp(cur);
    const scan = s => { for (const t of (String(s || '').match(new RegExp(JWT_RE.source, 'g')) || [])) { const e = jwtExp(t); if (e > bexp) { bexp = e; best = t; } } };
    for (const st of [localStorage, sessionStorage]) { try { for (let i = 0; i < st.length; i++) scan(st.getItem(st.key(i))); } catch (e) {} }
    try { scan(decodeURIComponent(document.cookie)); } catch (e) {}
    if (!best) return false;
    for (const [k, v] of Object.entries(AUTH)) if (JWT_RE.test(String(v))) AUTH[k] = String(v).replace(JWT_RE, best);
    authAt = Date.now();
    return true;
  }
  // 보이지 않는 창으로 매쓰홀릭을 한 번 열어 새 로그인 헤더를 받아옴 (화면 새로고침 없이)
  function frameAuth() {
    return new Promise(res => {
      if (!document.body) return res(false);
      const t0 = authAt, f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;height:600px;border:0;opacity:0;pointer-events:none';
      f.src = location.origin + '/';
      let n = 0, iv;
      const fin = ok => { clearInterval(iv); try { f.remove(); } catch (e) {} res(ok); };
      iv = setInterval(() => { if (authAt > t0 && authFresh()) fin(true); else if (++n > 50) fin(false); }, 500);
      document.body.appendChild(f);
    });
  }
  async function ensureAuth(force) {
    if (!force && authFresh()) return true;
    if (swapStoredJwt() && authFresh()) return true;
    return frameAuth();
  }

  // ── 직접 요청 ──────────────────────────────────────────────
  // 2.13.0: 매쓰홀릭 접속 토큰 수명 330초 — 수집(수 분) 도중 만료돼 401로 통째로 멈추던 것 → 요청 전 낡았으면 갱신, 401·403이면 갱신 뒤 한 번 더
  const req = async (method, url, body, extra) => {
    if (!authFresh()) await ensureAuth(true);
    try { return await req0(method, url, body, extra); }
    catch (e) { if ((e === 401 || e === 403) && await ensureAuth(true)) return await req0(method, url, body, extra); throw e; }
  };
  const req0 = (method, url, body, extra) => new Promise((ok, no) => {
    const x = new XMLHttpRequest(); x.__mine = true;
    XO.call(x, method, url);
    x.withCredentials = true;
    for (const [k, v] of Object.entries({ ...(AUTH || {}), ...(extra || {}) })) XH.call(x, k, v);
    x.onload = () => x.status < 300 ? ok(JSON.parse(x.responseText)) : no(x.status);
    x.onerror = () => no('network');
    XS.call(x, body ?? null);
  });
  const FORM = { 'Content-Type': 'application/x-www-form-urlencoded' }, JSONH = { 'Content-Type': 'application/json' };
  const isAuthErr = e => e === 401 || e === 403;

  // ── 본 작업 ────────────────────────────────────────────────
  let running = false, busy = false;
  const isBusy = () => running || busy;
  async function runUpdate(mode, onStatus, reqId) {
    if (running) return { ok: false, msg: '이미 실행 중' };
    running = true;
    ls.set(LS.lock, String(Date.now()));
    try {
      if (!AUTH) return { ok: false, msg: '로그인 정보를 아직 못 잡음', auth: true, needReload: true };
      const queue = [...TEACHER_IDS], seenT = new Set(queue), all = new Map();
      while (queue.length && seenT.size < 40) {
        const tid = queue.shift();
        let list = [];
        try { list = await req('GET', `${API}/api/course/list/v2/teacher/${tid}/state/ACTIVE`); }
        catch (e) { if (isAuthErr(e)) return { ok: false, msg: '로그인 만료(' + e + ')', auth: true, needReload: true }; }
        for (const c of list) {
          all.set(c.id, c);
          for (const t of c.teachers || []) if (t.id && !seenT.has(t.id)) { seenT.add(t.id); queue.push(t.id); }
        }
      }
      if (!all.size) return { ok: false, msg: '반 목록을 못 받음', auth: true, needReload: true };
      const courses = [...all.values()].filter(c => /^\s*\[교과서\]/.test(c.title || ''));

      const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const best = new Map(), warn = [], courseInfo = [];   // 2.10.0: best 값에 cls(매쓰홀릭 반 이름)
      for (const c of courses) {
        const sc = SCHOOL.find(s => c.title.includes(s[0]));
        if (!sc) { warn.push(c.title + '(학교 매칭 실패)'); continue; }
        const [, school, RANGE, BOOK, SKIP] = sc;
        let students;
        try { students = await req('GET', `${API}/api/course/v2/${c.id}/students`); }
        catch (e) {
          if (isAuthErr(e)) return { ok: false, msg: '실행 중 로그인 만료(' + e + ')', auth: true, needReload: true };
          warn.push(c.title + '(학생 목록 ' + e + ')'); continue;
        }
        courseInfo.push(`${c.title.replace('[교과서]', '').trim()} ${students.length}`);
        for (const [i, st] of students.entries()) {
          const name = (st.fullName || st.name || '').replace(/^BXe/, '').trim();
          onStatus && onStatus(`${c.title} ${i + 1}/${students.length} ${name}`);
          const chapters = []; let stErr = 0;
          for (const ch of (c.rootChapterIds?.length ? c.rootChapterIds : CHAPTERS)) {
            const body = `unitGroupLevels=-1%2C1%2C2%2C3&nonPassFilters=UNITGROUP_STATEMENT&studentId=${st.id}&courseId=${c.id}`;
            try { chapters.push(await req('POST', `${API}/api/learningScore/v2/chapter/${ch}`, body, FORM)); }
            catch (e) {
              // 2.8: 중간에 로그인이 끊기면 0으로 덮어쓰지 않도록 전체 중단
              if (isAuthErr(e)) return { ok: false, msg: '실행 중 로그인 만료(' + e + ')', auth: true, needReload: true };
              stErr++;
            }
            await sleep(150);
          }
          if (stErr) { warn.push(name + '(일부 못 받음 — 이번엔 건너뜀)'); continue; }   // 반쪽 데이터로 덮어쓰지 않음
          const t = tally(chapters, RANGE, BOOK, SKIP || []);
          const prev = best.get(st.id);
          if (!prev || t.nItems > prev.t.nItems) best.set(st.id, { school, name, t, book: BOOK, cls: c.title.replace('[교과서]', '').trim() });
        }
      }
      // 2.10.1: 내신 수업 — 같은 학생이라도 수업마다 학습 자료가 따로라 그 수업으로 다시 받음. 소단원별 '내신' 줄만(옛 로그·분석엔 안 넣음)
      const naeSub = [], learns = [];
      for (const c of [...all.values()].filter(c => NAE_RE.test(c.title || ''))) {
        const title = String(c.title || '').trim();
        onStatus && onStatus(`${title} 학습 탭`);
        try { const dash = await req('POST', `${API}/api/course/dashboard/v2`, JSON.stringify({ courseId: c.id }), JSONH); const lp = learnPack(c, dash); if (lp.rows.length) learns.push(lp); }   // 2.11.0 학습 탭(한 수업 한 번)
        catch (e) { if (isAuthErr(e)) return { ok: false, msg: '실행 중 로그인 만료(' + e + ')', auth: true, needReload: true }; warn.push(title + '(학습 탭 ' + e + ')'); }
        await sleep(150);
        let students;
        try { students = await req('GET', `${API}/api/course/v2/${c.id}/students`); }
        catch (e) {
          if (isAuthErr(e)) return { ok: false, msg: '실행 중 로그인 만료(' + e + ')', auth: true, needReload: true };
          warn.push(title + '(학생 목록 ' + e + ')'); continue;
        }
        courseInfo.push(`${title} ${students.length}`);
        const tSch = SCHOOL.filter(s => title.includes(s[0]) && !SCHOOL.some(o => o !== s && o[0].startsWith(s[0]) && title.includes(o[0])));   // '사직'과 '사직여' 같은 겹침은 긴 쪽만
        for (const [i, st] of students.entries()) {
          const name = (st.fullName || st.name || '').replace(/^BXe/, '').trim();
          onStatus && onStatus(`${title} ${i + 1}/${students.length} ${name}`);
          const chapters = []; let stErr = 0;
          for (const ch of (c.rootChapterIds?.length ? c.rootChapterIds : CHAPTERS)) {
            const body = `unitGroupLevels=-1%2C1%2C2%2C3&nonPassFilters=UNITGROUP_STATEMENT&studentId=${st.id}&courseId=${c.id}`;
            try { chapters.push(await req('POST', `${API}/api/learningScore/v2/chapter/${ch}`, body, FORM)); }
            catch (e) { if (isAuthErr(e)) return { ok: false, msg: '실행 중 로그인 만료(' + e + ')', auth: true, needReload: true }; stErr++; }
            await sleep(150);
          }
          if (stErr) { warn.push(name + '(내신 수업 일부 못 받음 — 건너뜀)'); continue; }
          const m = new Map(), lvRows = tally(chapters, [0, 0, 0, 0, 0, 0], '', [], { all: true, six: true }).sub;   // 2.11.0 범위 안 거름 + 6단계   // 소단원 코드 → 개념·기본·실력·심화 합친 한 줄 ['내신', 대단원, 코드, 이름, 6색…, 완료, 이해율, AI]
          for (const x of lvRows) {
            if (x[0] === '교과서' || SIX_N.includes(x[0])) continue;   // 2.11.0 6단계 줄은 합친 줄에 안 셈(4단계와 겹침)
            const y = m.get(x[1] + '|' + x[2]) || ['내신', x[1], x[2], x[3], 0, 0, 0, 0, 0, 0, 0, '', 0, 0, x[14] || '', 0];
            for (let k = 4; k <= 10; k++) y[k] += x[k]; y[12] += x[12]; y[13] += x[13]; y[15] += x[15] || 0; m.set(x[1] + '|' + x[2], y);
          }
          const sc = (best.get(st.id) || {}).school || (tSch.length === 1 ? tSch[0][1] : '');   // 2.10.2: 수업 이름에 학교가 하나면 그 학교
          for (const y of m.values()) { y[11] = y[10] > 0 ? Math.round(y[4] / y[10] * 100) : ''; naeSub.push([name, sc, title, ...y]); }
          for (const x of lvRows) if (x[0] !== '교과서') naeSub.push([name, sc, title, '내신' + x[0], ...x.slice(1)]);   // 2.10.2: 난이도별(개념·기본·실력·심화) 따로 · 2.11.0 + 실력하·실력중·심화하·심화중
        }
      }
      const rows = [...best.values()].sort((a, b) => a.school.localeCompare(b.school) || a.name.localeCompare(b.name));
      rows.forEach(r => { if (!r.t.nItems) warn.push(r.name + '(데이터 없음)'); });
      if (!rows.length || rows.every(r => !r.t.nItems)) {   // 2.10.2: [교과서] 수업이 없어도 내신 수업 소단원별은 보냄(옛 내신로그는 건너뜀)
        if (!naeSub.length && !learns.length) return { ok: false, msg: '학생 데이터를 못 받음(로그인 만료 의심)', auth: true, needReload: true };
        const sub0 = await sendNew([], today, naeSub, learns);
        return { ok: sub0.ok, msg: '[교과서] 수업 학생 없음 — 내신로그 건너뜀 · ' + sub0.msg, info: courseInfo.join(' · '), warn };
      }
      const logRows = rows.map(r => [today, r.name, ...r.t.log, ...r.t.book]);
      const K6 = ['초록', '회색', '노랑', '빨강', '해골', '미응시'], LVN = ['개념', '기본', '실력', '심화'];
      const analHead = ['학생', '학교', '교과서', ...['전체', '교과서'].flatMap(g => LVN.flatMap(l => K6.map(k => `${g}_${l}_${k}`)))];
      const analRows = [analHead, ...rows.map(r => [r.name, r.school, r.book, ...r.t.anal])];

      const url = ls.get(LS.url);
      if (!URL_RE.test(url || '') || !hasTok()) { const s0 = await sendNew(rows, today, naeSub, learns); return { ok: s0.ok, msg: '옛 내신로그 주소 없음(건너뜀) · ' + s0.msg, rows: rows.length, info: courseInfo.join(' · '), warn }; }   // 2.10.2: 소단원별은 따로 · 2.11.0 새 전송이 되면 성공
      const payload = JSON.stringify({ token: TOKEN, log: logRows, anal: analRows, mode, reqId, v: VER, pc: PC });
      let res;
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload });
        res = await r.json();
      } catch (e) {
        await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload });
        res = { ok: true, added: '?', updated: '?' };
      }
      if (!res.ok) { const s0 = await sendNew(rows, today, naeSub, learns); return { ok: false, msg: '시트 오류: ' + res.error + ' · ' + s0.msg }; }   // 2.10.2: 옛 길이 실패해도 소단원별은 보냄
      const sub = await sendNew(rows, today, naeSub, learns);   // 2.10.0 (2.10.1 내신 수업 줄 더함 · 2.11.0 학습 탭): 소단원별(실패해도 옛 결과는 그대로)
      return { ok: true, msg: `${rows.length}명 · 새로 ${res.added} · 덮어쓰기 ${res.updated} · ` + sub.msg, info: courseInfo.join(' · '), warn };
    } catch (e) {
      return { ok: false, msg: '오류: ' + e };
    } finally {
      running = false;
      ls.del(LS.lock);
    }
  }

  // 2.10.0: 소단원별 → 선생님앱_API a=achSub. 빈 자료·열쇠 없음이면 보내지 않음
  const hasAch = () => /^[0-9a-f]{32}$/.test(ACH_KEY);
  const hasTok = () => !!TOKEN && !TOKEN.startsWith('<');
  let RUN = '';   // 2.13.0 한 번 실행 = 한 번호(서버가 이 번호로 숫자를 모아 대조)
  async function ping(op, extra) {   // 2.13.0 빠른 서버에만(옛 서버는 모름) — 실패해도 조용히
    const fast = ls.get('naesinFastUrl') || FAST_URL; if (fast === 'off' || !hasAch()) return null;
    try { return await (await fetch(fast, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ a: 'mhPing', op, k: ACH_KEY, v: VER, pc: PC, run: RUN }, extra || {})) })).json(); } catch (e) { return null; }
  }
  const whyOf = r => r.busy ? 'busy' : r.auth ? 'login' : /fetch|network|Failed|연결|timeout/i.test(String(r.msg || '')) ? 'network' : 'other';
  async function postAch(body) {   // 2.11.0 achSub·achLearn 같은 주소·같은 열쇠 — 연결 오류면 2초 뒤 한 번 더 · 2.12.0 빠른 서버 먼저, 안 되면 옛 서버로 한 번 더
    const url = ls.get('naesinAchUrl') || ACH_URL, fast = ls.get('naesinFastUrl') || FAST_URL, opt = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) };
    if (fast !== 'off') { let j = null; try { j = await (await fetch(fast, opt)).json(); } catch (e) { j = null; }
      if (j && (j.ok || j.error === 'empty' || j.error === 'arg')) return j; }   // 빠른 서버 실패(연결·시트 거울 실패·열쇠 다름) = 아래 옛 길
    try { return await (await fetch(url, opt)).json(); }
    catch (e) { await sleep(2000); return await (await fetch(url, opt)).json(); }
  }
  async function sendSub(rows, today, extra) {
    if (!hasAch()) return '열쇠 없음(안 보냄)';
    const data = rows.flatMap(r => (r.t.sub || []).map(s => [r.name, r.school, r.cls || '', ...s])).concat(extra || []);
    if (!data.length) return '자료 없음(안 보냄)';
    // 2.13.0: 3천 줄씩 나눠 보냄 — 1.7만 줄 한 번(약 2MB 넘음)은 빠른 서버가 받지 못해(본문 2MB 한도) 늘 옛 서버로만 갔음. 같은 열쇠 덮어쓰기라 나눠도 결과 같음
    const CH = 3000; let n = 0, ad = 0, up = 0; const bad = [];
    for (let i = 0; i < data.length; i += CH) {
      try { const j = await postAch({ a: 'achSub', k: ACH_KEY, d: today, v: VER, pc: PC, run: RUN, rows: data.slice(i, i + CH) });
        if (j.ok) { n += j.n || 0; ad += j.added || 0; up += j.updated || 0; } else bad.push(j.error); }
      catch (e) { bad.push(String(e)); }
    }
    return bad.length && !n ? '실패 ' + bad.join(', ') : `${n}줄(새 ${ad}·고침 ${up})` + (bad.length ? ' · 실패 ' + bad.length + '묶음' : '');
  }
  // 2.11.0 학습 탭 — 한 수업 = 한 요청. 결과 'n/m 수업'
  async function sendLearn(learns, today) {
    if (!hasAch()) return '열쇠 없음(안 보냄)';
    if (!learns.length) return '자료 없음(안 보냄)';
    let ok = 0, n = 0; const bad = [];
    for (const p of learns) {
      try { const j = await postAch({ a: 'achLearn', k: ACH_KEY, d: today, v: VER, pc: PC, run: RUN, course: p.course, sheets: p.sheets, rows: p.rows }); if (j.ok) { ok++; n += j.n || 0; } else bad.push(p.course.title + ' ' + j.error); }
      catch (e) { bad.push(p.course.title + ' ' + e); }
    }
    return `${ok}/${learns.length}수업 ${n}줄` + (bad.length ? ' · 실패 ' + bad.join(', ') : '');
  }
  async function sendNew(rows, today, naeSub, learns) {   // 2.11.0 소단원 + 학습 → {ok, msg}. 둘 다 '실패·열쇠 없음'이면 ok:false
    const a = await sendSub(rows, today, naeSub), b = await sendLearn(learns || [], today);
    // 2.13.0 보낸 숫자 → 서버가 받은·쓴 숫자와 대조(어긋나면 실행기록 ⚠) + 계산 기억 지움
    const subN = rows.reduce((n, r) => n + (r.t.sub || []).length, 0) + (naeSub || []).length;
    const learn = (learns || []).map(p => ({ cid: String(p.course && p.course.id), stu: new Set(p.rows.map(x => x[1])).size, sheets: p.sheets.length, rows: new Set(p.rows.map(x => x[1] + '|' + x[2])).size }));
    await ping('done', { meta: { sub: hasAch() ? subN : 0, learn } });
    const good = /^(실패|열쇠|자료 없음)/.test(a) ? false : true, goodL = /^\d+\//.test(b) && !/^0\//.test(b);
    return { ok: good || goodL, msg: '소단원 ' + a + ' · 학습 ' + b };
  }

  // 2.8: 모든 실행은 여기를 거침 — 실행 전 로그인 확인, 로그인 문제로 실패하면 새 헤더 받아 1회 재시도
  async function runSafe(mode, onStatus, reqId) {
    if (isBusy()) { const r0 = { ok: false, msg: '이미 실행 중', busy: true }; ping('fail', { why: 'busy' }); return r0; }
    busy = true; RUN = String(Date.now());
    try {
      onStatus && onStatus('🔑 로그인 확인 중…');
      if (!(await ensureAuth())) { ping('fail', { why: 'login' }); return { ok: false, msg: '로그인 정보를 갱신하지 못함 — 매쓰홀릭 로그인 상태를 확인하세요', auth: true, needReload: true }; }
      let r = await runUpdate(mode, onStatus, reqId);
      if (!r.ok && r.auth) {
        onStatus && onStatus('🔄 로그인 정보 갱신 후 다시 시도…');
        if (await ensureAuth(true)) r = await runUpdate(mode, onStatus, reqId);
      }
      if (!r.ok) await ping('fail', { why: whyOf(r) });   // 2.13.0 까닭을 서버에 — 다음 칸(15분)에서 다시
      return r;
    } finally { busy = false; }
  }

  // ── 기록 ───────────────────────────────────────────────────
  const stamp = () => { const d = new Date(); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const saveLast = (mode, r) => { ls.set(LS.last, JSON.stringify({ at: stamp(), mode, ok: r.ok, msg: r.msg })); if (r.ok) ls.set(LS.ok, String(Date.now())); };
  const lastText = () => { try { const l = JSON.parse(ls.get(LS.last)); return `${l.ok ? '✅' : '❌'} ${l.at} (${l.mode}) ${l.msg}`; } catch (e) { return '아직 실행 기록 없음'; } };
  const winText = L => L.map(x => x.join('~')).join('·');
  const scheduleText = () => `자동 ${SLOTS.join(', ')}` + (RUSH.on ? ` · 수업시간 ${RUSH.every}분(평일 ${winText(RUSH.win.wk)} · 토 ${winText(RUSH.win[6])} · 일 ${winText(RUSH.win[0])})` : '');

  // ── 버튼 ───────────────────────────────────────────────────
  let btn, info;
  function mountUI() {
    if (document.getElementById('naesin-upd')) return;
    if (ls.get('naesinShowBtn') !== '1' && URL_RE.test(ls.get(LS.url) || '')) return;   // 2.9: 주소가 있으면 버튼 없이 조용히
    const css = document.createElement('style');   // 인쇄할 때는 버튼·알림 숨김
    css.textContent = '@media print { #naesin-upd, .naesin-toast { display: none !important; } }';
    document.head.appendChild(css);
    const box = document.createElement('div');
    box.id = 'naesin-upd';
    box.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;font:12px sans-serif;display:flex;flex-direction:column;gap:4px;align-items:flex-start';
    btn = document.createElement('button');
    btn.textContent = '📊 내신 업데이트';
    btn.style.cssText = 'padding:8px 12px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:bold;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.25)';
    info = document.createElement('div');
    info.style.cssText = 'background:rgba(255,255,255,.95);border:1px solid #ccc;border-radius:6px;padding:4px 8px;max-width:420px';
    info.textContent = lastText() + ' · ' + scheduleText();
    info.title = '버튼 우클릭: 시트 URL 다시 설정';
    btn.onclick = () => manual();
    btn.oncontextmenu = e => { e.preventDefault(); askUrl(true); };
    box.append(btn, info);
    document.body.appendChild(box);
  }
  const setStatus = t => { if (info) info.textContent = t; };

  async function askUrl(force) {
    let url = ls.get(LS.url);
    if (!force && URL_RE.test(url || '')) return true;
    const u = (prompt('시트 웹 앱 URL(…/exec)을 붙여넣으세요', url || '') || '').trim();
    if (!URL_RE.test(u)) { if (u) alert('…/exec 로 끝나는 웹 앱 URL이 아닙니다.'); return false; }
    try { const j = await (await fetch(u)).json(); if (!j.ok) throw j; } catch (e) { alert('웹 앱 연결 실패: ' + JSON.stringify(e)); return false; }
    ls.set(LS.url, u); return true;
  }

  async function manual() {
    try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
    if (!hasAch() && !(await askUrl(false))) return;   // 2.11.0: 열쇠가 있으면 옛 주소 없이도 실행
    if (!btn) return;
    btn.disabled = true; btn.textContent = '⏳ 업데이트 중…';
    const r = await runSafe('수동', setStatus);
    saveLast('수동', r);
    btn.disabled = false; btn.textContent = '📊 내신 업데이트';
    setStatus(lastText());
    alert((r.ok ? '✅ ' : '❌ ') + r.msg + (r.info ? '\n\n' + r.info : '') + (r.warn && r.warn.length ? '\n\n확인: ' + r.warn.join(', ') : '') + (r.needReload ? '\n\n페이지를 새로고침(F5)한 뒤 다시 눌러 주세요.' : ''));
  }

  // ── 자동 실행 ──────────────────────────────────────────────
  const dkey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const getDone = () => { try { return JSON.parse(ls.get(LS.done)) || {}; } catch (e) { return {}; } };
  function dueSlot(now) {
    const done = getDone();
    for (const s of SLOTS) {
      const [h, m] = s.split(':').map(Number);
      const t = new Date(now); t.setHours(h, m, 0, 0);
      const k = dkey(now) + ' ' + s;
      if (now >= t && now - t < WINDOW_MIN * 60000 && !(done[k] && done[k].ok) && !((done[k] && done[k].tries) >= 3)) return k;
    }
    return null;
  }
  // 집중 모드: 지금이 속한 15분 칸 (이미 했거나 방금 성공했으면 null)
  function rushKey(now) {
    if (!RUSH.on) return null;
    const day = ymd(now), w = rushWin(now);
    const mins = now.getHours() * 60 + now.getMinutes();
    if (!w.some(x => { const [sh, sm] = x[0].split(':').map(Number), [eh, em] = x[1].split(':').map(Number); return mins >= sh * 60 + sm && mins < eh * 60 + em; })) return null;
    return day + ' ' + hm(Math.floor(mins / RUSH.every) * RUSH.every);
  }
  function rushDue(now) {
    const k = rushKey(now);
    if (!k || ls.get(LS.rushDone) === k) return null;
    if (Date.now() - Number(ls.get(LS.ok) || 0) < (RUSH.every - 3) * 60000) { ls.set(LS.rushDone, k); return null; }   // 방금 다른 경로로 성공 → 이번 칸 생략
    return k;
  }
  const idle = () => Date.now() - lastInput > 10 * 60000;

  async function tick(now = new Date()) {
    if (isBusy()) return;
    if (Date.now() - Number(ls.get(LS.lock) || 0) < 10 * 60000) return;   // 다른 탭에서 실행 중
    const k = dueSlot(now);
    if (k) return runSlot(k, now);
    const rk = rushDue(now);
    if (rk) return runRush(rk);
    return catchUp(now);
  }

  async function runSlot(k, now) {
    const done = getDone();
    done[k] = { ...(done[k] || {}), tries: ((done[k] && done[k].tries) || 0) + 1 };
    ls.set(LS.done, JSON.stringify(done));
    // 2.8: 새로고침 없이 먼저 갱신해 보고, 안 될 때만(자리 비움일 때) 새로고침
    if (!(await ensureAuth()) && ls.get(LS.pending) !== k && idle()) { ls.set(LS.pending, k); location.reload(); return; }
    ls.del(LS.pending);
    const r = await runSafe('자동', setStatus);
    saveLast('자동', r);
    setStatus(lastText());
    const d2 = getDone(); d2[k] = { ...(d2[k] || {}), ok: r.ok };
    for (const key of Object.keys(d2)) if (!key.startsWith(dkey(now))) delete d2[key];   // 오늘 것만 보관
    ls.set(LS.done, JSON.stringify(d2));
    if (r.ok) { const rk = rushKey(now); if (rk) ls.set(LS.rushDone, rk); }   // 22:00처럼 겹치는 칸은 한 번만
  }

  async function runRush(k) {
    ls.set(LS.rushDone, k);   // 한 칸당 1회. 실패해도 다음 칸에서 다시
    if (!URL_RE.test(ls.get(LS.url) || '') && !hasAch()) return;   // 2.11.0
    if (!(await ensureAuth())) { ping('fail', { why: 'login' }); setStatus(`⏸ 집중 ${k.slice(11)} 건너뜀 — 로그인 확인 안 됨 · ` + lastText()); return; }   // 로그아웃 상태면 조용히
    const r = await runSafe('집중', setStatus);
    saveLast('집중', r);
    setStatus(lastText());
  }

  // 컴퓨터가 꺼져 있어 놓친 경우: 탭을 열었을 때 마지막 성공이 오래됐으면 한 번만 조용히 실행 (1시간에 한 번까지만 시도)
  async function catchUp() {
    const lastOk = Number(ls.get(LS.ok) || 0), lastTry = Number(ls.get(LS.catchTry) || 0);
    if (!AUTH || (!URL_RE.test(ls.get(LS.url) || '') && !hasAch())) return;   // 2.11.0
    if (Date.now() - lastOk < CATCHUP_H * 3600000 || Date.now() - lastTry < 3600000) return;
    ls.set(LS.catchTry, String(Date.now()));
    const r = await runSafe('밀린 업데이트', setStatus);
    saveLast('밀린 업데이트', r);
    setStatus(lastText());
  }

  // ── 알림: 화면 오른쪽 아래 알림 + (허용했다면) 윈도우 알림 ──────
  function notify(title, body) {
    try {
      const t = document.createElement('div');
      t.className = 'naesin-toast';
      t.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:100000;background:#111;color:#fff;padding:10px 14px;border-radius:8px;font:13px sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.3);max-width:360px';
      t.innerHTML = `<b>${title}</b><div style="margin-top:4px;opacity:.85">${body || ''}</div>`;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 15000);
    } catch (e) {}
    try { if (window.Notification && Notification.permission === 'granted') new Notification(title, { body: body || '' }); } catch (e) {}
  }

  // ── 시트 버튼 요청 확인 (1분마다) ─────────────────────────
  async function poll() {
    const url = ls.get(LS.url);
    if (isBusy() || !URL_RE.test(url || '') || !hasTok()) return;
    let j;
    try { j = await (await fetch(url + '?action=poll&token=' + TOKEN)).json(); } catch (e) { return; }
    const reqId = Number(j && j.req || 0);
    if (!reqId || reqId <= Number(ls.get(LS.reqDone) || 0)) return;
    if (Date.now() - Number(ls.get(LS.lock) || 0) < 10 * 60000) return;   // 다른 탭이 처리 중
    ls.set(LS.reqDone, String(reqId));
    const who = (j.who || '누군가');
    notify(`📥 ${who} 선생님이 업데이트 요청`, '수락 없이 바로 진행합니다…');
    const r = await runSafe(`시트 요청·${who}`, setStatus, reqId);   // 2.8: 로그인 확인·재시도 포함
    saveLast(`시트 요청·${who}`, r);
    notify(r.ok ? `✅ ${who} 선생님 요청 처리 완료` : `❌ ${who} 선생님 요청 처리 실패`, r.msg);
    setStatus(lastText());
    if (!r.ok) {
      try { await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: TOKEN, reqId, statusOnly: '❌ 업데이트 실패 ' + stamp() + ' · ' + r.msg + ' — 매쓰홀릭을 새로고침한 뒤 다시 누르세요' }) }); } catch (e) {}
    }
  }

  window.__naesin = { run: runSafe, tick, dueSlot, rushKey, poll, ensureAuth, authFresh };   // 점검용
  const start = () => {
    if (!hasAch() && !hasTok()) { console.log('[내신업데이트 ' + VER + '] 열쇠 없음 — 멈춤'); return; }   // 2.13.0: 열쇠가 없으면 버튼·자동 실행 모두 안 함
    mountUI();
    const waitAuth = async () => { for (let i = 0; i < 60 && !AUTH; i++) await sleep(1000); };
    waitAuth().then(() => tick());
    setInterval(() => tick(), 30000);
    setInterval(() => poll(), 60000);
    setTimeout(() => poll(), 5000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
