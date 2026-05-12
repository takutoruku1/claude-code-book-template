/* ============================================================
   TITLE BGM
============================================================ */
function _playTitleBgm() {
  const bgm = document.getElementById('titleBgm');
  if (!bgm) return;
  bgm.volume = _getBgmVolume();
  bgm.currentTime = 0;
  bgm.play().catch(() => {});
  const design = document.getElementById('screen-title')?.dataset.design;
  if (design === 'new') { _startTsTimeline(); _startTsTyper(); }
}
function _stopTitleBgm() {
  const bgm = document.getElementById('titleBgm');
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
}
function _getBgmVolume() {
  return parseFloat(localStorage.getItem('bgmVolume') ?? '0.7');
}

function onBgmVolumeChange(val) {
  const v = val / 100;
  localStorage.setItem('bgmVolume', v);
  const bgm = document.getElementById('titleBgm');
  if (bgm) bgm.volume = v;
  ['bgmVolumeVal','tsBgmVal'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = val; });
  ['bgmVolumeSlider','tsBgmSlider'].forEach(id => { const el = document.getElementById(id); if (el) el.value = val; });
  const fill = document.getElementById('tsBgmFill');
  if (fill) fill.style.width = val + '%';
}

function toggleTitleSettings() {
  const btn   = document.querySelector('.title-settings-btn');
  const panel = document.getElementById('titleSettingsPanel');
  btn?.classList.toggle('open');
  panel?.classList.toggle('open');
}

function toggleTsOptions() {
  const drawer = document.getElementById('tsDrawer');
  const arrow  = document.getElementById('tsOptArrow');
  drawer?.classList.toggle('open');
  if (arrow) arrow.textContent = drawer?.classList.contains('open') ? '∨' : '›';
}

function toggleDesktopTheme() {
  const isClassic = document.body.classList.toggle('ui-classic');
  localStorage.setItem('buzzutter_ui_theme', isClassic ? 'classic' : 'game');
  const btn = document.getElementById('uiThemeBtn');
  if (btn) btn.textContent = isClassic ? 'ゲーム風に切り替え' : 'クラシックに切り替え';
}

function toggleTitleDesign() {
  const el = document.getElementById('screen-title');
  if (!el) return;
  const cur = el.dataset.design;
  const next = cur === 'new' ? 'old' : cur === 'old' ? 'v3' : 'new';
  el.dataset.design = next;
  localStorage.setItem('titleDesign', next);
  if (next === 'new') {
    _startTsTimeline();
    _startTsTyper();
  }
}

/* ============================================================
   TITLE SCREEN v2 — TIMELINE & TYPER
============================================================ */
const _TS_POSTS = [
  { name: '田中みどり',    handle: '@midori_everyday', text: '今日もゼラニウム咲いた\nなんか元気もらえる',          stats: ['♥ 142', '💬 8'] },
  { name: '水無月 朔',    handle: '@saku_craft',       text: '今日で237時間。まだ屋根が合わない',                  stats: ['♥ 38',  '💬 14'] },
  { name: '喫茶ゆきわりそう', handle: '@yukiwarisou',   text: '今日のおすすめ：気分次第',                          stats: ['♥ 61',  '🔁 9'] },
  { name: '篠宮 花蓮',    handle: '@karen_ikebana',    text: '「姉に見せたくて活けた」',                           stats: ['♥ 29',  '💬 4'] },
  { name: 'バズハンター',  handle: '@buzz_hunter',      text: '100日チャレンジ応援！フォローしました！',             stats: ['♥ 5',   '🔁 2'] },
  { name: 'SNS運用Tips',  handle: '@insta_tips99',      text: 'リールも作るといいですよ！伸びます',                 stats: ['♥ 11'] },
  { name: '匿名希望',      handle: '@anon_2026',        text: 'バズってるけどなんか投稿は…ちがう',                  stats: ['♥ 1.2k', '🔁 410', '🔥 HOT'] },
  { name: '依頼主A',      handle: '@client_a',          text: '次の投稿、もう少し「私らしく」できますか？',          stats: ['DM'] },
  { name: 'FOLLOW4FOLLOW', handle: '@follow4follow',    text: 'フォローバックお願いします！！',                     stats: ['♥ 0', '💬 38'] },
  { name: 'ゆめ',          handle: '@yume_sns',         text: '#今日のメモ  #静か  #日常の記録',                   stats: ['♥ 67'] },
];
const _TS_COLORS = ['#a06bff','#ff5fa2','#5a9bff','#7fc2ff','#ff8c5a'];
let _tsTlInterval = null, _tsTlCards = [];

