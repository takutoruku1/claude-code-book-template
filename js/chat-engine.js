/* ============================================================
   KEYWORD CLIP
============================================================ */
function collectKeyword(keyword, bubbleEl) {
  if (GS.collectedKeywords.includes(keyword)) return;
  const originalText = bubbleEl.textContent || keyword;
  GS.collectedKeywords.push(keyword);
  GS.collectedNotes.push({ keyword, text: originalText });
  GS.chatSelfBonus += 8;
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

function showChoices(opts) {
  const box = document.getElementById('chatChoices');
  box.innerHTML = '';
  setDesktopNotif('notifChat', true);
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      setDesktopNotif('notifChat', false);
      addChatMsg('self', opt.text, '👤');
      box.innerHTML = '';
      if (opt.selfBonus) GS.chatSelfBonus += opt.selfBonus;
      if (opt.buzzBonus) GS.chatBuzzBonus += opt.buzzBonus;
      if (opt.egoPlus)   GS.egoScore++;
      if (opt.setFlag)   GS.flags[opt.setFlag] = true;
      setTimeout(() => runChatId(opt.next), 300);
    };
    box.appendChild(btn);
  });
}

function handleTrigger(node, idx) {
  if (node.action === 'showMaterial') {
    GS.chatResumeAt = node.resumeAt || null;
    setStep(2);
    showArea('materialArea');
    setupMaterials();

  } else if (node.action === 'showPost') {
    GS.postResumeAt = node.resumeAt || null;
    goToPost();

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
    // saku: chat ends after post-reaction dilemma → show ending
    showEnding(resolveEnding());
  }
}

function showKidokuLastChoice(choices) {
  const box = document.getElementById('chatChoices');
  box.innerHTML = '';
  choices.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      box.innerHTML = '';
      if (opt.egoPlus) GS.egoScore++;
      addChatMsg('self', opt.text, '👤');
      const finalKey = GS.egoScore > 0 ? 'zange' : 'chinmoku';
      setTimeout(() => showEnding(finalKey), 500);
    };
    box.appendChild(btn);
  });
}

/* ============================================================
   FLASHBACK
============================================================ */
function triggerFlashback(phase, callback) {
  GS.flashbackPhase = Math.max(GS.flashbackPhase, phase);
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:500;',
    'display:flex;align-items:center;justify-content:center;',
    'flex-direction:column;gap:20px;animation:fadeIn .4s ease;',
  ].join('');

  const lines = phase === 2
    ? ['…残す、か。', '何を、残したかったんだろう。']
    : ['3年前の記事。', '篠宮 カレンの姉。', '私が書いた——'];

  lines.forEach((t, i) => {
    const p = document.createElement('p');
    p.style.cssText = 'color:rgba(200,200,220,.7);font-size:15px;letter-spacing:3px;opacity:0;transition:opacity .8s;';
    p.textContent = t;
    overlay.appendChild(p);
    setTimeout(() => { p.style.opacity = '1'; }, 600 + i * 1400);
  });
  document.body.appendChild(overlay);

  const total = 600 + lines.length * 1400 + 1600;
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity .8s';
    setTimeout(() => { overlay.remove(); if (callback) callback(); }, 800);
  }, total);
}
