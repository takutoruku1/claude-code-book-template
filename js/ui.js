/* ============================================================
   WINDOW MANAGER
============================================================ */
let _zTop = 100;
function bringToFront(el) {
  el.style.zIndex = ++_zTop;
}
document.addEventListener('DOMContentLoaded', () => {
  ['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow', 'minesweeperWindow', 'trashWindow', 'yWindow'].forEach(id => {
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

/* ============================================================
   EXPLORER NAVIGATION
============================================================ */
const _DESKTOP_ITEMS = [
  { icon: '📱', name: 'ばずったー', action: (_wid) => openApp()         },
  { icon: '💬', name: 'チャトル',   action: (_wid) => openChatApp()     },
  { icon: '📝', name: 'メモ帳',     action: (_wid) => openMemoApp()     },
  { icon: '🎮', name: 'ゲーム',     action: (_wid) => openGamesWindow() },
  { icon: '🗑️', name: 'ゴミ箱',   action: (wid)  => {
      if (wid === 'trashWindow') {
        explorerNavTo('trashWindow', 'home');
      } else {
        explorerNavTo('trashWindow', 'home');
        openTrashWindow();
      }
    }
  },
];

const _explorerOriginal = {};

function explorerNavTo(winId, view) {
  const win = document.getElementById(winId);
  if (!win) return;

  const titleEl = win.querySelector('.titlebar-title');
  const content = win.querySelector('.explorer-content');
  const addrBar = win.querySelector('.explorer-address-bar');
  const sidebar = win.querySelectorAll('.explorer-sidebar-item');

  if (view === 'desktop') {
    if (!_explorerOriginal[winId]) {
      _explorerOriginal[winId] = {
        title:   titleEl?.innerHTML   || '',
        content: content.innerHTML,
        addrBar: addrBar.innerHTML,
      };
    }

    if (titleEl) titleEl.innerHTML = '🖥️ デスクトップ';
    addrBar.innerHTML = `🖥️&nbsp;<span style="color:var(--text-dim)">PC</span><span class="explorer-address-sep">&rsaquo;</span><span>デスクトップ</span>`;
    sidebar.forEach(item => item.classList.toggle('active', item.textContent.includes('デスクトップ')));

    content.innerHTML = '';
    content.style.alignContent   = 'flex-start';
    content.style.justifyContent = 'flex-start';

    _DESKTOP_ITEMS.forEach(item => {
      const el = document.createElement('div');
      el.className = 'explorer-file-item';
      el.innerHTML = `
        <div class="explorer-file-icon" style="display:flex;align-items:center;justify-content:center;font-size:38px;width:56px;height:56px;">${item.icon}</div>
        <div class="explorer-file-name">${item.name}</div>`;
      el.onclick    = () => { win.querySelectorAll('.explorer-file-item').forEach(e => e.classList.remove('selected')); el.classList.add('selected'); };
      el.ondblclick = () => item.action(winId);
      content.appendChild(el);
    });

  } else if (view === 'home') {
    const saved = _explorerOriginal[winId];
    if (!saved) return;
    if (titleEl) titleEl.innerHTML   = saved.title;
    content.innerHTML                = saved.content;
    addrBar.innerHTML                = saved.addrBar;
    content.style.alignContent       = '';
    content.style.justifyContent     = '';
    sidebar.forEach(item => item.classList.remove('active'));
    const homeLabel = winId === 'gamesWindow' ? 'ゲーム' : 'ゴミ箱';
    sidebar.forEach(item => { if (item.textContent.includes(homeLabel)) item.classList.add('active'); });
    delete _explorerOriginal[winId];
  }
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
    return `<div class="notif-item" onclick="showWindowFromNotif('${n.appId}')">
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
  const iconY = document.getElementById('taskbarIconY');
  if (iconY) iconY.classList.toggle('running',
    document.getElementById('yWindow').classList.contains('active') || !!window.yMinimized
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
  else if (type === 'y') openYWindow();
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

['appWindow', 'chatWindow', 'memoAppWindow', 'gamesWindow', 'trashWindow', 'yWindow'].forEach(id => {
  makeDraggable(document.getElementById(id));
});

// マインスイーパーは .ms-titlebar を使うため専用ドラッグ処理
(function() {
  const win = document.getElementById('minesweeperWindow');
  if (!win) return;
  const bar = win.querySelector('.ms-titlebar');
  if (!bar) return;
  let dragging = false, ox = 0, oy = 0;
  bar.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    const r = win.getBoundingClientRect();
    win.style.position = 'fixed';
    win.style.margin = '0';
    win.style.left = r.left + 'px';
    win.style.top  = r.top  + 'px';
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    dragging = true;
    bar.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    win.style.left = (e.clientX - ox) + 'px';
    win.style.top  = Math.max(0, e.clientY - oy) + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    bar.style.cursor = '';
    document.body.style.userSelect = '';
  });
})();

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

/* ============================================================
   Y APP  (Twitter/X 風 SNS ビューア)
   ============================================================ */

// ── ウィンドウ開閉 ──────────────────────────────────────────
function openYWindow() {
  const win = document.getElementById('yWindow');
  win.classList.add('active');
  bringToFront(win);
  window.yMinimized = false;
  renderYTimeline('recommend');
  renderYTrends();
  renderYSuggestions();
  updateTaskbarIndicators();
}

function closeYWindow() {
  document.getElementById('yWindow').classList.remove('active');
  window.yMinimized = false;
  updateTaskbarIndicators();
}

function taskbarToggleY() {
  const win = document.getElementById('yWindow');
  if (!win.classList.contains('active')) {
    openYWindow();
  } else if (window.yMinimized) {
    win.classList.add('active');
    bringToFront(win);
    window.yMinimized = false;
    updateTaskbarIndicators();
  } else {
    win.classList.remove('active');
    window.yMinimized = true;
    updateTaskbarIndicators();
  }
}

// ── フィードタブ切替 ────────────────────────────────────────
function yFeedTab(tab) {
  document.getElementById('yTabRecommend').classList.toggle('active', tab === 'recommend');
  document.getElementById('yTabFollowing').classList.toggle('active', tab === 'following');
  renderYTimeline(tab);
}

function yShowTab(tab) { /* ナビ選択の視覚のみ */ }

// ── TL データ ────────────────────────────────────────────────
const Y_POSTS_RECOMMEND = [
  {
    avatar: '📊', name: 'SNSマガジン編集部', handle: '@snsmag_jp', verified: true,
    time: '3分前', badge: 'おすすめ',
    body: '【調査レポート】SNS代行サービス市場が3年連続で急拡大。\n利用者の72%が「自分らしさを保ちながら伸ばしたい」と回答。\n\n"ブランドの声"を誰が担うのか──今、問われている。',
    tags: ['#SNS代行', '#デジタルアイデンティティ'],
    rt: '4.7万', like: '12.1万',
  },
  {
    avatar: '🦋', name: 'バズハンター_J', handle: '@viral_hunter_j', verified: false,
    time: '12分前',
    body: '最近思うんだけど、SNS代行って翻訳家に似てるな。\n\n言葉じゃなくて"その人"を訳してる。\n意味だけじゃなく、温度まで。\nそれができる人、本当に少ない。',
    tags: ['#SNS考察'],
    rt: '2,310', like: '8,777',
  },
  {
    avatar: '🔮', name: 'SNS仙人ゆき', handle: '@sennin_yuki', verified: true,
    time: '28分前',
    body: 'フォロワーを増やすより、フォロワーに増やしてもらうほうがずっと難しい。\nそれができたとき、本物になる。\n\nバズる投稿は作れる。\nでも「この人の声が聞きたい」とは、作れない。',
    tags: ['#SNS論'],
    rt: '1.2万', like: '5.8万',
  },
  {
    avatar: '📰', name: 'SNS代行タイムズ', handle: '@daiko_times', verified: true,
    time: '1時間前', badge: 'ニュース',
    body: '【速報】SNS代行業の法整備を求める声が国会で初めて取り上げられる。\n"本人か代行か 表示義務化"の議論が活発化。\n\n業界への影響は？ 続報を待て。',
    tags: ['#SNS法規制', '#代行業界'],
    rt: '8,214', like: '3.1万',
    quote: { name: '経済産業省 公式', text: '「デジタル表現の透明性」に関するパブリックコメントを募集します。' },
  },
  {
    avatar: '💼', name: '斎藤 翔馬 / マーケター', handle: '@mrktr_shoma', verified: false,
    time: '2時間前',
    body: 'クライアントに「自分の言葉で書きたい」と言われて一緒に考えた投稿が5万いいね超えた。\n\n代行ってそういうもんだと思う。\n"代わりに書く"じゃなくて"一緒に見つける"。',
    tags: [],
    rt: '412', like: '3,201',
  },
  {
    avatar: '🎀', name: '愛奈@インフルエンサー修行中', handle: '@infl_mana_diary', verified: false,
    time: '3時間前',
    body: 'SNS代行に頼んだら確かにフォロワー増えたけど、コメント欄で「最近文章変わった？」って言われた。\n\nうれしいような、悲しいような。',
    tags: [],
    rt: '601', like: '4,822',
  },
  {
    avatar: '🏢', name: 'PR会社 あかね広報室', handle: '@akane_pr_lab', verified: true,
    time: '4時間前',
    body: '弊社ではクライアントの「声の設計」から入ります。\n投稿文より先に「この人が話すとき何を大事にするか」を聞く時間に1時間かける。\n\nそこをスキップすると、どこかで必ずズレが出る。',
    tags: ['#PR', '#SNS運用'],
    rt: '1,043', like: '6,110',
  },
  {
    avatar: '🖊️', name: 'クリエイター なお', handle: '@creator_nao7', verified: false,
    time: '5時間前',
    body: '自分でSNS運用はじめて3ヶ月。\n\n投稿するたびに「これ本当に自分っぽいかな」って迷う。\nそういうの、ずっと迷い続けることが大事なのかもしれない。',
    tags: ['#クリエイター', '#SNS運用'],
    rt: '229', like: '1,984',
  },
  {
    avatar: '📊', name: 'SNSマガジン編集部', handle: '@snsmag_jp', verified: true,
    time: '6時間前', badge: 'おすすめ',
    body: '【特集】"らしさ"の経済学\n\nフォロワー5万人のアカウントより、1万人でも熱狂的なファンを持つアカウントのほうが商業的価値が高い時代へ。\n\nエンゲージメント率の意味が変わっている。',
    tags: ['#SNSマーケ', '#エンゲージメント'],
    rt: '5,892', like: '2.3万',
  },
  {
    avatar: '📈', name: 'データ分析 太一郎', handle: '@data_taichiro', verified: false,
    time: '7時間前',
    body: 'SNS代行アカウントと本人運用アカウントの投稿を機械学習で比較したら、代行のほうが「一文が短い」「記号が多い」「絵文字が規則的」という特徴が出た。\n\n"らしさ"って、不規則さの中にある。',
    tags: ['#データ分析', '#SNS研究'],
    rt: '3,102', like: '9,441',
  },
  {
    avatar: '🌃', name: '深夜の独り言', handle: '@midnight_monologue', verified: false,
    time: '8時間前',
    body: '代行に頼んだ自分のアカウントを見ると、なんか知らない人みたいで。\n\nでも「いいね」はたくさんついてる。\n\n……これって何のためにやってるんだろう。',
    tags: [],
    rt: '1,834', like: '1.2万',
  },
  {
    avatar: '🏪', name: '小さなお花屋さん ひまわり堂', handle: '@himawari_flower', verified: false,
    time: '9時間前',
    body: '代行さんにお願いして半年。\nお客さんに「Yで見ました」って言ってもらえることが増えました。\n\nでも昨日、自分で書いた「今日仕入れたバラが綺麗」って投稿に一番反応があって笑。',
    tags: ['#花屋', '#SNS'],
    rt: '408', like: '5,620',
  },
  {
    avatar: '💻', name: 'テックライター H', handle: '@techwriter_hiro', verified: false,
    time: '10時間前',
    body: 'AI生成文章とSNS代行文章と本人文章を並べて読むと、「本人文章」だけが予測できないタイミングで個人的な話題にジャンプする。\n\nそれが"温度"の正体だと思う。',
    tags: ['#AI', '#ライティング'],
    rt: '2,741', like: '7,830',
  },
  {
    avatar: '🎧', name: 'フリーランス Rei', handle: '@freelance_rei_w', verified: false,
    time: '12時間前',
    body: 'SNS代行の仕事して2年。\n\n一番難しいのは文章じゃなくて「このクライアントが怒るとき、悲しむとき、喜ぶとき何を言うか」を想像すること。\n\nキャラ設定じゃなくて、人間を理解する仕事。',
    tags: ['#フリーランス', '#SNS代行'],
    rt: '5,011', like: '2.1万',
  },
  {
    avatar: '🏙️', name: '広告代理店 S係長', handle: '@ad_agency_section_s', verified: false,
    time: '14時間前',
    body: 'クライアントが「もっとバズる文章にして」と言う。\nでも本当に言いたいのは「もっと自分のことを知ってほしい」なんだよな。\n\nバズと信頼、どっちを売るかで仕事が変わる。',
    tags: ['#広告', '#SNS戦略'],
    rt: '1,229', like: '8,004',
  },
  {
    avatar: '🔮', name: 'SNS仙人ゆき', handle: '@sennin_yuki', verified: true,
    time: '16時間前',
    body: '10万フォロワー達成おめでとう、って言われるたびに聞き返す。\n\n「それ、誰のフォロワーですか？」',
    tags: [],
    rt: '8,801', like: '4.2万',
  },
  {
    avatar: '📰', name: 'SNS代行タイムズ', handle: '@daiko_times', verified: true,
    time: '18時間前',
    body: '【コラム】代行された"声"は誰のものか。\n\n法的には依頼者のもの。\n商業的には代行会社のもの。\n感情的には……誰のものにもなれないのかもしれない。',
    tags: ['#代行倫理', '#SNS論'],
    rt: '4,519', like: '1.7万',
  },
  {
    avatar: '🌇', name: '普通の会社員 みつき', handle: '@futsuu_mitsuki28', verified: false,
    time: '20時間前',
    body: '会社のSNS担当になって思ったこと。\n\n文章書くより「この会社が何を大切にしてるか」を理解するほうに時間がかかる。\nわかったとき、初めてちゃんと書ける気がした。',
    tags: [],
    rt: '312', like: '2,741',
  },
  {
    avatar: '🦋', name: 'バズハンター_J', handle: '@viral_hunter_j', verified: false,
    time: '1日前',
    body: '「バズった」と「伝わった」は別物。\n\nバズは数字。\n伝わったは、誰かの行動が変わること。\n\nどっちを目指すかで、書く文章がぜんぶ変わる。',
    tags: ['#SNS哲学'],
    rt: '6,731', like: '3.1万',
  },
  {
    avatar: '📱', name: 'SNSコンサル 木村葵', handle: '@sns_kimura_aoi', verified: true,
    time: '1日前',
    body: '代行をやめてご本人が運用を始めると、最初はみんなフォロワーが減る。\n\nでも半年後に戻ってきたフォロワーはもう離れない。\n\n数字じゃなくて"関係"が育ってるから。',
    tags: ['#SNS運用', '#コンサル'],
    rt: '2,087', like: '9,342',
  },
];

const Y_POSTS_FOLLOWING = Y_POSTS_RECOMMEND.filter(p =>
  ['@viral_hunter_j','@sennin_yuki','@mrktr_shoma','@freelance_rei_w','@creator_nao7','@daiko_times','@sns_kimura_aoi'].includes(p.handle)
);


const Y_TRENDS = [
  { cat: 'トレンド', name: '#SNS代行',            count: '2.3万件のポスト' },
  { cat: 'テクノロジー · トレンド', name: '#デジタルアイデンティティ', count: '1.1万件のポスト' },
  { cat: 'ビジネス · トレンド', name: '#自分らしさ',           count: '5.1万件のポスト' },
  { cat: 'トレンド', name: '#バズり方',            count: '8,740件のポスト' },
  { cat: 'SNS · トレンド', name: '#らしさスコア',         count: '3,012件のポスト' },
];

const Y_SUGGESTIONS = [
  { avatar: '🔮', name: 'SNS仙人ゆき',         handle: '@sennin_yuki' },
  { avatar: '🦋', name: 'バズハンター_J',      handle: '@viral_hunter_j' },
  { avatar: '📱', name: 'SNSコンサル 木村葵',  handle: '@sns_kimura_aoi' },
  { avatar: '🎧', name: 'フリーランス Rei',    handle: '@freelance_rei_w' },
];

// ── 描画 ────────────────────────────────────────────────────
function renderYTimeline(tab) {
  const feed = document.getElementById('yFeed');
  if (!feed) return;
  const posts = tab === 'following' ? Y_POSTS_FOLLOWING : Y_POSTS_RECOMMEND;
  feed.innerHTML = '';
  posts.forEach((p, idx) => {
    const el = document.createElement('div');
    el.className = 'y-post';
    const tagsHtml = p.tags.map(t => `<span class="y-post-tag">${t}</span>`).join(' ');
    const quoteHtml = p.quote
      ? `<div class="y-post-quote"><div class="y-post-quote-name">${p.quote.name}</div>${p.quote.text}</div>`
      : '';
    const verifiedHtml = p.verified
      ? `<span class="y-post-verified" title="認証済み">✓</span>`
      : '';
    const badgeHtml = p.badge
      ? `<div class="y-post-badge">${p.badge}</div>`
      : '';
    el.innerHTML = `
      <div class="y-post-avatar">${p.avatar}</div>
      <div class="y-post-main">
        ${badgeHtml}
        <div class="y-post-header">
          <span class="y-post-name">${p.name}</span>
          ${verifiedHtml}
          <span class="y-post-handle">${p.handle}</span>
          <span class="y-post-dot">·</span>
          <span class="y-post-time">${p.time}</span>
        </div>
        <div class="y-post-body">${p.body.replace(/\n/g,'<br>')}${tagsHtml ? '<br>' + tagsHtml : ''}</div>
        ${quoteHtml}
        <div class="y-post-actions">
          <div class="y-post-action" onclick="this.querySelector('.y-post-label').textContent = (parseInt(this.querySelector('.y-post-label').textContent.replace(/[^\d]/g,''))||0)+1 + ''">
            <svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 7.501 3.58 7.501 8 0 4.421-3.01 8-7.5 8h-4.135c-1.006 2.834-3.27 4.818-6.636 5-.392.022-.615-.38-.461-.749C3.498 19.208 3.75 17.564 3.75 16c0-3.916.017-6 -2-6zm8.005-6c-3.317 0-6.005 2.686-6.005 6 0 1.876-.23 3.408-1.073 5.122C5.136 15.124 7.03 13.568 8 11.5h5.756c2.995 0 5.5-2.685 5.5-5.5S16.756 0 13.756 0H9.756z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
            <span class="y-post-label">${Math.floor(Math.random()*80+5)}</span>
          </div>
          <div class="y-post-action y-rt" onclick="this.classList.toggle('liked'); const n=parseInt(this.querySelector('.y-post-label').textContent.replace(/[^\d]/g,''))||0; this.querySelector('.y-post-label').textContent=this.classList.contains('liked')? (n+1)+'' : Math.max(0,n-1)+''">
            <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
            <span class="y-post-label">${p.rt}</span>
          </div>
          <div class="y-post-action" onclick="this.classList.toggle('liked'); const n=parseInt(this.querySelector('.y-post-label').textContent.replace(/[^\d]/g,''))||0; this.querySelector('.y-post-label').textContent=this.classList.contains('liked')? (n+1)+'' : Math.max(0,n-1)+''">
            <svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>
            <span class="y-post-label">${p.like}</span>
          </div>
          <div class="y-post-action">
            <svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>
          </div>
        </div>
      </div>`;
    feed.appendChild(el);
  });
}

function renderYTrends() {
  const el = document.getElementById('yTrends');
  if (!el) return;
  el.innerHTML = Y_TRENDS.map(t => `
    <div class="y-trend-item">
      <div class="y-trend-cat">${t.cat}</div>
      <div class="y-trend-name">${t.name}</div>
      <div class="y-trend-count">${t.count}</div>
    </div>`).join('');
}

function renderYSuggestions() {
  const el = document.getElementById('ySuggest');
  if (!el) return;
  el.innerHTML = Y_SUGGESTIONS.map(u => `
    <div class="y-suggest-item">
      <div class="y-suggest-avatar">${u.avatar}</div>
      <div class="y-suggest-info">
        <div class="y-suggest-name">${u.name}</div>
        <div class="y-suggest-handle">${u.handle}</div>
      </div>
      <button class="y-follow-btn" onclick="this.textContent=this.textContent==='フォロー'?'フォロー済み':'フォロー'; this.style.background=this.textContent==='フォロー済み'?'#2f3336':'#e7e9ea'; this.style.color=this.textContent==='フォロー済み'?'#e7e9ea':'#0f1419'">フォロー</button>
    </div>`).join('');
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
