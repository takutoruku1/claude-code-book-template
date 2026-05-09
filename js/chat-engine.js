/* ============================================================
   KEYWORD CLIP
============================================================ */
function collectKeyword(keyword, bubbleEl) {
  if (GS.collectedKeywords.includes(keyword)) return;
  const originalText = bubbleEl.textContent || keyword;
  GS.collectedKeywords.push(keyword);
  GS.collectedNotes.push({ keyword, text: originalText });
  GS.chatSelfBonus += 8;

  // グローバルメモに依頼者情報付きで保存（ルートをまたいで保持）
  if (!window._allMemoNotes) window._allMemoNotes = [];
  const char = (typeof CHARACTERS !== 'undefined' && GS.route) ? CHARACTERS[GS.route] : null;
  window._allMemoNotes.push({
    keyword,
    text: originalText,
    clientName:   char ? char.name   : '不明',
    clientAvatar: char ? char.avatar : '👤',
    route: GS.route,
  });

  bubbleEl.classList.remove('clippable');
  bubbleEl.classList.add('clipped');
  bubbleEl.title = '';
  const badge = document.createElement('div');
  badge.className = 'clip-badge';
  badge.textContent = '📎 メモしました';
  bubbleEl.appendChild(badge);

  if (document.getElementById('memoAppWindow')?.classList.contains('active')) {
    renderMemoNotes();
  } else {
    setDesktopNotif('notifMemo', true);
  }
}

/* ============================================================
   CHAT ENGINE
============================================================ */
function canShow(step) {
  if (!step.condition) return true;
  const { mysteryClues, flags } = GS;
  try {
    return new Function('mysteryClues', 'flags',
      `return (${step.condition})`)(mysteryClues, flags);
  } catch(e) { return false; }
}

function runChatId(id) {
  const idx = flowMap[id];
  if (idx !== undefined) runChat(idx);
}

function runChat(idx) {
  const flow = CHAT_FLOWS[GS.route];
  if (idx >= flow.length) { onChatEnd(); return; }
  const node = flow[idx];

  if (!canShow(node)) { runChat(idx + 1); return; }

  const pause = node.pause || 0;

  if (node.from === 'client') {
    addTyping();
    setTimeout(() => {
      removeTyping();
      addChatMsg('client', node.text, CHARACTERS[GS.route].avatar, node.keyword || null);
      runChat(idx + 1);
    }, pause + 900 + Math.random() * 600);

  } else if (node.from === 'player') {
    if (!_isChatOpen()) {
      // チャトルのトーク画面を開いている間だけ主人公の返信を送信（保留）
      window._pendingPlayerIdx = idx;
      return;
    }
    setTimeout(() => {
      addChatMsg('self', node.text, '👤');
      setTimeout(() => runChat(idx + 1), 400);
    }, pause);

  } else if (node.from === 'system') {
    setTimeout(() => {
      addSysMsg(node.text);
      setTimeout(() => runChat(idx + 1), 800);
    }, pause);

  } else if (node.from === 'choices') {
    setTimeout(() => showChoices(node.opts), pause);

  } else if (node.from === 'trigger') {
    setTimeout(() => handleTrigger(node, idx), pause);
  }
}

const _PROTAG_GUIDE_CHAT = {
  _default: ['依頼人から連絡が来ている。チャトルを見よう', 'メッセージが届いている', 'チャトルを確認しよう'],
};
const _PROTAG_GUIDE_BUZZ = {
  midori:   ['ばずったーで言葉を組み立てよう。みどりらしい言葉を', '彼女の声を文章にする時間だ'],
  saku:     ['ばずったーで朔の世界観を言語化しよう', '職人の言葉をばずったーで組み立てよう'],
  seiji:    ['ばずったーで投稿を設計しよう。数字を動かす言葉を', '誠司の店を言葉で広げる。ばずったーへ'],
  karen:    ['…ばずったーで言葉を選ぶ必要がある', '慎重に言葉を選ぼう。ばずったーで'],
  _default: ['ばずったーで言葉を組み立てよう', '投稿を作ろう。ばずったーへ'],
};
const _PROTAG_GUIDE_POST = {
  midori:   ['準備ができたらばずったーから投稿しよう。みどりの声を届けたい', '彼女の言葉を世界に出す時間だ'],
  saku:     ['言葉が揃った。ばずったーから投稿しよう', '職人の仕事を世界に出そう。ばずったーへ'],
  seiji:    ['投稿の準備完了。ばずったーへ', '仕掛けはできた。あとは投稿するだけだ'],
  karen:    ['…送信するか、ばずったーで決めよう', '覚悟が決まったらばずったーから投稿しよう'],
  _default: ['言葉は揃った。ばずったーから投稿しよう', 'ばずったーへ。投稿しよう'],
};

function _isChatOpen() {
  const winActive    = !!document.getElementById('chatWindow')?.classList.contains('active');
  const threadActive = !!document.getElementById('chatScreenThread')?.classList.contains('active');
  const pastVisible  = document.getElementById('chatPastMessages')?.style.display !== 'none';
  const rightRoute   = !GS?.route || !window._activeChatRoute || window._activeChatRoute === GS.route;
  return winActive && threadActive && !pastVisible && rightRoute;
}
function _isBuzzOpen() {
  return !!document.getElementById('appWindow')?.classList.contains('active');
}