function _spawnTsCard(tl, immediate) {
  const p = _TS_POSTS[Math.floor(Math.random() * _TS_POSTS.length)];
  const card = document.createElement('div');
  card.className = 'ts-tl-card';
  const dur   = 24 + Math.random() * 14;
  const drift = (Math.random() * 60 - 30) + 'px';
  const left  = Math.random() * 100;
  const color = _TS_COLORS[Math.floor(Math.random() * _TS_COLORS.length)];
  card.style.cssText = `left:calc(${left}% - 105px); animation-duration:${dur}s; --ts-drift:${drift};`;
  if (immediate) card.style.animationDelay = `-${Math.random() * dur}s`;
  card.innerHTML = `
    <div class="ts-tl-head">
      <div class="ts-tl-avatar" style="background:${color}">${p.name.charAt(0)}</div>
      <div><div class="ts-tl-name">${p.name}</div><div class="ts-tl-handle">${p.handle}</div></div>
    </div>
    <div class="ts-tl-text">${p.text.replace(/\n/g,'<br>')}</div>
    <div class="ts-tl-stats">${p.stats.map(s=>`<span class="${s.includes('HOT')?'ts-hot':''}">${s}</span>`).join('')}</div>`;
  tl.appendChild(card);
  _tsTlCards.push(card);
  setTimeout(() => { card.remove(); _tsTlCards = _tsTlCards.filter(c=>c!==card); }, dur * 1000 + 500);
}

function _startTsTimeline() {
  const tl = document.getElementById('tsTimeline');
  if (!tl) return;
  tl.innerHTML = '';
  clearInterval(_tsTlInterval);
  _tsTlCards = [];
  for (let i = 0; i < 6; i++) _spawnTsCard(tl, true);
  _tsTlInterval = setInterval(() => _spawnTsCard(tl, false), 2600);
}

const _TS_TYPER_LINES = [
  '依頼主のことばを解読中…',
  '下書きを保存しました',
  'ハッシュタグを選択中…',
  '#今日のメモ  投稿予約しました',
  'この人らしさ、まだ掴めない',
  '142件の通知があります',
  '深夜のDMに既読がついた',
  '本日の投稿スケジュール · 3本',
  '「私」を「言葉」に翻訳する',
  '依頼主Aからの新しいメッセージ',
];
let _tsTyTyping = false;

function _startTsTyper() {
  if (_tsTyTyping) return;
  _tsTyTyping = true;
  const el = document.getElementById('tsTyper');
  if (!el) { _tsTyTyping = false; return; }
  let idx = 0;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    while (_tsTyTyping) {
      const line = _TS_TYPER_LINES[idx % _TS_TYPER_LINES.length];
      for (let i = 0; i <= line.length; i++) {
        if (!_tsTyTyping) return;
        el.textContent = line.slice(0, i);
        await sleep(44 + Math.random() * 38);
      }
      await sleep(2200);
      for (let i = line.length; i >= 0; i--) {
        if (!_tsTyTyping) return;
        el.textContent = line.slice(0, i);
        await sleep(18);
      }
      await sleep(380);
      idx++;
    }
  })();
}

/* ============================================================
   MINATO WIDGET（タイトル画面・全ルートクリア後に出現）
============================================================ */
function _showMinatoWidget() {
  const w = document.getElementById('minatoWidget');
  if (!w || !w.hidden) return;
  w.hidden = false;
  _startMinatoWidgetTyper();
}

function _startMinatoWidgetTyper() {
  const el = document.getElementById('minatoWidgetTyper');
  if (!el) return;
  const text = '全セッション記録を確認しました。\n再起動しますか？';
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, i);
    if (i < text.length) { i++; setTimeout(tick, 46 + Math.random() * 34); }
  };
  setTimeout(tick, 700);
}

