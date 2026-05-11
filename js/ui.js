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

  _stopTitleBgm();

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

function _closeAllGameWindows() {
  ['appWindow','chatWindow','memoAppWindow','gamesWindow','minesweeperWindow',
   'invadersWindow','trashWindow','yWindow'].forEach(id => {
    document.getElementById(id)?.classList.remove('active');
  });
  window.appIsRunning  = false;
  window.appMinimized  = false;
  window.chatMinimized = false;
  window.memoMinimized = false;
  window.yMinimized    = false;
  window._routeChats   = {};
  window._allPostedContents = [];
  window._allMemoNotes  = [];
  clearProtagChoices();
  updateTaskbarIndicators();
  updateProtagWidget();
}

function closeApp() {
  document.getElementById('screen-charselect').classList.remove('active');
  document.getElementById('screen-title').classList.add('active');
  window.IS_DEBUG_MODE = null;
  window.MAIN_MODE_ROUTES = null;
  window.MAIN_MODE_ROUTE_INDEX = null;
  _closeAllGameWindows();
}

function closeAppWindow() {
  document.getElementById('appWindow').classList.remove('active');
  window.appMinimized = false;
  updateTaskbarIndicators();
  refreshDesktopNotifs();
}

function _showPendingChoicesInWidget() {
  if (!window._pendingChoices || typeof showProtagChoices !== 'function') return;
  const box = document.getElementById('chatChoices');
  if (box) box.innerHTML = '';
  const alreadyAtChat = _protagTrackedWin?.id === 'chatWindow';
  const delay = alreadyAtChat ? 0 : 1300;
  const tid = setTimeout(() => {
    if (window._pendingChoices && _isChatOpen()) {
      showProtagChoices(window._pendingChoices, _onChoiceSelect);
    }
  }, delay);
  _protagChoiceTimers.push(tid);
}

function _resumePendingPlayerMsg() {
  if (window._pendingPlayerIdx !== null && window._pendingPlayerIdx !== undefined) {
    const idx = window._pendingPlayerIdx;
    window._pendingPlayerIdx = null;
    if (typeof runChat === 'function') setTimeout(() => runChat(idx), 300);
  }
}

