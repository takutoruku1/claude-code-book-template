/* ============================================================
   WINDOW MANAGER
============================================================ */
let _zTop = 100;
function bringToFront(el) {
  el.style.zIndex = ++_zTop;
}
document.addEventListener('DOMContentLoaded', () => {
  ['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow', 'minesweeperWindow'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('mousedown', () => bringToFront(el));
  });
  updateTaskbarIndicators();
});

/* ============================================================
   MISC
============================================================ */
function toggleLike(el) {
  el.classList.toggle('liked');
  spawnHeart(el);
}
function spawnHeart(el) {
  const r = el.getBoundingClientRect();
  const h = document.createElement('div');
  h.className = 'heart-float'; h.textContent = '❤️';
  h.style.left = r.left + 'px'; h.style.top = r.top + 'px';
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 800);
}

/* ============================================================
   CHARACTER SELECT
============================================================ */
function buildCharSelect() {
  const grid = document.getElementById('charGrid');
  grid.innerHTML = '';
  Object.entries(CHARACTERS).forEach(([key, char]) => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = `
      <div class="char-card-avatar">${char.avatar}</div>
      <div class="char-card-name">${char.name}</div>
      ${char.tag ? `<div class="char-card-tag">${char.tag}</div>` : ''}
      ${key === 'karen' ? `<div class="char-card-note">他の3人を先に遊ぶと<br>より楽しめます</div>` : ''}`;
    card.onclick = () => startRoute(key);
    grid.appendChild(card);
  });
}

/* ============================================================
   APP LIFECYCLE
============================================================ */
function openApp(isDebugMode) {
  if (window.appIsRunning) {
    const appWin = document.getElementById('appWindow');
    appWin.classList.add('active');
    window.appMinimized = false;
    bringToFront(appWin);
    updateTaskbarIndicators();
    refreshDesktopNotifs();
    return;
  }

  const overlay = document.getElementById('boot-overlay');
  document.getElementById('screen-title').classList.remove('active');
  overlay.classList.add('active');

  window.IS_DEBUG_MODE = isDebugMode;
  window.appIsRunning  = true;
  window.appMinimized  = false;
  window.chatMinimized = false;

  setTimeout(() => {
    overlay.classList.add('fading');
    if (isDebugMode) {
      document.getElementById('screen-charselect').classList.add('active');
      buildCharSelect();
    } else {
      startMainModeAutoRoute();
    }
    updateTaskbarIndicators();
    setTimeout(() => overlay.classList.remove('active', 'fading'), 700);
  }, 3000);
}

function startMainModeAutoRoute() {
  const routes = ['midori', 'saku', 'seiji', 'karen'];
  window.MAIN_MODE_ROUTES = routes;
  window.MAIN_MODE_ROUTE_INDEX = 0;
  resetGame(routes[0]);
}

function startRoute(route) {
  document.getElementById('screen-charselect').classList.remove('active');
  const appWin = document.getElementById('appWindow');
  appWin.classList.add('active');
  bringToFront(appWin);
  window.appMinimized = false;
  resetGame(route);
}

function closeApp() {
  document.getElementById('appWindow').classList.remove('active');
  document.getElementById('memoAppWindow').classList.remove('active');
  document.getElementById('screen-charselect').classList.remove('active');
  document.getElementById('screen-title').classList.add('active');
  window.IS_DEBUG_MODE = null;
  window.MAIN_MODE_ROUTES = null;
  window.MAIN_MODE_ROUTE_INDEX = null;
  document.getElementById('chatWindow').classList.remove('active');
  window.appIsRunning  = false;
  window.appMinimized  = false;
  window.chatMinimized = false;
  window.memoMinimized = false;
  clearProtagChoices();
  updateTaskbarIndicators();
  updateProtagWidget();
}

function closeAppWindow() {
  document.getElementById('appWindow').classList.remove('active');
  window.appMinimized = false;
  updateTaskbarIndicators();
  refreshDesktopNotifs();
}

function _showPendingChoicesInWidget() {
  if (window._pendingChoices && typeof showProtagChoices === 'function') {
    const box = document.getElementById('chatChoices');
    if (box) box.innerHTML = '';
    showProtagChoices(window._pendingChoices, _onChoiceSelect);
  }
}

function _onChatWindowOpen() {
  clearChatBadge();
  const onThread = !!document.getElementById('chatScreenThread')?.classList.contains('active');
  if (onThread) _showPendingChoicesInWidget();
}