function showMinatoUnlockOverlay(callback) {
  document.querySelector('.minato-unlock-overlay')?.remove();

  const ov = document.createElement('div');
  ov.className = 'minato-unlock-overlay';
  ov.innerHTML = `
    <div class="muo-sys-header">BUZZUTTER SYSTEM v4.1.0<br>ROUTE_MINATO — INITIALIZATION</div>
    <div class="muo-main-text">
      <span id="muoTyper"></span><span class="muo-cursor"></span>
    </div>
    <button class="muo-confirm-btn" id="muoConfirmBtn" style="display:none">はい — MINATOルートを開始</button>
  `;
  document.body.appendChild(ov);

  const lines = [
    { text: '湊 AI v2.3.1', cls: '' },
    { text: '診断を開始します。', cls: '' },
    { text: '> 依頼者: 存在しません', cls: 'muo-log-line' },
    { text: '> スコア軸: 再定義中', cls: 'muo-log-line' },
    { text: '> 感情ログ: 3年分 残存', cls: 'muo-log-line' },
    { text: '再起動しますか？', cls: 'muo-restart-prompt' },
  ];

  const typerEl = document.getElementById('muoTyper');
  const btnEl   = document.getElementById('muoConfirmBtn');
  let lineIdx = 0;
  let charIdx = 0;
  let currentSpan = null;

  function nextLine() {
    if (lineIdx >= lines.length) {
      setTimeout(() => { btnEl.style.display = ''; }, 400);
      btnEl.onclick = () => {
        ov.classList.add('dismissing');
        setTimeout(() => { ov.remove(); if (callback) callback(); }, 800);
      };
      return;
    }
    const { text, cls } = lines[lineIdx++];
    currentSpan = document.createElement('span');
    if (cls) currentSpan.className = cls;
    typerEl.appendChild(currentSpan);
    charIdx = 0;
    typeChar(text);
  }

  function typeChar(text) {
    if (charIdx <= text.length) {
      currentSpan.textContent = text.slice(0, charIdx++);
      setTimeout(() => typeChar(text), 28 + Math.random() * 20);
    } else {
      typerEl.appendChild(document.createElement('br'));
      const pause = lines[lineIdx - 1].cls === 'muo-restart-prompt' ? 200 : 320;
      setTimeout(nextLine, pause);
    }
  }

  setTimeout(nextLine, 1500);
}

function startMinatoRoute() {
  _stopTitleBgm();
  document.getElementById('screen-title').classList.remove('active');
  const overlay = document.getElementById('boot-overlay');
  if (overlay) overlay.classList.add('active');
  window.IS_DEBUG_MODE        = false;
  window.appIsRunning         = true;
  window.appMinimized         = false;
  window.chatMinimized        = false;
  window.MAIN_MODE_ROUTES     = null;
  window.MAIN_MODE_ROUTE_INDEX = null;
  setTimeout(() => {
    if (overlay) overlay.classList.add('fading');
    const appWin = document.getElementById('appWindow');
    if (appWin) appWin.classList.add('active');
    if (typeof updateTaskbarIndicators === 'function') updateTaskbarIndicators();
    if (typeof resetGame === 'function') resetGame('minato');
    setTimeout(() => { if (overlay) overlay.classList.remove('active', 'fading'); }, 700);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedDesign = localStorage.getItem('titleDesign') || 'new';
  const titleEl = document.getElementById('screen-title');
  if (titleEl) titleEl.dataset.design = savedDesign;

  // デスクトップUIテーマを復元
  const savedUiTheme = localStorage.getItem('buzzutter_ui_theme');
  if (savedUiTheme === 'classic') {
    document.body.classList.add('ui-classic');
    const btn = document.getElementById('uiThemeBtn');
    if (btn) btn.textContent = 'ゲーム風に切り替え';
  }

  const vol = Math.round(_getBgmVolume() * 100);
  ['bgmVolumeSlider','tsBgmSlider'].forEach(id => { const el = document.getElementById(id); if (el) el.value = vol; });
  ['bgmVolumeVal','tsBgmVal'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = vol; });
  const fill = document.getElementById('tsBgmFill');
  if (fill) fill.style.width = vol + '%';

  if (!titleEl?.classList.contains('active')) return;

  if (savedDesign === 'new') {
    _startTsTimeline();
    _startTsTyper();
  }

  if (typeof isAllRoutesClear === 'function' && isAllRoutesClear()) {
    _showMinatoWidget();
  }

  const bgm = document.getElementById('titleBgm');
  if (!bgm) return;
  bgm.volume = _getBgmVolume();
  bgm.play().catch(() => {
    const start = () => { _playTitleBgm(); document.removeEventListener('click', start); };
    document.addEventListener('click', start);
  });
});