function _onChoiceSelect(opt) {
  const box     = document.getElementById('chatChoices');
  const chatWin = document.getElementById('chatWindow');
  if (chatWin && !chatWin.classList.contains('active')) {
    chatWin.classList.add('active');
    window.chatMinimized = false;
    if (typeof updateTaskbarIndicators === 'function') updateTaskbarIndicators();
  }
  if (chatWin && typeof bringToFront === 'function') bringToFront(chatWin);
  window._pendingChoices = null;
  setDesktopNotif('notifChat', false);
  addChatMsg('self', opt.text, '👤');
  if (box) box.innerHTML = '';
  if (opt.selfBonus) GS.chatSelfBonus += opt.selfBonus;
  if (opt.buzzBonus) GS.chatBuzzBonus += opt.buzzBonus;
  if (opt.egoPlus)   GS.egoScore++;
  if (opt.setFlag)   GS.flags[opt.setFlag] = true;
  setTimeout(() => runChatId(opt.next), 300);
}

function showChoices(opts) {
  const box = document.getElementById('chatChoices');
  if (box) box.innerHTML = '';
  setDesktopNotif('notifChat', true);
  window._pendingChoices = opts;

  if (_isChatOpen()) {
    // チャトルのトーク画面が既に開いているときはウィジェットに直接表示
    if (typeof _showPendingChoicesInWidget === 'function') _showPendingChoicesInWidget();
  } else {
    // チャトルが閉じているときはガイドメッセージを表示（選択肢はチャトルを開いたときに表示）
    if (typeof showProtagMsg === 'function') {
      setTimeout(() => showProtagMsg(_protagMsg(_PROTAG_GUIDE_CHAT), false, 5000), 400);
    }
  }
}

function handleTrigger(node, idx) {
  if (node.action === 'showMaterial') {
    GS.chatResumeAt = node.resumeAt || null;
    setStep(2);
    showArea('materialArea');
    setupMaterials();
    if (!_isBuzzOpen() && typeof showProtagMsg === 'function') {
      setTimeout(() => showProtagMsg(_protagMsg(_PROTAG_GUIDE_BUZZ), false, 7000), 600);
    }

  } else if (node.action === 'showPost') {
    GS.postResumeAt = node.resumeAt || null;
    goToPost();
    if (!_isBuzzOpen() && typeof showProtagMsg === 'function') {
      setTimeout(() => showProtagMsg(_protagMsg(_PROTAG_GUIDE_POST), false, 7000), 600);
    }

  } else if (node.action === 'flashback2') {
    triggerFlashback(2, () => runChat(idx + 1));

  } else if (node.action === 'flashback3') {
    triggerFlashback(3, () => runChat(idx + 1));
  }
}

function onChatEnd() {
  if (GS.route === 'karen') {
    const endKey = resolveKarenEnding();
    const E = ENDINGS[endKey];
    if (E && E.clientMessage) {
      addTyping();
      setTimeout(() => {
        removeTyping();
        addChatMsg('client', E.clientMessage, CHARACTERS.karen.avatar);
        if (endKey === 'kidoku' && E.lastChoice) {
          showKidokuLastChoice(E.lastChoice);
        } else {
          setTimeout(() => showEnding(endKey), 1500);
        }
      }, 1500);
    } else {
      showEnding(endKey);
    }
  } else {
    // 朔など：チャット会話終了後、「結末を見る」ボタンをチャトルに表示
    const chatWin = document.getElementById('chatWindow');
    if (chatWin && !chatWin.classList.contains('active')) {
      chatWin.classList.add('active');
      window.chatMinimized = false;
      if (typeof bringToFront === 'function') bringToFront(chatWin);
      if (typeof updateTaskbarIndicators === 'function') updateTaskbarIndicators();
    }
    if (typeof _showEndingBtn === 'function') _showEndingBtn();
  }
}

function showKidokuLastChoice(choices) {
  const box = document.getElementById('chatChoices');
  if (box) box.innerHTML = '';

  const onSelect = (opt) => {
    if (typeof clearProtagChoices === 'function') clearProtagChoices();
    if (box) box.innerHTML = '';
    if (opt.egoPlus) GS.egoScore++;
    addChatMsg('self', opt.text, '👤');
    const finalKey = GS.egoScore > 0 ? 'zange' : 'chinmoku';
    setTimeout(() => showEnding(finalKey), 500);
  };

  if (typeof showProtagChoices === 'function') {
    showProtagChoices(choices, onSelect);
  }
}

/* ============================================================
   FLASHBACK
============================================================ */
function triggerFlashback(phase, callback) {
  GS.flashbackPhase = Math.max(GS.flashbackPhase, phase);

  const lines = phase === 2
    ? ['…残す、か。', '証拠を残す。それが俺の仕事だった。']
    : ['3年前の捜査。', '篠宮 カレンの姉。', '俺が追っていた——'];

  const lineInterval = 1800;
  const lineDuration = 2200;

  lines.forEach((text, i) => {
    setTimeout(() => {
      if (typeof showProtagMsg === 'function') showProtagMsg(text, false, lineDuration);
      document.getElementById('protagBubble')?.classList.add('flashback');
    }, 300 + i * lineInterval);
  });

  const total = 300 + (lines.length - 1) * lineInterval + lineDuration + 500;
  setTimeout(() => {
    document.getElementById('protagBubble')?.classList.remove('flashback');
    if (callback) callback();
  }, total);
}
