/* ============================================================
   WINDOW MANAGER
============================================================ */
let _zTop = 100;
function bringToFront(el) {
  el.style.zIndex = ++_zTop;
}
document.addEventListener('DOMContentLoaded', () => {
  ['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow', 'minesweeperWindow', 'trashWindow'].forEach(id => {
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
  window._routeChats   = {};
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
  const onThread    = !!document.getElementById('chatScreenThread')?.classList.contains('active');
  const pastVisible = document.getElementById('chatPastMessages')?.style.display !== 'none';
  if (onThread && !pastVisible) _showPendingChoicesInWidget();
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

function openTrashWindow() {
  const win = document.getElementById('trashWindow');
  win.classList.add('active');
  bringToFront(win);
}

function closeTrashWindow() {
  document.getElementById('trashWindow').classList.remove('active');
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

function chatOpenThread(route) {
  const target = route || GS?.route;
  const isCurrent = !target || target === GS?.route;
  const char = (target ? CHARACTERS[target] : null) || CHARACTERS[GS?.route];

  if (char) {
    const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    setEl('chatAvatarEl', char.avatar);
    setEl('chatNameEl',   char.name);
    setEl('chatStatus',   isCurrent ? 'オンライン' : '-----');
  }

  const msgsEl     = document.getElementById('chatMessages');
  const pastEl     = document.getElementById('chatPastMessages');
  const choicesEl  = document.getElementById('chatChoices');

  if (isCurrent) {
    if (pastEl)    { pastEl.style.display = 'none'; pastEl.innerHTML = ''; }
    if (msgsEl)    { msgsEl.style.display = ''; msgsEl.scrollTop = msgsEl.scrollHeight; }
    if (choicesEl) { choicesEl.style.display = ''; }
    _showPendingChoicesInWidget();
  } else {
    const snap = window._routeChats?.[target]?.messagesHTML || '';
    if (msgsEl)    { msgsEl.style.display = 'none'; }
    if (choicesEl) { choicesEl.style.display = 'none'; }
    clearProtagChoices();
    if (pastEl) {
      pastEl.innerHTML = `<div class="chat-past-label">📜 過去のトーク</div>${snap}`;
      pastEl.style.display = '';
      setTimeout(() => { pastEl.scrollTop = pastEl.scrollHeight; }, 50);
    }
  }

  chatShowScreen('thread');
  _renderChatLists();
}

const _ROUTE_ORDER = ['midori', 'saku', 'seiji', 'karen'];

function _initRouteChatEntry(route) {
  if (!window._routeChats) window._routeChats = {};
  if (!window._routeChats[route]) {
    window._routeChats[route] = {
      char:    CHARACTERS[route],
      preview: 'メッセージはありません',
      time:    '',
      unread:  0,
      done:    false,
      messagesHTML: '',
    };
  }
  _renderChatLists();
}

function _renderChatLists() {
  const chats = window._routeChats || {};
  const routes = _ROUTE_ORDER.filter(r => chats[r]);

  const friendsList = document.getElementById('chatFriendsList');
  const talksList   = document.getElementById('chatTalksList');
  const countEl     = document.getElementById('chatFriendCount');
  if (countEl) countEl.textContent = `友達 ${routes.length}`;

  if (friendsList) {
    friendsList.innerHTML = '';
    routes.forEach(route => {
      const d = chats[route];
      const item = document.createElement('div');
      item.className = 'chatapp-friend-item';
      item.onclick = () => chatOpenThread(route);
      item.innerHTML = `
        <div class="chatapp-contact-ava">${d.char.avatar}</div>
        <div class="chatapp-contact-info">
          <div class="chatapp-contact-name">${d.char.name}</div>
          <div class="chatapp-contact-sub">${d.done ? '-----' : 'オンライン'}</div>
        </div>`;
      friendsList.appendChild(item);
    });
  }

  if (talksList) {
    talksList.innerHTML = '';
    routes.forEach(route => {
      const d    = chats[route];
      const unread = (route === GS?.route) ? (window._chatUnread || 0) : 0;
      const item = document.createElement('div');
      item.className = 'chatapp-talk-item';
      item.onclick = () => chatOpenThread(route);
      item.innerHTML = `
        <div class="chatapp-talk-ava">${d.char.avatar}</div>
        <div class="chatapp-talk-body">
          <div class="chatapp-talk-top">
            <span class="chatapp-talk-name">${d.char.name}</span>
            <span class="chatapp-talk-time">${d.time}</span>
          </div>
          <span class="chatapp-talk-preview">${d.preview}</span>
        </div>
        ${unread > 0 ? `<div class="chatapp-talk-badge" style="display:flex">${unread > 9 ? '9+' : unread}</div>` : ''}`;
      talksList.appendChild(item);
    });
  }
}

function updateChatContactPreview(text) {
  const now = new Date();
  const t   = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  const p   = text.length > 26 ? text.slice(0, 26) + '…' : text;
  const entry = window._routeChats?.[GS?.route];
  if (entry) { entry.preview = p; entry.time = t; }
  _renderChatLists();
}

function updateChatBadge() {
  const count = window._chatUnread || 0;
  const str   = count > 9 ? '9+' : String(count);
  const show  = count > 0 ? 'flex' : 'none';
  const navBadge = document.getElementById('chatNavBadge');
  if (navBadge) { navBadge.textContent = str; navBadge.style.display = show; }
  _renderChatLists();
}

function clearChatBadge() {
  window._chatUnread = 0;
  const navBadge = document.getElementById('chatNavBadge');
  if (navBadge) { navBadge.style.display = 'none'; }
  _renderChatLists();
}

function _setChatCharInfo(char) {
  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl('chatAvatarEl', char.avatar);
  setEl('chatNameEl',   char.name);
}

function resetGame(route) {
  // Save snapshot of previous route
  if (GS?.route && window._routeChats?.[GS.route]) {
    window._routeChats[GS.route].messagesHTML = document.getElementById('chatMessages')?.innerHTML || '';
    window._routeChats[GS.route].done = true;
  }

  window._chatHistory    = [];
  window._pendingChoices = null;
  window._currentStep    = 1;
  window._currentArea    = 'gamePlaceholder';
  window._chatUnread     = 0;

  if (!window._routeChats) window._routeChats = {};

  initGS(route);
  buildFlowMap(route);
  updateProtagWidget();

  const char = CHARACTERS[route];
  const pastEl = document.getElementById('chatPastMessages');
  if (pastEl) { pastEl.style.display = 'none'; pastEl.innerHTML = ''; }
  document.getElementById('chatMessages').style.display = '';
  document.getElementById('chatMessages').innerHTML  = '';
  document.getElementById('chatChoices').style.display = '';
  document.getElementById('chatChoices').innerHTML   = '';
  document.getElementById('chatStatus').textContent  = 'オンライン';
  document.getElementById('phIcon').textContent      = char.avatar;
  document.getElementById('screen-ending').classList.remove('active');
  _setChatCharInfo(char);
  _initRouteChatEntry(route);
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

['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow', 'trashWindow'].forEach(id => {
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

['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow', 'trashWindow'].forEach(id => {
  makeResizable(document.getElementById(id));
});

/* ============================================================
   PROTAGONIST WIDGET
============================================================ */
const _PROTAG_ON_CLIENT = {
  midori:   ['（…大丈夫そうかな）', '（うん、聞いている）', '（もう少し聞かせてほしい）', '（この人の気持ち、丁寧に受け取ろう）'],
  saku:     ['（…なるほど）', '（じっくり読む）', '（この人の孤独、わかる気がする）', '（何かが引っかかる…）'],
  seiji:    ['（要件を整理しよう）', '（なるほど）', '（現実的に考えよう）', '（話がまとまってきた）'],
  karen:    ['（…どこまで知っているんだろう）', '（慎重に、慎重に）', '（…読んでいる）', '（この人が何を求めているのか）'],
  _default: ['（…読んでいる）', '（なるほど）', '（そうか…）', '（うん…）'],
};
const _PROTAG_ON_CHOICES = {
  midori:   ['（この人に合う言葉を選ぼう）', '（焦らず、丁寧に）', '（やさしく、でも正直に）', '（気持ちを引き出せるかな）'],
  saku:     ['（この人の気持ち、尊重したい）', '（どう言えばいいんだろう）', '（慎重に…）', '（…何かが引っかかる）'],
  seiji:    ['（何が一番いいか）', '（プロとして判断しよう）', '（実務的に答えよう）', '（ここは正直に言おう）'],
  karen:    ['（…何て答えれば）', '（正直に言うべきか）', '（言葉を選ばないと）', '（…逃げられない）'],
  _default: ['（どう答えようか）', '（慎重に…）', '（正直に言うか）', '（何て返そう）'],
};
const _PROTAG_ON_ANSWER = {
  midori:   ['（伝わったかな）', '（よかったかな、これで）', '（この人の背中を少し押せたら）', '（…喜んでくれるといいな）'],
  saku:     ['（…これでよかったのか）', '（何か、胸に引っかかる）', '（この人には届いたかな）', '（うまく言えたかな…）'],
  seiji:    ['（これで動いてくれるといい）', '（あとは本人次第だ）', '（伝わったはず）', '（プロとして言うべきことは言った）'],
  karen:    ['（…よかったのか、これで）', '（どう受け取られたか）', '（取り返しのつかないことを言った気がする）', '（…もう戻れない）'],
  _default: ['（…これでよかったのかな）', '（伝わったかな）', '（うまく言えたか）', '（…どう受け取られるか）'],
};

let _protagTimer        = null;
let _protagIdle         = null;
let _protagChoiceTimers = [];

function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _protagMsg(map) {
  const arr = (GS?.route && map[GS.route]) || map._default || [];
  return _pick(arr);
}

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
