/* ============================================================
   WINDOW MANAGER — bringToFront, drag, resize, snap
============================================================ */
let _zTop = 100;
let _protagTrackedWin = null;
let _lastFocusedWinId = null;
let _winFocusCooldown = null;

function bringToFront(el) {
  if (document.body.classList.contains('mobile-mode')) return;
  el.style.zIndex = ++_zTop;
  moveProtagWidgetToWindow(el);

  const winId = el.id;

  if (winId === 'yWindow') {
    if (typeof renderYTimeline === 'function') renderYTimeline('recommend');
  }
  if (winId !== 'chatWindow') {
    if (typeof clearProtagChoices === 'function') clearProtagChoices();
  } else if (_lastFocusedWinId !== 'chatWindow') {
    if (window.appIsRunning && GS?.route && typeof chatOpenThread === 'function') {
      setTimeout(() => chatOpenThread(GS.route), 100);
    }
  }

  if (winId && winId !== _lastFocusedWinId && !_winFocusCooldown) {
    _lastFocusedWinId = winId;
    if (typeof setMood === 'function') setMood('neutral');
    _winFocusCooldown = setTimeout(() => { _winFocusCooldown = null; }, 3500);
  }
}

function _protagTargetPos(winEl) {
  const rect     = winEl.getBoundingClientRect();
  const taskbarH = 48;
  const w        = document.getElementById('protagonistWidget');
  const wW       = (w ? w.offsetWidth  : 60) || 60;

  let left   = rect.right - wW * 0.6;
  let bottom = window.innerHeight - rect.bottom;

  left   = Math.max(0, Math.min(left, window.innerWidth - wW));
  bottom = Math.max(taskbarH, bottom);
  return { left, bottom };
}

function moveProtagWidgetToWindow(winEl) {
  const w = document.getElementById('protagonistWidget');
  if (!w || !w.classList.contains('visible')) return;
  const rect = winEl.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  _protagTrackedWin = winEl;
  const { left, bottom } = _protagTargetPos(winEl);
  w.classList.add('tracking', 'moving');
  w.style.transition = '';
  w.style.top    = 'auto';
  w.style.left   = left   + 'px';
  w.style.bottom = bottom + 'px';
  const onEnd = () => { w.classList.remove('moving'); w.removeEventListener('transitionend', onEnd); };
  w.addEventListener('transitionend', onEnd);
}

function _protagFollowNow(winEl) {
  const w = document.getElementById('protagonistWidget');
  if (!w || !w.classList.contains('visible')) return;
  _protagTrackedWin = winEl;
  const { left, bottom } = _protagTargetPos(winEl);
  w.style.top    = 'auto';
  w.style.left   = left   + 'px';
  w.style.bottom = bottom + 'px';
}

document.addEventListener('DOMContentLoaded', () => {
  ['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow', 'minesweeperWindow', 'invadersWindow', 'trashWindow', 'yWindow'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('mousedown', () => bringToFront(el));
  });
  updateTaskbarIndicators();
});

/* ===== SNAP FEATURE ===== */
const preSnapData = new WeakMap();
const snapPreviewEl = document.getElementById('snapPreview');
let currentSnapZone = null;

function getSnapZone(x, y) {
  const W = window.innerWidth;
  const EDGE = 14;
  if (y <= 2)          return 'full';
  if (x <= EDGE)       return 'left';
  if (x >= W - EDGE)   return 'right';
  return null;
}

function getSnapRect(zone) {
  const th = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')) || 48;
  const H = window.innerHeight - th;
  const W = window.innerWidth;
  if (zone === 'left')  return { left: 0,     top: 0, width: W / 2, height: H };
  if (zone === 'right') return { left: W / 2, top: 0, width: W / 2, height: H };
  if (zone === 'full')  return { left: 0,     top: 0, width: W,     height: H };
  return null;
}

function showSnapPreview(zone) {
  if (zone === currentSnapZone) return;
  currentSnapZone = zone;
  const r = getSnapRect(zone);
  if (!r) { hideSnapPreview(); return; }
  snapPreviewEl.style.left   = r.left   + 'px';
  snapPreviewEl.style.top    = r.top    + 'px';
  snapPreviewEl.style.width  = r.width  + 'px';
  snapPreviewEl.style.height = r.height + 'px';
  snapPreviewEl.style.display = 'block';
}

function hideSnapPreview() {
  currentSnapZone = null;
  snapPreviewEl.style.display = 'none';
}

function setSnapBtnState(windowEl, zone) {
  const btnId = windowEl.id === 'appWindow'    ? 'maxBtnApp'  :
                windowEl.id === 'chatWindow'    ? 'maxBtnChat' :
                windowEl.id === 'memoAppWindow' ? 'maxBtnMemo' : null;
  if (!btnId) return;
  const wrap = document.getElementById(btnId).closest('.snap-btn-wrap');
  if (!wrap) return;
  if (zone) wrap.setAttribute('data-snap', zone);
  else wrap.removeAttribute('data-snap');
}

