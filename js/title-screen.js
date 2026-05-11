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

function toggleTitleDesign() {
  const el = document.getElementById('screen-title');
  if (!el) return;
  const next = (el.dataset.design === 'new') ? 'old' : 'new';
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
  { name: '倉田 朔',      handle: '@saku_craft',       text: '今日で237時間。まだ屋根が合わない',                  stats: ['♥ 38',  '💬 14'] },
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

document.addEventListener('DOMContentLoaded', () => {
  const savedDesign = localStorage.getItem('titleDesign') || 'new';
  const titleEl = document.getElementById('screen-title');
  if (titleEl) titleEl.dataset.design = savedDesign;

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

  const bgm = document.getElementById('titleBgm');
  if (!bgm) return;
  bgm.volume = _getBgmVolume();
  bgm.play().catch(() => {
    const start = () => { _playTitleBgm(); document.removeEventListener('click', start); };
    document.addEventListener('click', start);
  });
});
