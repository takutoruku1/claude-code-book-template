/* ============================================================
   SAVE MANAGER  (3スロット セーブ/ロード)
============================================================ */
const SAVE_SLOT_KEYS = ['buzzutter_save_1', 'buzzutter_save_2', 'buzzutter_save_3'];

function _buildSaveData() {
  const el = id => document.getElementById(id);
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    routeLabel: CHARACTERS[GS.route]?.name || GS.route,
    GS: JSON.parse(JSON.stringify(GS)),
    isDebugMode: window.IS_DEBUG_MODE,
    mainModeRoutes: window.MAIN_MODE_ROUTES,
    mainModeRouteIndex: window.MAIN_MODE_ROUTE_INDEX,
    chatHistory: JSON.parse(JSON.stringify(window._chatHistory || [])),
    pendingChoices: window._pendingChoices
      ? JSON.parse(JSON.stringify(window._pendingChoices)) : null,
    currentStep: window._currentStep || 1,
    currentArea: window._currentArea || 'gamePlaceholder',
    appWindowActive:         el('appWindow')?.classList.contains('active')        ?? false,
    appMinimized:            window.appMinimized   || false,
    chatWindowActive:        el('chatWindow')?.classList.contains('active')       ?? false,
    chatMinimized:           window.chatMinimized  || false,
    memoWindowActive:        el('memoAppWindow')?.classList.contains('active')    ?? false,
    memoMinimized:           window.memoMinimized  || false,
    gamesWindowActive:       el('gamesWindow')?.classList.contains('active')      ?? false,
    gamesMinimized:          window.gamesMinimized || false,
    minesweeperWindowActive: el('minesweeperWindow')?.classList.contains('active') ?? false,
  };
}