function closeChatWindow() {
  document.getElementById('chatWindow').classList.remove('active');
  window.chatMinimized = false;
  clearProtagChoices();
  updateTaskbarIndicators();
  refreshDesktopNotifs();
}

function openMemoApp() {
  const memoWin = document.getElementById('memoAppWindow');
  memoWin.classList.add('active');
  bringToFront(memoWin);
  window.memoMinimized = false;
  renderMemoNotes();
  updateTaskbarIndicators();
  setDesktopNotif('notifMemo', false);
}

function closeMemoApp() {
  document.getElementById('memoAppWindow').classList.remove('active');
  window.memoMinimized = false;
  updateTaskbarIndicators();
}

function openGamesWindow() {
  const win = document.getElementById('gamesWindow');
  win.classList.add('active');
  window.gamesMinimized = false;
  bringToFront(win);
  updateTaskbarIndicators();
}

function closeGamesWindow() {
  const win = document.getElementById('gamesWindow');
  win.classList.remove('active');
  window.gamesMinimized = false;
  updateTaskbarIndicators();
}

function toggleGamesWindow() {
  const win = document.getElementById('gamesWindow');
  if (window.gamesMinimized) {
    win.classList.add('active');
    window.gamesMinimized = false;
    bringToFront(win);
  } else if (win.classList.contains('active')) {
    minimizeWin(win);
    window.gamesMinimized = true;
  } else {
    openGamesWindow();
  }
  updateTaskbarIndicators();
}

function taskbarToggleGames() {
  toggleGamesWindow();
}

function taskbarToggleMinesweeper() {
  const win = document.getElementById('minesweeperWindow');
  if (window.minesweeperMinimized) {
    win.classList.add('active');
    window.minesweeperMinimized = false;
    bringToFront(win);
    updateTaskbarIndicators();
  } else if (win.classList.contains('active')) {
    minimizeWin(win);
    window.minesweeperMinimized = true;
    updateTaskbarIndicators();
  }
}


function showWindowFromNotif(appId) {
  closeAllPopups();
  if (appId === 'app') {
    if (!window.appIsRunning) { openApp(false); return; }
    const win = document.getElementById('appWindow');
    win.classList.add('active');
    bringToFront(win);
    window.appMinimized = false;
    updateTaskbarIndicators();
    refreshDesktopNotifs();
  } else if (appId === 'chat') {
    if (!window.appIsRunning) { openApp(false); return; }
    const win = document.getElementById('chatWindow');
    win.classList.add('active');
    bringToFront(win);
    window.chatMinimized = false;
    updateTaskbarIndicators();
    refreshDesktopNotifs();
  } else if (appId === 'memo') {
    openMemoApp();
  }
}

/* ===== NOTIFICATION CENTER ===== */
let _notifications = [];
let _notifIdCnt = 0;

function addNotification(appId, appName, appIcon, message) {
  if (_notifications.some(n => n.appId === appId)) return;
  const notif = { id: ++_notifIdCnt, appId, appName, appIcon, message, time: new Date() };
  _notifications.unshift(notif);
  _renderNotifList();
  _updateNotifBadge();
  _showToast(notif);
}

function removeNotification(id) {
  _notifications = _notifications.filter(n => n.id !== id);
  _renderNotifList();
  _updateNotifBadge();
}

function clearAllNotifications() {
  _notifications = [];
  _renderNotifList();
  _updateNotifBadge();
}

function _updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const count = _notifications.length;
  badge.textContent = count > 9 ? '9+' : count;
  badge.classList.toggle('visible', count > 0);
}

function _renderNotifList() {
  const list = document.getElementById('notifList');
  if (!list) return;
  if (_notifications.length === 0) {
    list.innerHTML = '<div class="notif-empty">通知はありません</div>';
    return;
  }
  list.innerHTML = _notifications.map(n => {
    const t = `${String(n.time.getHours()).padStart(2,'0')}:${String(n.time.getMinutes()).padStart(2,'0')}`;
    return `<div class="notif-item" onclick="showWindowFromNotif('${n.appId}')"
      <div class="notif-item-icon">${n.appIcon}</div>
      <div class="notif-item-body">
        <div class="notif-item-app">${n.appName}</div>
        <div class="notif-item-msg">${n.message}</div>
        <div class="notif-item-time">${t}</div>
      </div>
      <button class="notif-item-dismiss" onclick="event.stopPropagation();removeNotification(${n.id})">✕</button>
    </div>`;
  }).join('');
}