function _onChatWindowOpen() {
  clearChatBadge();
  const onThread    = !!document.getElementById('chatScreenThread')?.classList.contains('active');
  const pastVisible = document.getElementById('chatPastMessages')?.style.display !== 'none';
  if (onThread && !pastVisible) {
    _showPendingChoicesInWidget();
    _resumePendingPlayerMsg();
  }
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
      explorerNavTo('trashWindow', 'home');
      if (wid !== 'trashWindow') openTrashWindow();
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

function taskbarToggleGames() { toggleGamesWindow(); }

function taskbarToggleInvaders() {
  const win = document.getElementById('invadersWindow');
  if (!win) return;
  if (window.invadersMinimized) {
    win.classList.add('active');
    window.invadersMinimized = false;
    bringToFront(win);
    updateTaskbarIndicators();
  } else if (win.classList.contains('active')) {
    minimizeWin(win);
    window.invadersMinimized = true;
    updateTaskbarIndicators();
  } else {
    openInvaders();
  }
}

function openSolitaire() {
  const win = document.getElementById('solitaireWindow');
  if (!win) return;
  win.style.display = 'block';
  window.solitaireMinimized = false;
  bringToFront(win);
  updateTaskbarIndicators();
}

function closeSolitaire() {
  const win = document.getElementById('solitaireWindow');
  if (!win) return;
  win.style.display = 'none';
  window.solitaireMinimized = false;
  updateTaskbarIndicators();
}

function taskbarToggleSolitaire() {
  const win = document.getElementById('solitaireWindow');
  if (!win) return;
  if (window.solitaireMinimized) {
    win.style.display = 'block';
    window.solitaireMinimized = false;
    bringToFront(win);
    updateTaskbarIndicators();
  } else if (win.style.display !== 'none') {
    win.style.display = 'none';
    window.solitaireMinimized = true;
    updateTaskbarIndicators();
  } else {
    openSolitaire();
  }
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
    _onChatWindowOpen();
    updateTaskbarIndicators();
    refreshDesktopNotifs();
  } else if (appId === 'memo') {
    openMemoApp();
  } else if (appId === 'y') {
    openYWindow();
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
window._notifPending = { notifApp: false, notifChat: false, notifMemo: false, notifY: false };

const _notifConfig = {
  notifApp:  { winId: 'appWindow',      appId: 'app',  appName: 'ばずったー', appIcon: '📱', msg: 'ばずったーに通知がきています' },
  notifChat: { winId: 'chatWindow',     appId: 'chat', appName: 'チャトル',   appIcon: '💬', msg: 'チャトルに通知がきています' },
  notifMemo: { winId: 'memoAppWindow',  appId: 'memo', appName: 'メモ帳',     appIcon: '📝', msg: 'メモ帳にメモが追加されました' },
  notifY:    { winId: 'yWindow',        appId: 'y',    appName: 'Y',          appIcon: 'Y',  msg: '依頼者がYに投稿しました' },
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

/* ===== CHAT APP UI ===== */
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
  window._activeChatRoute = target;
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
    _resumePendingPlayerMsg();
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

/* ===== GAME STATE RESET ===== */
function resetGame(route) {
  if (GS?.route && window._routeChats?.[GS.route]) {
    window._routeChats[GS.route].messagesHTML = document.getElementById('chatMessages')?.innerHTML || '';
    window._routeChats[GS.route].done = true;
  }

  window._chatHistory       = [];
  window._pendingChoices    = null;
  window._lastPostedContent = null;
  window._pendingPlayerIdx  = null;
  window._chatImages        = [];
  // _allPostedContents はルートをまたいで保持するためリセットしない
  window._activeChatRoute   = route;
  window._currentStep       = 1;
  window._currentArea    = 'gamePlaceholder';
  window._chatUnread     = 0;

  if (!window._routeChats) window._routeChats = {};

  initGS(route);
  document.body.dataset.route = route; // Phase B: mystery フェーズ連動
  if (typeof applyMysteryPhase === 'function') applyMysteryPhase(0); // 前ルートの mystery クラスをリセット
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
    showEndroll(() => {
      document.getElementById('screen-charselect').classList.add('active');
      buildCharSelect();
    });
  } else {
    window.MAIN_MODE_ROUTE_INDEX++;
    if (window.MAIN_MODE_ROUTE_INDEX < window.MAIN_MODE_ROUTES.length) {
      const nextRoute = window.MAIN_MODE_ROUTES[window.MAIN_MODE_ROUTE_INDEX];
      document.getElementById('appWindow').classList.add('active');
      resetGame(nextRoute);
    } else {
      showEndroll(goToTitle);
    }
  }
}

function showEndroll(callback) {
  const el = document.getElementById('screen-endroll');
  const cb = callback || goToTitle;
  if (!el) { cb(); return; }
  el.classList.add('active');
  const onEnd = () => {
    el.classList.remove('active');
    cb();
  };
  el.addEventListener('click', onEnd, { once: true });
  document.getElementById('endrollInner')?.addEventListener('animationend', onEnd, { once: true });
}

function goToTitle() {
  document.getElementById('screen-title').classList.add('active');
  window.IS_DEBUG_MODE = null;
  window.MAIN_MODE_ROUTES = null;
  window.MAIN_MODE_ROUTE_INDEX = null;
  _closeAllGameWindows();
  _playTitleBgm();
}

function renderMemoNotes() {
  const list  = document.getElementById('noteList');
  const empty = document.getElementById('noteEmpty');
  if (!list || !empty) return;
  list.innerHTML = '';

  const notes = window._allMemoNotes || [];
  if (notes.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  let lastRoute = null;
  notes.forEach(note => {
    if (note.route !== lastRoute) {
      lastRoute = note.route;
      const header = document.createElement('div');
      header.className = 'note-client-header';
      header.innerHTML = `<span class="note-client-avatar">${note.clientAvatar}</span>${note.clientName}`;
      list.appendChild(header);
    }
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
  const iconInvaders = document.getElementById('taskbarIconInvaders');
  if (iconInvaders) iconInvaders.classList.toggle('running',
    document.getElementById('invadersWindow').classList.contains('active') || !!window.invadersMinimized
  );
  const iconSolitaire = document.getElementById('taskbarIconSolitaire');
  if (iconSolitaire) {
    const solWin = document.getElementById('solitaireWindow');
    iconSolitaire.classList.toggle('running',
      !!(solWin && (solWin.style.display !== 'none' || window.solitaireMinimized))
    );
  }
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

/* ===== CALENDAR & START MENU ===== */
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