function _getSlotData(slot) {
  try {
    const raw = localStorage.getItem(SAVE_SLOT_KEYS[slot - 1]);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function _writeSlot(slot, data) {
  try {
    localStorage.setItem(SAVE_SLOT_KEYS[slot - 1], JSON.stringify(data));
    return true;
  } catch(e) { console.warn('Save failed', e); return false; }
}

function _getSlotMeta(slot) {
  const d = _getSlotData(slot);
  if (!d) return null;
  const date = new Date(d.savedAt);
  return {
    routeLabel: d.routeLabel || '---',
    dateStr: `${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`,
    step: d.currentStep || 1,
  };
}

/* ---- セーブ画面（スロット選択モーダル） ---- */
function _showSlotModal(titleText, onSlotClick, loadMode, showQuitBtn) {
  const existing = document.getElementById('saveSlotModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'saveSlotModal';

  const STEP_LABELS = ['', 'チャット中', 'チャット中', '素材選択中', '投稿作成中', 'リアクション中', '結末'];

  let slotsHtml = '';
  for (let i = 1; i <= 3; i++) {
    const meta = _getSlotMeta(i);
    const disabled = loadMode && !meta;
    slotsHtml += `
      <div class="slot-item${disabled ? ' slot-disabled' : ''}" ${disabled ? '' : `onclick="_onSlotClick(${i})"`}>
        <div class="slot-num">スロット ${i}</div>
        <div class="slot-info">
          ${meta
            ? `<span class="slot-name">${meta.routeLabel}</span>
               <span class="slot-detail">${STEP_LABELS[meta.step] || ''} &nbsp;|&nbsp; ${meta.dateStr}</span>`
            : '<span class="slot-empty">空きスロット</span>'}
        </div>
        ${!loadMode && meta ? '<div class="slot-overwrite">上書き</div>' : ''}
      </div>`;
  }

  const quitBtn = showQuitBtn
    ? `<button class="slot-modal-quit" onclick="_closeSlotModal();closeApp()">セーブせずに終了</button>`
    : '';

  modal.innerHTML = `
    <div class="slot-modal-box">
      <div class="slot-modal-title">${titleText}</div>
      <div class="slot-modal-slots">${slotsHtml}</div>
      ${quitBtn}
      <button class="slot-modal-cancel" onclick="_closeSlotModal()">キャンセル</button>
    </div>`;

  window._slotModalCallback = onSlotClick;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('visible'));
}

function _onSlotClick(slot) {
  const cb = window._slotModalCallback;
  _closeSlotModal();
  if (cb) cb(slot);
}

function _closeSlotModal() {
  const modal = document.getElementById('saveSlotModal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => modal.remove(), 200);
}

/* ---- シャットダウン（セーブ→タイトル） ---- */
function shutdownGame() {
  closeAllPopups();
  if (!window.appIsRunning || !GS || !GS.route) {
    document.getElementById('screen-title').classList.add('active');
    return;
  }
  _showSlotModal('セーブスロットを選択', slot => {
    _writeSlot(slot, _buildSaveData());
    _refreshTitleContinueBtn();
    _showShutdownOverlay(() => closeApp());
  }, false, true);
}

/* ---- スリープ（セーブのみ） ---- */
function sleepGame() {
  closeAllPopups();
  if (!window.appIsRunning || !GS || !GS.route) return;
  _showSlotModal('セーブスロットを選択', slot => {
    _writeSlot(slot, _buildSaveData());
    _refreshTitleContinueBtn();
    _showSaveOverlay();
  }, false);
}

/* ---- ゲーム中からロード ---- */
function showInGameLoadPicker() {
  closeAllPopups();
  const hasAny = SAVE_SLOT_KEYS.some((_, i) => _getSlotData(i + 1));
  if (!hasAny) return;
  _showSlotModal('ロードするスロットを選択', slot => loadFromSlot(slot), true);
}

/* ---- タイトルからロード ---- */
function showLoadSlotPicker() {
  const hasAny = SAVE_SLOT_KEYS.some((_, i) => _getSlotData(i + 1));
  if (!hasAny) return;
  _showSlotModal('ロードするスロットを選択', slot => loadFromSlot(slot), true);
}

/* ---- ロード処理 ---- */
function loadFromSlot(slot) {
  const data = _getSlotData(slot);
  if (!data) return false;

  window._loadingFromSave = true;

  document.getElementById('screen-title').classList.remove('active');
  document.getElementById('screen-ending').classList.remove('active');
  document.getElementById('screen-charselect').classList.remove('active');

  GS = data.GS;
  window.IS_DEBUG_MODE         = data.isDebugMode;
  window.MAIN_MODE_ROUTES      = data.mainModeRoutes;
  window.MAIN_MODE_ROUTE_INDEX = data.mainModeRouteIndex;
  window.appIsRunning    = true;
  window.appMinimized    = data.appMinimized    || false;
  window.chatMinimized   = data.chatMinimized   || false;
  window.memoMinimized   = data.memoMinimized   || false;
  window.gamesMinimized  = data.gamesMinimized  || false;
  window._chatHistory    = data.chatHistory || [];
  window._pendingChoices = data.pendingChoices || null;
  window._currentStep    = data.currentStep || 1;
  window._currentArea    = data.currentArea || 'gamePlaceholder';

  buildFlowMap(GS.route);

  const char = CHARACTERS[GS.route];
  document.getElementById('chatAvatarEl').textContent = char.avatar;
  document.getElementById('chatNameEl').textContent   = char.name;
  document.getElementById('phIcon').textContent       = char.avatar;
  document.getElementById('chatStatus').textContent   = 'オンライン';
  document.getElementById('chatMessages').innerHTML   = '';
  document.getElementById('chatChoices').innerHTML    = '';
  if (typeof _setChatCharInfo === 'function') _setChatCharInfo(char);
  window._routeChats = {};
  if (typeof _initRouteChatEntry === 'function') _initRouteChatEntry(GS.route);
  window._chatUnread = 0;

  window._skipChatHistory = true;
  const msgsEl = document.getElementById('chatMessages');
  (data.chatHistory || []).forEach(m => {
    if (m.type === 'sys') {
      const d = document.createElement('div');
      d.className = 'sys-msg'; d.textContent = m.text;
      msgsEl.appendChild(d);
    } else {
      addChatMsg(m.from, m.text, m.avatar);
    }
  });
  msgsEl.scrollTop = msgsEl.scrollHeight;
  window._skipChatHistory = false;

  const _lastClient = [...(data.chatHistory || [])].reverse().find(m => m.type === 'msg' && m.from === 'client');
  if (_lastClient && typeof updateChatContactPreview === 'function') {
    updateChatContactPreview(_lastClient.text);
  }

  const appWin = document.getElementById('appWindow');
  appWin.classList.toggle('active', !!data.appWindowActive);
  if (data.appWindowActive) bringToFront(appWin);

  const chatWin = document.getElementById('chatWindow');
  chatWin.classList.toggle('active', !!data.chatWindowActive);

  if (data.memoWindowActive) {
    openMemoApp();
  } else {
    closeMemoApp();
  }

  if (data.gamesWindowActive) {
    openGamesWindow();
  } else {
    closeGamesWindow();
  }

  if (data.minesweeperWindowActive) {
    openMinesweeper();
  } else {
    closeMinesweeper();
  }

  setStep(data.currentStep || 1);

  const area = data.currentArea || 'gamePlaceholder';
  ['gamePlaceholder', 'materialArea', 'postArea', 'reactionArea'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  if (area === 'materialArea') {
    document.getElementById('materialArea').style.display = 'flex';
    const savedSelected = [...GS.selectedCards];
    const savedFlipped  = [...GS.flippedCards];
    setupMaterials();
    GS.selectedCards = savedSelected;
    GS.flippedCards  = savedFlipped;
    savedFlipped.forEach(i => {
      const w = document.querySelector(`.card-flip-wrapper[data-idx="${i}"]`);
      if (!w) return;
      w.classList.add('flipped');
      const mats = MATERIALS[GS.route];
      if (!mats[i]) return;
      const tagsEl = document.getElementById('cardTags' + i);
      if (!tagsEl) return;
      mats[i].tags.forEach(tag => {
        const t = document.createElement('span');
        t.className = 'card-tag'; t.textContent = tag;
        tagsEl.appendChild(t);
      });
    });
    savedSelected.forEach(i => {
      const w = document.querySelector(`.card-flip-wrapper[data-idx="${i}"]`);
      if (w) w.classList.add('selected');
    });
    lockExcessCards();
    updateCardBadge();

  } else if (area === 'postArea') {
    document.getElementById('postArea').style.display = 'flex';
    _restorePostArea();

  } else if (area === 'reactionArea') {
    document.getElementById('reactionArea').style.display = 'flex';
    buildReactionFeed();

  } else {
    document.getElementById('gamePlaceholder').style.display = 'flex';
    if (data.pendingChoices) {
      setTimeout(() => showChoices(data.pendingChoices), 100);
    }
  }

  if (typeof chatShowScreen === 'function') chatShowScreen('talk');
  updateTaskbarIndicators();

  // Phase B: mystery フェーズ連動 — ロード後にデータセット属性を復元
  document.body.dataset.route = GS.route;
  document.body.dataset.flashbackPhase = GS.flashbackPhase || 0;
  if (typeof applyMysteryPhase === 'function') applyMysteryPhase(GS.mysteryClues ? GS.mysteryClues.length : 0);

  window._loadingFromSave = false;
  refreshDesktopNotifs();
  return true;
}

function _restorePostArea() {
  const mats = MATERIALS[GS.route];
  const unlockedStyles = new Set();
  const unlockedHash   = new Set();
  GS.selectedCards.forEach(ci => {
    if (mats[ci]) {
      mats[ci].styleUnlock.forEach(x => unlockedStyles.add(x));
      mats[ci].hashUnlock.forEach(x => unlockedHash.add(x));
    }
  });
  const postArea = document.getElementById('postArea');
  const existingBox = postArea.querySelector('.keywords-box');
  if (existingBox) existingBox.remove();
  if (GS.collectedKeywords.length > 0) {
    const box = document.createElement('div');
    box.className = 'keywords-box';
    box.innerHTML = `<div class="keywords-label">📎 メモした言葉</div>
      <div class="keyword-chips">${GS.collectedKeywords.map(k =>
        `<span class="keyword-chip">${k}</span>`).join('')}</div>`;
    postArea.insertBefore(box, postArea.firstChild);
  }
  buildOpts('optsStyle', styleOptions, 'selectedStyle', unlockedStyles);
  buildOpts('optsHash', getHashOptions(GS.route), 'selectedHash', unlockedHash);
  if (GS.selectedStyle !== null)
    document.querySelectorAll('#optsStyle .post-opt')[GS.selectedStyle]?.classList.add('selected');
  if (GS.selectedHash !== null)
    document.querySelectorAll('#optsHash .post-opt')[GS.selectedHash]?.classList.add('selected');
  if (GS.selectedTime !== null)
    document.querySelectorAll('#optsTime .time-opt').forEach(btn => {
      if (btn.dataset.time === GS.selectedTime) btn.classList.add('selected');
    });
  const scoreRow = document.querySelector('.score-row');
  if (scoreRow) scoreRow.style.display = (window.IS_DEBUG_MODE !== false) ? 'flex' : 'none';
  updatePreview();
}

/* ---- セーブ削除（スロット選択） ---- */
function showDeleteSlotPicker() {
  const hasAny = SAVE_SLOT_KEYS.some((_, i) => _getSlotData(i + 1));
  if (!hasAny) return;

  const existing = document.getElementById('saveSlotModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'saveSlotModal';

  const STEP_LABELS = ['', 'チャット中', 'チャット中', '素材選択中', '投稿作成中', 'リアクション中', '結末'];

  let slotsHtml = '';
  for (let i = 1; i <= 3; i++) {
    const meta = _getSlotMeta(i);
    slotsHtml += `
      <div class="slot-item slot-item-delete${meta ? '' : ' slot-disabled'}" ${meta ? `onclick="_onDeleteSlotClick(${i})"` : ''}>
        <div class="slot-num">スロット ${i}</div>
        <div class="slot-info">
          ${meta
            ? `<span class="slot-name">${meta.routeLabel}</span>
               <span class="slot-detail">${STEP_LABELS[meta.step] || ''} &nbsp;|&nbsp; ${meta.dateStr}</span>`
            : '<span class="slot-empty">空きスロット</span>'}
        </div>
        ${meta ? '<div class="slot-delete-icon">🗑</div>' : ''}
      </div>`;
  }

  modal.innerHTML = `
    <div class="slot-modal-box">
      <div class="slot-modal-title">削除するスロットを選択</div>
      <div class="slot-modal-slots">${slotsHtml}</div>
      <button class="slot-modal-cancel" onclick="_closeSlotModal()">キャンセル</button>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('visible'));
}

function _onDeleteSlotClick(slot) {
  const meta = _getSlotMeta(slot);
  if (!meta) return;
  if (!confirm(`スロット ${slot}（${meta.routeLabel}）のセーブデータを削除しますか？`)) return;
  _closeSlotModal();
  localStorage.removeItem(SAVE_SLOT_KEYS[slot - 1]);
  _refreshTitleContinueBtn();
}

/* ---- ヘルパー ---- */
function hasSaveData() {
  return SAVE_SLOT_KEYS.some((_, i) => !!_getSlotData(i + 1));
}

function _refreshTitleContinueBtn() {
  const btn     = document.getElementById('btnContinue');
  const delWrap = document.getElementById('btnDeleteWrap');
  if (!btn) return;
  const has = hasSaveData();
  btn.style.display = has ? '' : 'none';
  if (delWrap) delWrap.style.display = has ? '' : 'none';

  // 新デザインのボタンを同期
  const tsContinue = document.getElementById('tsBtnContinue');
  const tsDelete   = document.getElementById('tsBtnDelete');
  if (tsContinue) tsContinue.hidden = !has;
  if (tsDelete)   tsDelete.hidden   = !has;

  const sub = document.getElementById('btnContinueSub');
  let latest = null;
  if (has) {
    SAVE_SLOT_KEYS.forEach((_, i) => {
      const d = _getSlotData(i + 1);
      if (d && (!latest || new Date(d.savedAt) > new Date(latest.savedAt))) latest = d;
    });
  }
  if (latest) {
    const date  = new Date(latest.savedAt);
    const stamp = `最終セーブ: ${latest.routeLabel}  ${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    if (sub) sub.textContent = stamp;
    const tsSub = document.getElementById('tsContinueSub');
    if (tsSub) tsSub.textContent = stamp;
    const tsMeta = document.getElementById('tsMetaSave');
    if (tsMeta) tsMeta.textContent = `SAVE: ${date.toLocaleDateString('ja-JP')}`;
  } else {
    const tsMeta = document.getElementById('tsMetaSave');
    if (tsMeta) tsMeta.textContent = 'SAVE: NONE';
  }
}

function _showSaveOverlay(callback) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:20000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;opacity:0;transition:opacity .4s;';
  overlay.innerHTML = '<div style="color:rgba(255,255,255,.5);font-size:13px;letter-spacing:2px;">ゲームを保存しました</div>';
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); if (callback) callback(); }, 500);
    }, 1200);
  });
}

function _showShutdownOverlay(callback) {
  _showSaveOverlay(callback);
}

document.addEventListener('DOMContentLoaded', () => {
  _refreshTitleContinueBtn();
});