function toggleNotifCenter(e) {
  e.stopPropagation();
  const panel = document.getElementById('notifCenter');
  const isActive = panel.classList.contains('active');
  closeAllPopups();
  if (!isActive) panel.classList.add('active');
}

function _showToast(notif) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-header">
      <span class="toast-icon">${notif.appIcon}</span>
      <span class="toast-app">${notif.appName}</span>
      <button class="toast-close-btn" onclick="event.stopPropagation();_dismissToast(this.closest('.toast'))">✕</button>
    </div>
    <div class="toast-body">${notif.message}</div>`;
  toast.addEventListener('click', () => { _dismissToast(toast); showWindowFromNotif(notif.appId); });
  container.appendChild(toast);
  toast._timer = setTimeout(() => _dismissToast(toast), 5000);
}

function _dismissToast(toast) {
  if (!toast || !toast.parentNode) return;
  clearTimeout(toast._timer);
  toast.classList.add('dismissing');
  setTimeout(() => toast.remove(), 200);
}

/* ===== DESKTOP NOTIF ===== */
window._notifPending = { notifApp: false, notifChat: false, notifMemo: false };

const _notifConfig = {
  notifApp:  { winId: 'appWindow',      appId: 'app',  appName: 'ばずったー', appIcon: '📱', msg: 'ばずったーに通知がきています' },
  notifChat: { winId: 'chatWindow',     appId: 'chat', appName: 'チャトル',   appIcon: '💬', msg: 'チャトルに通知がきています' },
  notifMemo: { winId: 'memoAppWindow',  appId: 'memo', appName: 'メモ帳',     appIcon: '📝', msg: 'メモ帳にメモが追加されました' },
};

function setDesktopNotif(id, show) {
  window._notifPending[id] = show;
  _applyDesktopNotif(id);
  const cfg = _notifConfig[id];
  if (!cfg) return;
  if (show) {
    const winOpen = document.getElementById(cfg.winId)?.classList.contains('active');
    if (!winOpen) addNotification(cfg.appId, cfg.appName, cfg.appIcon, cfg.msg);
  } else {
    _notifications = _notifications.filter(n => n.appId !== cfg.appId);
    _renderNotifList();
    _updateNotifBadge();
  }
}

function _applyDesktopNotif(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const cfg = _notifConfig[id];
  const winOpen = cfg && document.getElementById(cfg.winId)?.classList.contains('active');
  el.classList.toggle('on', window._notifPending[id] && !winOpen);
}

function refreshDesktopNotifs() {
  Object.keys(_notifConfig).forEach(_applyDesktopNotif);
}

function chatShowScreen(screen) {
  ['Friends', 'Talk', 'Thread'].forEach(s => {
    document.getElementById('chatScreen' + s)?.classList.toggle('active', s.toLowerCase() === screen);
  });
  document.getElementById('chatNavTalk')?.classList.toggle('active', screen === 'talk' || screen === 'thread');
  document.getElementById('chatNavFriends')?.classList.toggle('active', screen === 'friends');
  if (screen === 'thread') clearChatBadge();
}

function chatOpenThread() {
  chatShowScreen('thread');
  setTimeout(() => {
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }, 50);
  _showPendingChoicesInWidget();
}

function updateChatContactPreview(text) {
  const preview = document.getElementById('chatTalkPreview');
  const timeEl  = document.getElementById('chatTalkTime');
  if (preview) preview.textContent = text.length > 26 ? text.slice(0, 26) + '…' : text;
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  }
}

function updateChatBadge() {
  const count = window._chatUnread || 0;
  const str   = count > 9 ? '9+' : String(count);
  const show  = count > 0 ? 'flex' : 'none';
  const talkBadge = document.getElementById('chatTalkBadge');
  const navBadge  = document.getElementById('chatNavBadge');
  if (talkBadge) { talkBadge.textContent = str; talkBadge.style.display = show; }
  if (navBadge)  { navBadge.textContent  = str; navBadge.style.display  = show; }
}

function clearChatBadge() {
  window._chatUnread = 0;
  updateChatBadge();
}

function _setChatCharInfo(char) {
  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl('chatAvatarEl',   char.avatar);
  setEl('chatNameEl',     char.name);
  setEl('chatTalkAva',    char.avatar);
  setEl('chatTalkName',   char.name);
  setEl('chatFriendAva',  char.avatar);
  setEl('chatFriendName', char.name);
  setEl('chatTalkPreview', 'メッセージはありません');
  setEl('chatTalkTime', '');
}

function resetGame(route) {
  window._chatHistory    = [];
  window._pendingChoices = null;
  window._currentStep    = 1;
  window._currentArea    = 'gamePlaceholder';
  window._chatUnread     = 0;

  initGS(route);
  buildFlowMap(route);
  updateProtagWidget();

  const char = CHARACTERS[route];
  document.getElementById('chatMessages').innerHTML  = '';
  document.getElementById('chatChoices').innerHTML   = '';
  document.getElementById('chatStatus').textContent  = 'オンライン';
  document.getElementById('phIcon').textContent      = char.avatar;
  document.getElementById('screen-ending').classList.remove('active');
  _setChatCharInfo(char);
  chatShowScreen('talk');
  updateChatBadge();

  setStep(1);
  showArea('gamePlaceholder');
  setTimeout(() => runChat(0), 400);
}

function retryGame() {
  document.getElementById('screen-ending').classList.remove('active');
  document.getElementById('appWindow').classList.remove('active');

  if (window.IS_DEBUG_MODE) {
    document.getElementById('screen-charselect').classList.add('active');
    buildCharSelect();
  } else {
    window.MAIN_MODE_ROUTE_INDEX++;
    if (window.MAIN_MODE_ROUTE_INDEX < window.MAIN_MODE_ROUTES.length) {
      const nextRoute = window.MAIN_MODE_ROUTES[window.MAIN_MODE_ROUTE_INDEX];
      document.getElementById('appWindow').classList.add('active');
      resetGame(nextRoute);
    } else {
      document.getElementById('screen-title').classList.add('active');
      window.IS_DEBUG_MODE = null;
      window.MAIN_MODE_ROUTES = null;
      window.MAIN_MODE_ROUTE_INDEX = null;
    }
  }
}

function renderMemoNotes() {
  const list = document.getElementById('noteList');
  const empty = document.getElementById('noteEmpty');
  if (!list || !empty) return;
  list.innerHTML = '';
  if (!GS.collectedNotes || GS.collectedNotes.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  GS.collectedNotes.forEach(note => {
    const item = document.createElement('div');
    item.className = 'note-item';
    item.innerHTML = `
      <div class="note-item-keyword">${note.keyword}</div>
      <div class="note-item-text">${note.text}</div>
    `;
    list.appendChild(item);
  });
}

/* ===== TASKBAR WINDOW TOGGLE ===== */
window.appIsRunning  = false;
window.appMinimized  = false;
window.chatMinimized = false;
window.memoMinimized = false;

function updateTaskbarIndicators() {
  const iconApp          = document.getElementById('taskbarIconApp');
  const iconChat         = document.getElementById('taskbarIconChat');
  const iconMemo         = document.getElementById('taskbarIconMemo');
  const iconGames        = document.getElementById('taskbarIconGames');
  const iconMinesweeper  = document.getElementById('taskbarIconMinesweeper');
  iconApp.classList.toggle('running',
    !!window.appIsRunning &&
    (document.getElementById('appWindow').classList.contains('active') ||
     document.getElementById('screen-charselect').classList.contains('active') ||
     !!window.appMinimized)
  );
  iconChat.classList.toggle('running',
    !!window.appIsRunning &&
    (document.getElementById('chatWindow').classList.contains('active') || !!window.chatMinimized)
  );
  iconMemo.classList.toggle('running',
    document.getElementById('memoAppWindow').classList.contains('active') || !!window.memoMinimized
  );
  if (iconGames) iconGames.classList.toggle('running',
    document.getElementById('gamesWindow').classList.contains('active') || !!window.gamesMinimized
  );
  if (iconMinesweeper) iconMinesweeper.classList.toggle('running',
    document.getElementById('minesweeperWindow').classList.contains('active') || !!window.minesweeperMinimized
  );
}

function taskbarToggleChat() {
  const chatWin = document.getElementById('chatWindow');
  if (window.chatMinimized) {
    chatWin.classList.add('active');
    bringToFront(chatWin);
    window.chatMinimized = false;
    _onChatWindowOpen();
  } else if (chatWin.classList.contains('active')) {
    clearProtagChoices();
    minimizeWin(chatWin);
    window.chatMinimized = true;
  } else if (window.appIsRunning) {
    chatWin.classList.add('active');
    bringToFront(chatWin);
    window.chatMinimized = false;
    _onChatWindowOpen();
  }
  updateTaskbarIndicators();
  refreshDesktopNotifs();
}

function openChatApp() {
  if (!window.appIsRunning) {
    openApp(false);
  } else {
    taskbarToggleChat();
  }
}

function minimizeWin(el) {
  el.classList.add('minimizing');
  setTimeout(() => { el.classList.remove('active', 'minimizing'); refreshDesktopNotifs(); }, 160);
}

function toggleMaximize(windowId, btnId) {
  const win = document.getElementById(windowId);
  const btn = document.getElementById(btnId);
  const isMax = win.classList.toggle('maximized');
  btn.innerHTML = isMax ? '&#x29C9;' : '&#x25A1;';
  if (!isMax) setSnapBtnState(win, null);
}

function taskbarToggleApp() {
  const appWin    = document.getElementById('appWindow');
  const charselEl = document.getElementById('screen-charselect');

  if (!window.appIsRunning) {
    openApp(false);
    return;
  }
  if (window.appMinimized) {
    appWin.classList.add('active');
    bringToFront(appWin);
    window.appMinimized = false;
  } else if (appWin.classList.contains('active') || charselEl.classList.contains('active')) {
    charselEl.classList.remove('active');
    minimizeWin(appWin);
    window.appMinimized = true;
  } else {
    appWin.classList.add('active');
    bringToFront(appWin);
    window.appMinimized = false;
  }
  updateTaskbarIndicators();
  refreshDesktopNotifs();
}

function taskbarToggleMemo() {
  const memoWin = document.getElementById('memoAppWindow');
  if (window.memoMinimized) {
    memoWin.classList.add('active');
    bringToFront(memoWin);
    window.memoMinimized = false;
    setDesktopNotif('notifMemo', false);
    updateTaskbarIndicators();
  } else if (memoWin.classList.contains('active')) {
    minimizeWin(memoWin);
    window.memoMinimized = true;
    updateTaskbarIndicators();
  } else {
    openMemoApp();
  }
}

/* ===== TASKBAR CLOCK ===== */
function updateTaskbarClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  const timeEl = document.getElementById('taskbarTime');
  const dateEl = document.getElementById('taskbarDate');
  if (timeEl) timeEl.textContent = time;
  if (dateEl) dateEl.textContent = date;
}
updateTaskbarClock();
setInterval(updateTaskbarClock, 10000);

/* ===== WIN11 CALENDAR & START MENU ===== */
let calYear, calMonth;

function toggleStartMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('startMenu');
  const isActive = menu.classList.contains('active');
  closeAllPopups();
  if (!isActive) {
    menu.style.display = 'block';
    requestAnimationFrame(() => menu.classList.add('active'));
    document.getElementById('startSearchInput').value = '';
  }
}

function closeStartMenu() {
  const menu = document.getElementById('startMenu');
  menu.classList.remove('active');
  setTimeout(() => { if (!menu.classList.contains('active')) menu.style.display = 'none'; }, 200);
}

function startMenuOpen(type) {
  closeStartMenu();
  if (type === 'app') taskbarToggleApp();
  else if (type === 'chat') taskbarToggleChat();
  else if (type === 'memo') taskbarToggleMemo();
  else if (type === 'games') openGamesWindow();
}

function closeAllPopups() {
  closeStartMenu();
  document.getElementById('calPopup').classList.remove('active');
  document.getElementById('notifCenter').classList.remove('active');
}

function toggleCalendar(e) {
  e.stopPropagation();
  const popup = document.getElementById('calPopup');
  const isActive = popup.classList.contains('active');
  closeAllPopups();
  if (!isActive) {
    const today = new Date();
    calYear  = today.getFullYear();
    calMonth = today.getMonth();
    renderCal();
    popup.classList.add('active');
  }
}

function renderCal() {
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  document.getElementById('calMonthLabel').textContent = `${calYear}年${calMonth + 1}月`;

  const grid = document.getElementById('calDays');
  grid.innerHTML = '';

  const firstDow    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev  = new Date(calYear, calMonth, 0).getDate();
  const totalCells  = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const col = i % 7;
    const cell = document.createElement('div');
    cell.className = 'cal-day';

    let dateNum, isOther = false;
    if (i < firstDow) {
      dateNum = daysInPrev - firstDow + i + 1;
      isOther = true;
    } else if (i < firstDow + daysInMonth) {
      dateNum = i - firstDow + 1;
    } else {
      dateNum = i - firstDow - daysInMonth + 1;
      isOther = true;
    }

    cell.textContent = dateNum;
    if (isOther) cell.classList.add('other-month');
    if (col === 0) cell.classList.add('sun');
    if (col === 6) cell.classList.add('sat');
    if (!isOther && calYear === todayY && calMonth === todayM && dateNum === todayD) {
      cell.classList.add('today');
    }
    grid.appendChild(cell);
  }
}

document.getElementById('calPrev').addEventListener('click', function(e) {
  e.stopPropagation();
  if (--calMonth < 0) { calMonth = 11; calYear--; }
  renderCal();
});
document.getElementById('calNext').addEventListener('click', function(e) {
  e.stopPropagation();
  if (++calMonth > 11) { calMonth = 0; calYear++; }
  renderCal();
});
document.getElementById('calTodayBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  const today = new Date();
  calYear  = today.getFullYear();
  calMonth = today.getMonth();
  renderCal();
});
document.getElementById('calPopup').addEventListener('click', function(e) {
  e.stopPropagation();
});
document.addEventListener('click', function() {
  document.getElementById('calPopup').classList.remove('active');
  document.getElementById('notifCenter').classList.remove('active');
  closeStartMenu();
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

/* ===== DRAGGABLE WINDOWS ===== */
function makeDraggable(windowEl) {
  const titlebar = windowEl.querySelector('.titlebar');
  if (!titlebar) return;

  let dragging = false;
  let ox = 0, oy = 0;

  titlebar.addEventListener('mousedown', (e) => {
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
  });
}

['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow'].forEach(id => {
  makeDraggable(document.getElementById(id));
});

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

['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow'].forEach(id => {
  makeResizable(document.getElementById(id));
});

/* ============================================================
   PROTAGONIST WIDGET
============================================================ */
const _PROTAG_ON_CLIENT = [
  '（…読んでいる）',
  '（なるほど）',
  '（そうか…）',
  '（ふむ）',
  '（うん…）',
  '（…）',
];
const _PROTAG_ON_CHOICES = [
  '（どう答えようか）',
  '（慎重に…）',
  '（正直に言うか）',
  '（何て返そう）',
  '（言葉を選ばないと）',
];
const _PROTAG_ON_ANSWER = [
  '（…これでよかったのかな）',
  '（伝わったかな）',
  '（うまく言えたか）',
  '（…どう受け取られるか）',
];

let _protagTimer       = null;
let _protagIdle        = null;
let _protagChoiceTimers = [];

function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function showProtagMsg(text, thinking = false, duration = 3200) {
  const widget = document.getElementById('protagonistWidget');
  const bubble = document.getElementById('protagBubble');
  const textEl = document.getElementById('protagText');
  if (!widget || !bubble || !textEl) return;

  clearTimeout(_protagTimer);
  textEl.textContent = text;
  bubble.classList.toggle('thinking', thinking);
  bubble.classList.add('show');

  _protagTimer = setTimeout(() => bubble.classList.remove('show'), duration);
}

function clearProtagChoices() {
  _protagChoiceTimers.forEach(t => { clearTimeout(t); clearInterval(t); });
  _protagChoiceTimers = [];
  const c = document.getElementById('protagChoices');
  if (c) c.innerHTML = '';
}

function showProtagChoices(opts, onSelect) {
  clearProtagChoices();
  const container = document.getElementById('protagChoices');
  if (!container) return;

  let startDelay = 300;

  opts.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'protag-choice-btn';
    btn.style.animationDelay = `${idx * 80}ms`;

    const textSpan   = document.createElement('span');
    const cursor     = document.createElement('span');
    cursor.className = 'protag-cursor';
    btn.appendChild(textSpan);
    btn.appendChild(cursor);
    container.appendChild(btn);

    const chars = [...opt.text];
    const charDelay = 65;

    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        textSpan.textContent += chars[i];
        i++;
        if (i >= chars.length) {
          clearInterval(iv);
          cursor.remove();
          btn.classList.add('ready');
          btn.onclick = () => {
            clearProtagChoices();
            onSelect(opt);
          };
        }
      }, charDelay);
      _protagChoiceTimers.push(iv);
    }, startDelay);

    _protagChoiceTimers.push(t);
    startDelay += chars.length * charDelay + 300;
  });
}

function updateProtagWidget() {
  const w = document.getElementById('protagonistWidget');
  if (!w) return;
  if (window.appIsRunning) {
    w.classList.add('visible');
    const char = GS?.route ? CHARACTERS[GS.route] : null;
    const ava  = document.getElementById('protagAvatar');
    if (ava) ava.textContent = '👤';
  } else {
    w.classList.remove('visible');
    clearTimeout(_protagTimer);
    document.getElementById('protagBubble')?.classList.remove('show');
  }
}