function applySnap(windowEl, zone) {
  if (zone === 'full') {
    windowEl.classList.add('maximized');
    const btnId = windowEl.id === 'appWindow'    ? 'maxBtnApp'  :
                  windowEl.id === 'chatWindow'    ? 'maxBtnChat' :
                  windowEl.id === 'memoAppWindow' ? 'maxBtnMemo' : null;
    if (btnId) document.getElementById(btnId).innerHTML = '&#x29C9;';
    windowEl.removeAttribute('data-snapped');
    setSnapBtnState(windowEl, 'full');
    return;
  }
  if (windowEl.classList.contains('maximized')) {
    const btnId = windowEl.id === 'appWindow'    ? 'maxBtnApp'  :
                  windowEl.id === 'chatWindow'    ? 'maxBtnChat' :
                  windowEl.id === 'memoAppWindow' ? 'maxBtnMemo' : null;
    windowEl.classList.remove('maximized');
    if (btnId) document.getElementById(btnId).innerHTML = '&#x25A1;';
  }
  const r = getSnapRect(zone);
  windowEl.style.position = 'fixed';
  windowEl.style.margin   = '0';
  windowEl.style.right    = 'auto';
  windowEl.style.bottom   = 'auto';
  windowEl.style.left     = r.left   + 'px';
  windowEl.style.top      = r.top    + 'px';
  windowEl.style.width    = r.width  + 'px';
  windowEl.style.height   = r.height + 'px';
  windowEl.setAttribute('data-snapped', zone);
  setSnapBtnState(windowEl, zone);
}

function snapLayout(windowId, zone, e) {
  e.stopPropagation();
  const win = document.getElementById(windowId);
  if (!win.getAttribute('data-snapped')) {
    const r = win.getBoundingClientRect();
    preSnapData.set(win, { left: r.left, top: r.top, width: r.width, height: r.height });
  }
  applySnap(win, zone);
}

/* ===== DRAG DIALOGUE HELPERS ===== */
let _dragSpeechTimer = null;
let _dragActive = false;
function _onDragStart() {
  if (_dragActive) return;
  _dragActive = true;
  const w = document.getElementById('protagonistWidget');
  if (w) w.classList.add('drag-following');
  clearTimeout(_dragSpeechTimer);
}
function _onDragEnd() {
  if (!_dragActive) return;
  _dragActive = false;
  const w = document.getElementById('protagonistWidget');
  if (w) w.classList.remove('drag-following');
  clearTimeout(_dragSpeechTimer);
}

/* ===== GAME EVENT LISTENER ===== */
const _GAME_MOOD = {
  'invaders:start': 'focused', 'invaders:playerHit': 'nervous', 'invaders:gameover': 'quiet',
  'invaders:win': 'happy', 'invaders:ufo': 'shaken',
  'ms:start': 'focused', 'ms:lose': 'quiet', 'ms:win': 'happy',
  'sol:start': 'focused', 'sol:foundation': 'neutral', 'sol:win': 'happy',
};
document.addEventListener('gameEvent', (e) => {
  const mood = _GAME_MOOD[e.detail?.type];
  if (mood && typeof setMood === 'function') setMood(mood);
});

/* ===== DRAGGABLE WINDOWS ===== */
function makeDraggable(windowEl) {
  const titlebar = windowEl.querySelector('.titlebar');
  if (!titlebar) return;

  let dragging = false;
  let ox = 0, oy = 0;

  titlebar.addEventListener('mousedown', (e) => {
    if (document.body.classList.contains('mobile-mode')) return;
    if (e.target.closest('.titlebar-winbtn')) return;
    if (windowEl.classList.contains('maximized')) return;

    const isSnapped = windowEl.getAttribute('data-snapped');
    const rect = windowEl.getBoundingClientRect();

    if (isSnapped) {
      const pre = preSnapData.get(windowEl);
      const restoreW = pre ? pre.width  : rect.width;
      const restoreH = pre ? pre.height : rect.height;
      const relX = (e.clientX - rect.left) / rect.width;
      const newLeft = e.clientX - relX * restoreW;
      windowEl.style.position = 'fixed';
      windowEl.style.margin   = '0';
      windowEl.style.right    = 'auto';
      windowEl.style.bottom   = 'auto';
      windowEl.style.width    = restoreW + 'px';
      windowEl.style.height   = restoreH + 'px';
      windowEl.style.left     = newLeft + 'px';
      windowEl.style.top      = rect.top + 'px';
      windowEl.removeAttribute('data-snapped');
      setSnapBtnState(windowEl, null);
      ox = e.clientX - newLeft;
      oy = e.clientY - rect.top;
    } else {
      windowEl.style.position = 'fixed';
      windowEl.style.margin   = '0';
      windowEl.style.right    = 'auto';
      windowEl.style.bottom   = 'auto';
      windowEl.style.width    = rect.width  + 'px';
      windowEl.style.left     = rect.left   + 'px';
      windowEl.style.top      = rect.top    + 'px';
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
    }

    dragging = true;
    titlebar.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    e.preventDefault();
    _onDragStart();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const x = e.clientX - ox;
    const y = Math.max(0, e.clientY - oy);
    windowEl.style.left = x + 'px';
    windowEl.style.top  = y + 'px';
    const zone = getSnapZone(e.clientX, e.clientY);
    if (zone) showSnapPreview(zone);
    else hideSnapPreview();
    _protagFollowNow(windowEl);
  });

  document.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    titlebar.style.cursor = '';
    document.body.style.userSelect = '';
    const zone = getSnapZone(e.clientX, e.clientY);
    if (zone) {
      const r = windowEl.getBoundingClientRect();
      preSnapData.set(windowEl, { left: r.left, top: r.top, width: r.width, height: r.height });
      applySnap(windowEl, zone);
    }
    hideSnapPreview();
    _onDragEnd();
  });
}

['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow', 'trashWindow', 'yWindow'].forEach(id => {
  makeDraggable(document.getElementById(id));
});

// .titlebar を持たないゲームウィンドウ用の汎用ドラッグヘルパー
function _makeGameWinDraggable(winId, barSelector) {
  const win = document.getElementById(winId);
  if (!win) return;
  const bar = win.querySelector(barSelector);
  if (!bar) return;
  bar.style.cursor = 'grab';
  let dragging = false, ox = 0, oy = 0;
  bar.addEventListener('mousedown', (e) => {
    if (document.body.classList.contains('mobile-mode')) return;
    if (e.target.closest('button')) return;
    const r = win.getBoundingClientRect();
    win.style.position  = 'fixed';
    win.style.margin    = '0';
    win.style.transform = 'none';
    win.style.left = r.left + 'px';
    win.style.top  = r.top  + 'px';
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    dragging = true;
    bar.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    e.preventDefault();
    _onDragStart();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    win.style.left = (e.clientX - ox) + 'px';
    win.style.top  = Math.max(0, e.clientY - oy) + 'px';
    _protagFollowNow(win);
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    bar.style.cursor = 'grab';
    document.body.style.userSelect = '';
    _onDragEnd();
  });
}

_makeGameWinDraggable('minesweeperWindow', '.ms-titlebar');
_makeGameWinDraggable('invadersWindow',    '.inv-titlebar');
_makeGameWinDraggable('solitaireWindow',   '.inv-titlebar');

/* ===== RESIZABLE WINDOWS ===== */
function makeResizable(windowEl) {
  const DIRS = ['n','ne','e','se','s','sw','w','nw'];
  const MIN_W = 280, MIN_H = 200;

  DIRS.forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `resize-handle rh-${dir}`;
    windowEl.appendChild(handle);

    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      if (windowEl.classList.contains('maximized')) return;

      const sx = e.clientX, sy = e.clientY;
      const r  = windowEl.getBoundingClientRect();

      windowEl.style.position = 'fixed';
      windowEl.style.margin   = '0';
      windowEl.style.right    = 'auto';
      windowEl.style.bottom   = 'auto';
      windowEl.style.left     = r.left   + 'px';
      windowEl.style.top      = r.top    + 'px';
      windowEl.style.width    = r.width  + 'px';
      windowEl.style.height   = r.height + 'px';

      document.body.style.userSelect = 'none';
      const prevCursor = document.body.style.cursor;
      document.body.style.cursor = getComputedStyle(handle).cursor;

      function onMove(ev) {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        let l = r.left, t = r.top, w = r.width, h = r.height;

        if (dir.includes('e')) w = Math.max(MIN_W, r.width + dx);
        if (dir.includes('s')) h = Math.max(MIN_H, r.height + dy);
        if (dir.includes('w')) {
          w = Math.max(MIN_W, r.width - dx);
          l = r.left + r.width - w;
        }
        if (dir.includes('n')) {
          h = Math.max(MIN_H, r.height - dy);
          t = Math.max(0, r.top + r.height - h);
          if (t === 0) h = r.top + r.height;
        }

        windowEl.style.left   = l + 'px';
        windowEl.style.top    = t + 'px';
        windowEl.style.width  = w + 'px';
        windowEl.style.height = h + 'px';
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = prevCursor;
        windowEl.removeAttribute('data-snapped');
        setSnapBtnState(windowEl, null);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}

['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow', 'trashWindow', 'yWindow'].forEach(id => {
  makeResizable(document.getElementById(id));
});
