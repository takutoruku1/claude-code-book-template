/* ============================================================
   MATERIAL SETUP
============================================================ */
function setupMaterials() {
  const mats = MATERIALS[GS.route];
  const grid = document.getElementById('materialGrid');
  grid.innerHTML = '';
  GS.selectedCards = [];
  GS.flippedCards  = [];

  mats.forEach((m, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-flip-wrapper';
    wrapper.dataset.idx = i;
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('aria-label', `素材カード: ${m.title}（クリックで内容を確認）`);
    wrapper.innerHTML = `
      <div class="card-check">✓</div>
      <div class="card-flip-inner">
        <div class="card-face">
          <div class="card-face-icon">${m.icon}</div>
          <div class="card-face-title">${m.title}</div>
          <div class="card-face-hint">クリックで内容を確認</div>
        </div>
        <div class="card-back">
          <div class="card-back-type">${m.type}</div>
          <div class="card-back-title">${m.title}</div>
          <div class="card-back-desc">${m.desc.replace(/\n/g,'<br>')}</div>
          <div class="card-back-tags" id="cardTags${i}"></div>
          <div class="card-select-hint">▲ もう一度クリックで選択</div>
        </div>
      </div>`;
    wrapper.onclick = () => handleCardClick(wrapper, i, m);
    wrapper.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(wrapper, i, m); }
    });
    grid.appendChild(wrapper);
  });

  (window._chatImages || []).forEach((src, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-flip-wrapper card-image-wrap';
    wrapper.dataset.imgIdx = i;
    wrapper.innerHTML = `
      <div class="card-check">✓</div>
      <img class="card-image-thumb" src="${src}" alt="">
      <div class="card-image-label">📷 チャトルの写真</div>`;
    wrapper.onclick = () => handleImageCardClick(wrapper, src);
    grid.appendChild(wrapper);
  });

  updateCardBadge();
}

function handleCardClick(wrapper, i, m) {
  const alreadyFlipped  = GS.flippedCards.includes(i);
  const alreadySelected = GS.selectedCards.includes(i);

  if (!alreadyFlipped) {
    wrapper.classList.add('flipped');
    GS.flippedCards.push(i);
    if (m.mysteryFlag && !GS.mysteryClues.includes(m.mysteryFlag)) {
      GS.mysteryClues.push(m.mysteryFlag);
      if (typeof applyMysteryPhase === 'function') applyMysteryPhase(GS.mysteryClues.length); // Phase B: mystery フェーズ連動
    }
    if (m.flashback3Trigger) {
      const karenRevealDirections = [
        { cmd: 'bgm_change',   track: 'silence',      fadeMs: 2000 },
        { cmd: 'wait',         ms: 1800 },
        { cmd: 'sfx',          sound: 'heartbeat',    volume: 0.6 },
        { cmd: 'flash',        color: '#1a0020',      durationMs: 800, opacity: 0.7 },
        { cmd: 'mono',         text: '——篠宮。', style: 'flashback', durationMs: 1800, force: true },
        { cmd: 'wait',         ms: 1200 },
        { cmd: 'mono',         text: 'カレンが好きそう、という名前。ゆきわりそう。既読のつかないメッセージ。', style: 'flashback', durationMs: 3400, force: true },
        { cmd: 'wait',         ms: 1600 },
        { cmd: 'mono',         text: '頭の中で、点と点が線になっていく。', style: 'flashback', durationMs: 2600, force: true },
        { cmd: 'wait',         ms: 1000 },
        { cmd: 'glitch',       target: 'appWindow',   durationMs: 700, intensity: 'medium' },
        { cmd: 'sfx',          sound: 'glitch_buzz',  volume: 0.5 },
        { cmd: 'overlay_text', text: '線になった瞬間——吐き気がした。', style: 'memory', durationMs: 3200, fadeInMs: 600, fadeOutMs: 800 },
        { cmd: 'wait',         ms: 600 },
        { cmd: 'mystery_update' }
      ];
      if (typeof processDirections === 'function') {
        processDirections(karenRevealDirections, () => triggerFlashback(3, null));
      } else {
        setTimeout(() => triggerFlashback(3, null), 2500);
      }
    }
    setTimeout(() => {
      const tagsEl = document.getElementById('cardTags' + i);
      m.tags.forEach((tag, ti) => {
        const t = document.createElement('span');
        t.className = 'card-tag';
        t.style.animationDelay = `${ti * 0.1}s`;
        t.textContent = tag;
        tagsEl.appendChild(t);
      });
    }, 250);
    return;
  }

  if (alreadySelected) {
    wrapper.classList.remove('selected');
    GS.selectedCards = GS.selectedCards.filter(x => x !== i);
  } else {
    if (GS.selectedCards.length >= 2) return;
    wrapper.classList.add('selected');
    GS.selectedCards.push(i);
  }
  updateCardBadge();
  lockExcessCards();
}

function handleImageCardClick(wrapper, src) {
  const alreadySelected = GS.selectedImageSrc === src;
  if (alreadySelected) {
    wrapper.classList.remove('selected');
    GS.selectedImageSrc = null;
  } else {
    document.querySelectorAll('.card-image-wrap.selected').forEach(w => w.classList.remove('selected'));
    wrapper.classList.add('selected');
    GS.selectedImageSrc = src;
  }
}

function updateCardBadge() {
  document.getElementById('cardLimitBadge').textContent = `${GS.selectedCards.length} / 2`;
  document.getElementById('materialProceedBtn').disabled = GS.selectedCards.length === 0;
}

function lockExcessCards() {
  document.querySelectorAll('.card-flip-wrapper').forEach(w => {
    const idx = parseInt(w.dataset.idx);
    const shouldLock = GS.selectedCards.length >= 2 && !GS.selectedCards.includes(idx);
    w.classList.toggle('locked', shouldLock);
    w.setAttribute('aria-disabled', shouldLock ? 'true' : 'false');
    w.setAttribute('tabindex', shouldLock ? '-1' : '0');
  });
}

/* ============================================================
   PROCEED FROM MATERIAL
============================================================ */
function proceedFromMaterial() {
  if (GS.chatResumeAt) {
    const id = GS.chatResumeAt;
    GS.chatResumeAt = null;
    showArea('gamePlaceholder');
    runChatId(id);
  } else {
    goToPost();
  }
}

/* ============================================================
   POST SETUP
============================================================ */
function goToPost() {
  setStep(3);
  showArea('postArea');
  GS.selectedStyle = null;
  GS.selectedHash  = null;
  GS.chatSelfBase  = GS.chatSelfBonus;
  GS.chatBuzzBase  = GS.chatBuzzBonus;

  // メインモード時はスコア表示を非表示にする
  const scoreRow = document.querySelector('.score-row');
  if (scoreRow) {
    scoreRow.style.display = (window.IS_DEBUG_MODE !== false) ? 'flex' : 'none';
  }

  // メモしたキーワードをポストエリア上部に表示
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

  const mats = MATERIALS[GS.route];
  const unlockedStyles = new Set();
  const unlockedHash   = new Set();
  GS.selectedCards.forEach(ci => {
    if (mats[ci]) {
      mats[ci].styleUnlock.forEach(x => unlockedStyles.add(x));
      mats[ci].hashUnlock.forEach(x => unlockedHash.add(x));
    }
  });

  buildOpts('optsStyle', styleOptions,              'selectedStyle', unlockedStyles);
  buildOpts('optsHash',  getHashOptions(GS.route),  'selectedHash',  unlockedHash);
  updatePreview();
}

function buildOpts(containerId, opts, stateKey, unlocked) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'post-opt' + (opt.isBuzz ? ' buzz-risk' : '');
    btn.textContent = opt.label;
    if (!unlocked.has(i)) {
      btn.disabled = true;
      btn.title = 'この素材を選ばないと使えません';
    }
    btn.onclick = () => {
      box.querySelectorAll('.post-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      GS[stateKey] = i;
      updatePreview();
    };
    box.appendChild(btn);
  });
}

function updatePreview() {
  const s = GS.selectedStyle !== null ? styleOptions[GS.selectedStyle] : null;
  const h = GS.selectedHash  !== null ? getHashOptions(GS.route)[GS.selectedHash] : null;

  document.getElementById('previewText').textContent =
    s ? s.textFn() : '文体を選ぶと投稿が表示されます';
  document.getElementById('previewHash').textContent = h ? h.val : '';

  let buzz = GS.chatBuzzBase;
  let self = GS.chatSelfBase;
  if (s) { buzz += s.buzz; self += s.self; }
  if (h) { buzz += h.buzz; self += h.self; }
  buzz = Math.min(100, Math.max(0, buzz));
  self = Math.min(100, Math.max(0, self));
  GS.buzz = buzz; GS.self = self;

  document.getElementById('buzzBar').style.width = buzz + '%';
  document.getElementById('selfBar').style.width = self + '%';
  document.getElementById('buzzVal').textContent  = buzz + '%';
  document.getElementById('selfVal').textContent  = self + '%';

  document.getElementById('postBtn').disabled =
    !(GS.selectedStyle !== null && GS.selectedHash !== null && GS.selectedTime !== null);
}

/* ============================================================
   SUBMIT POST & REACTIONS
============================================================ */
let activeReactionKey = 'balanced';

const TIME_BONUSES = {
  morning: { self: 10, buzz:  5 },
  noon:    { self:  0, buzz: 15 },
  evening: { self:  5, buzz: 10 },
};

function selectTime(btn, time) {
  document.querySelectorAll('#optsTime .time-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  GS.selectedTime = time;
  updatePreview();
}

function submitPost() {
  const bonus = TIME_BONUSES[GS.selectedTime] || { self: 0, buzz: 0 };
  applyBonus(bonus.self, bonus.buzz);
  setStep(4);
  showArea('reactionArea');
  buildReactionFeed();
}

function getReactionKey() {
  if (GS.self >= 60 && GS.buzz < 60) return 'high_self';
  if (GS.buzz >= 65 && GS.self < 50) return 'high_buzz';
  return 'balanced';
}

function buildReactionFeed() {
  const area = document.getElementById('reactionArea');
  area.innerHTML = '';

  const s    = styleOptions[GS.selectedStyle];
  const h    = getHashOptions(GS.route)[GS.selectedHash];
  const rKey   = getReactionKey();
  activeReactionKey = rKey;
  const R      = REACTIONS[rKey];
  const replies = R.replies[GS.route] ?? R.replies.midori;
  const char   = CHARACTERS[GS.route];

  // Y フィード用に投稿内容を保存（全ルートをまたいで保持）
  const _postedItem = {
    avatar:      char.avatar,
    name:        char.name,
    handle:      `@${GS.route}_sns`,
    text:        s ? s.textFn() : '',
    tags:        h ? h.val : '',
    imageSrc:    GS.selectedImageSrc || null,
    replies:     replies,
    likesDelta:  R.likesDelta,
    rtsDelta:    R.rtsDelta,
    route:       GS.route,
  };
  window._lastPostedContent = _postedItem;
  if (!window._allPostedContents) window._allPostedContents = [];
  window._allPostedContents.push(_postedItem);
  if (typeof setDesktopNotif === 'function') setDesktopNotif('notifY', true);
  // Y ウィンドウが開いていれば即時リフレッシュ（リアルタイム感）
  const yWin = document.getElementById('yWindow');
  if (yWin && yWin.classList.contains('active') && typeof renderYTimeline === 'function') {
    renderYTimeline('recommend');
  }

  const postCard = document.createElement('div');
  postCard.className = 'feed-card';
  const _feedImgHtml = GS.selectedImageSrc
    ? `<img class="feed-post-image" src="${GS.selectedImageSrc}" alt="" onclick="openChatImageViewer(this.src)" style="max-width:100%;border-radius:8px;margin-top:6px;cursor:pointer;">`
    : '';
  postCard.innerHTML = `
    <div class="feed-top">
      <div class="feed-avatar">${char.avatar}</div>
      <div>
        <div class="feed-uname">${char.name}</div>
        <div class="feed-handle">@${GS.route}_sns</div>
      </div>
    </div>
    <div class="feed-text">${s.textFn().replace(/\n/g,'<br>')}</div>
    ${_feedImgHtml}
    <div class="feed-tags">${h.val}</div>
    <div class="feed-actions">
      <div class="feed-action" id="likeBtn" onclick="toggleLike(this)">🤍 <span id="likeCount">0</span></div>
      <div class="feed-action" onclick="this.classList.toggle('rtd')">🔁 <span id="rtCount">0</span></div>
      <div class="feed-action">💬 ${replies.length}</div>
    </div>
    <div class="reply-list" id="replyList"></div>`;
  area.appendChild(postCard);

  let lc = 0, rc = 0;
  const likeEl = document.getElementById('likeCount');
  const rtEl   = document.getElementById('rtCount');
  const likeInt = setInterval(() => {
    lc += Math.ceil(R.likesDelta / 30);
    if (lc >= R.likesDelta) { lc = R.likesDelta; clearInterval(likeInt); }
    likeEl.textContent = lc;
    if (lc > 50) document.getElementById('likeBtn').classList.add('liked');
  }, 80);
  const rtInt = setInterval(() => {
    rc++; if (rc >= R.rtsDelta) { rc = R.rtsDelta; clearInterval(rtInt); }
    rtEl.textContent = rc;
  }, 120);

  const rList = document.getElementById('replyList');
  replies.forEach((r, i) => {
    setTimeout(() => {
      const ri = document.createElement('div');
      ri.className = 'reply-item';
      ri.innerHTML = `<div class="reply-ava">${r.ava}</div><div>
        <div class="reply-name">${r.name}</div>
        <div class="reply-text">${r.text}</div></div>`;
      rList.appendChild(ri);
      area.scrollTop = area.scrollHeight;
    }, 900 + i * 700);
  });

  setTimeout(() => {
    const stats = document.createElement('div');
    stats.className = 'stats-row';
    const newTotal = GS.baseFollowers + R.followerDelta;
    const arrow = R.followerDelta >= 0 ? '▲' : '▼';
    const cls   = R.followerDelta >= 0 ? 'pos' : 'neg';
    stats.innerHTML = `
      <div class="stat-chip">
        <span class="stat-num ${cls}">${arrow}${Math.abs(R.followerDelta)}</span>
        <span class="stat-label">フォロワー増減<br>
          <small style="font-size:9px;color:var(--text-dim)">
            ${GS.baseFollowers.toLocaleString()} → ${newTotal.toLocaleString()}
          </small></span>
      </div>
      <div class="stat-chip">
        <span class="stat-num buzz-col">${R.likesDelta}</span>
        <span class="stat-label">いいね</span>
      </div>
      <div class="stat-chip">
        <span class="stat-num">${R.rtsDelta}</span>
        <span class="stat-label">リポスト</span>
      </div>`;
    area.appendChild(stats);

    const btn = document.createElement('button');
    btn.className = 'btn-next-phase';
    btn.textContent = `${char.name}の反応を見る →`;
    btn.onclick = afterReactions;
    area.appendChild(btn);
    area.scrollTop = area.scrollHeight;
  }, 900 + replies.length * 700 + 400);
}

/* ============================================================
   AFTER REACTIONS
============================================================ */
function afterReactions() {
  setStep(5);
  const area   = document.getElementById('reactionArea');
  const oldBtn = area.querySelector('.btn-next-phase');
  if (oldBtn) oldBtn.remove();

  showArea('gamePlaceholder');

  // 全ルート共通：チャトルを開いて現在ルートのトーク画面へ
  const chatWin = document.getElementById('chatWindow');
  if (chatWin) {
    chatWin.classList.add('active');
    window.chatMinimized = false;
    if (typeof bringToFront === 'function') bringToFront(chatWin);
    if (typeof updateTaskbarIndicators === 'function') updateTaskbarIndicators();
  }
  // トーク画面をアクティブにして _activeChatRoute を更新
  if (typeof chatOpenThread === 'function') chatOpenThread(GS.route);

  if (GS.postResumeAt) {
    // 朔など：チャットの続きを再開（依頼人からの反応メッセージを含む）
    const id = GS.postResumeAt;
    GS.postResumeAt = null;
    setTimeout(() => runChatId(id), 400);
  } else {
    // みどり・誠司：CLIENT_REACTIONS から返信を表示
    showClientReaction();
  }
}

/* ============================================================
   CLIENT REACTION (midori / seiji)
============================================================ */
const _PROTAG_Y_BEFORE_END = [
  '（結末を見る前に、Yで反響を確認しておこう）',
  '（投稿の影響を自分の目で確認する）',
  '（Yの空気を読んでから、結末へ）',
  '（コメントまで見てから判断しよう）',
];

function _showEndingBtn() {
  const chatMsgs = document.getElementById('chatMessages');
  if (typeof showProtagMsg === 'function') {
    setTimeout(() => showProtagMsg(_pick(_PROTAG_Y_BEFORE_END), false, 5000, true), 200);
  }
  const btn = document.createElement('button');
  btn.className = 'btn-next-phase';
  btn.style.cssText = 'display:block;margin:12px auto 4px;';
  btn.textContent = '結末を見る →';
  btn.onclick = () => { btn.remove(); showEnding(resolveEnding()); };
  chatMsgs.appendChild(btn);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function showClientReaction() {
  const char = CHARACTERS[GS.route];
  const msgs = CLIENT_REACTIONS[GS.route];
  const msg  = msgs ? msgs[activeReactionKey] : null;

  if (msg) {
    addTyping();
    setTimeout(() => {
      removeTyping();
      addChatMsg('client', msg, char.avatar);
      setTimeout(() => _showEndingBtn(), 400);
    }, 1800);
  } else {
    _showEndingBtn();
  }
}

/* ============================================================
   ENDING RESOLUTION
============================================================ */
function resolveEnding() {
  if (GS.route === 'midori') {
    if (GS.self >= 65)                  return 'jiritu';
    if (GS.buzz >= 65 && GS.self < 50) return 'zure';
    return 'jizoku';
  }
  if (GS.route === 'saku') {
    if (GS.buzz >= 65 && GS.self < 50)           return 'zure';
    if (GS.self >= 60 && GS.flags.kShinonoya)    return 'toutatu';
    return 'saihan';
  }
  if (GS.route === 'seiji') {
    if (GS.buzz >= 65 && GS.self < 50)     return 'zure';
    return 'saihan';
  }
  return 'saihan';
}

function resolveKarenEnding() {
  if (GS.buzz >= 65 && GS.self < 50) return 'zure';
  if (GS.flashbackPhase >= 3)         return 'kidoku';
  return 'saihan';
}

/* ============================================================
   SHOW ENDING
============================================================ */
function showEnding(endKey) {
  const E = ENDINGS[endKey] || ENDINGS['saihan'];
  const screen = document.getElementById('screen-ending');

  // --- 画面をアクティブにする ---
  screen.classList.remove('no-blackout');
  screen.classList.add('active');
  setStep(6);

  // --- 基本情報セット ---
  document.getElementById('endBuzz').textContent  = GS.buzz + '%';
  document.getElementById('endSelf').textContent  = GS.self + '%';
  document.getElementById('endEmoji').textContent = E.emoji;
  document.getElementById('endTitle').textContent = E.name;
  document.getElementById('endSub').textContent   = '';

  // モノローグエリアをリセット
  const monoEl = document.getElementById('endMono');
  if (monoEl) monoEl.innerHTML = '';

  // タイピングエリアをリセット
  const typingArea = document.getElementById('endTypingArea');
  const typingInput = document.getElementById('endTypingInput');
  const karenBubbles = document.getElementById('endKarenBubbles');
  if (typingArea) { typingArea.style.display = 'none'; }
  if (typingInput) typingInput.textContent = '';
  if (karenBubbles) karenBubbles.innerHTML = '';

  // ミステリーメッセージをリセット
  const mysteryEl = document.getElementById('endMysteryMsg');
  if (mysteryEl) { mysteryEl.style.display = 'none'; }

  // --- chinmoku: btn-retry を最初は非表示 ---
  const retryBtn = document.querySelector('.btn-retry');
  if (endKey === 'chinmoku' && retryBtn) {
    retryBtn.style.display = 'none';
  } else if (retryBtn) {
    retryBtn.style.display = '';
  }

  // --- noBlackout (zure): 背景透明 ---
  if (E.noBlackout) {
    screen.classList.add('no-blackout');
  }

  // --- noReplyEffect: チャット入力エリアをグレーアウト ---
  if (E.noReplyEffect) {
    const choices = document.querySelector('.chat-choices');
    if (choices) {
      choices.style.opacity = '0.3';
      choices.style.pointerEvents = 'none';
    }
  }

  // --- BGM管理 ---
  const titleBgm = document.getElementById('titleBgm');
  if (E.bgmTrack === null) {
    // BGMなし: タイトルBGMを停止
    if (titleBgm) titleBgm.pause();
  } else {
    // BGMあり: エンディング専用BGMを再生（ファイルが存在しない場合も try-catch で保護）
    const playBgm = () => {
      const audio = new Audio('bgm/' + E.bgmTrack + '.mp3');
      audio.volume = 0.6;
      try {
        audio.play().catch(() => {});
      } catch (e) {}
    };
    if (E.bgmDelay) {
      setTimeout(playBgm, E.bgmDelay);
    } else {
      playBgm();
    }
  }

  // --- appIconFade (chinmoku): デスクトップアイコンをフェードアウト ---
  if (E.appIconFade) {
    document.querySelectorAll('.desktop-icon').forEach(el => {
      el.style.transition = 'opacity 3s';
      el.style.opacity = '0';
    });
  }

  // --- モノローグ逐次表示 ---
  const interval = E.monologueInterval || 1800;
  if (E.monologue && E.monologue.length > 0 && monoEl) {
    let delay = 400;
    E.monologue.forEach(line => {
      if (line === '') {
        // spacer: intervalだけ待機
        delay += interval;
      } else {
        setTimeout(() => {
          const span = document.createElement('span');
          span.className = 'ending-mono-line';
          span.textContent = line;
          monoEl.appendChild(span);
        }, delay);
        delay += interval;
      }
    });

    // モノローグ終了後にエンド別演出
    const afterMonoDelay = delay;

    // --- chinmoku 固有演出 ---
    if (endKey === 'chinmoku') {
      // mysteryMessage をモノローグ完了後 1000ms で表示
      if (E.mysteryMessage && mysteryEl) {
        setTimeout(() => {
          mysteryEl.style.display = '';
          const senderEl = document.getElementById('mysterySender');
          const textEl = mysteryEl.querySelector('.mystery-text');
          if (senderEl) senderEl.textContent = E.mysteryMessage.sender;
          if (textEl) textEl.textContent = E.mysteryMessage.text;

          // クリックで差出人を逆再生アニメーションで revealed に変える
          mysteryEl.onclick = () => {
            if (senderEl && !senderEl.classList.contains('revealed')) {
              senderEl.classList.add('revealed');
              const original = senderEl.textContent;
              let len = original.length;
              const eraseInterval = setInterval(() => {
                len--;
                senderEl.textContent = original.slice(0, len);
                if (len <= 0) {
                  clearInterval(eraseInterval);
                  senderEl.textContent = E.mysteryMessage.senderRevealed;
                }
              }, 120);
            }
          };
        }, afterMonoDelay + 1000);
      }

      // mysteryMessage 表示後 retryButtonDelay ms でボタンをfadeInで表示
      setTimeout(() => {
        if (retryBtn) {
          retryBtn.style.display = '';
          retryBtn.style.animation = 'fadeIn .6s ease both';
        }
      }, afterMonoDelay + 1000 + (E.retryButtonDelay || 10000));
    }

    // --- zange 固有演出 ---
    if (endKey === 'zange' && E.typingText && typingArea) {
      setTimeout(() => {
        typingArea.style.display = '';

        const fullText = E.typingText;

        // タイピングアニメーション関数
        function typeText(text, onDone) {
          typingInput.textContent = '';
          let i = 0;
          function next() {
            if (i >= text.length) { if (onDone) onDone(); return; }
            typingInput.textContent += text[i];
            i++;
            setTimeout(next, 40 + Math.random() * 40);
          }
          next();
        }

        // typingRetry: 途中まで打ったら削除→最初から再入力
        if (E.typingRetry) {
          // 半分まで打つ
          const halfway = Math.floor(fullText.length / 2);
          const halfText = fullText.slice(0, halfway);
          typeText(halfText, () => {
            // 少し間を置いて削除
            setTimeout(() => {
              let cur = halfText.length;
              const del = setInterval(() => {
                cur--;
                typingInput.textContent = fullText.slice(0, cur);
                if (cur <= 0) {
                  clearInterval(del);
                  // 全文を最初から打ち直す
                  setTimeout(() => {
                    typeText(fullText, () => _startKarenTyping());
                  }, 600);
                }
              }, 30);
            }, 800);
          });
        } else {
          typeText(fullText, () => _startKarenTyping());
        }

        // karenTypingLoops: タイピングインジケーターをN回表示
        function _startKarenTyping() {
          const loops = E.karenTypingLoops || 0;
          let loopCount = 0;

          function showLoop() {
            if (loopCount >= loops) {
              // ループ完了後 karenResponse を表示
              _showKarenResponses();
              return;
            }
            // インジケーター追加
            const ind = document.createElement('div');
            ind.className = 'ending-karen-typing';
            ind.innerHTML = '<span></span><span></span><span></span>';
            karenBubbles.appendChild(ind);
            loopCount++;
            setTimeout(() => {
              ind.remove();
              setTimeout(showLoop, 1200);
            }, 2800);
          }

          showLoop();
        }

        // karenResponse: チャットバブル風に順番に表示
        function _showKarenResponses() {
          const responses = E.karenResponse || [];
          let idx = 0;
          function next() {
            if (idx >= responses.length) return;
            const r = responses[idx];
            const bubble = document.createElement('div');
            bubble.className = 'ending-karen-bubble';
            bubble.textContent = r.text;
            karenBubbles.appendChild(bubble);
            idx++;
            if (r.pauseAfter > 0) {
              setTimeout(next, r.pauseAfter);
            } else {
              // pauseAfter === 0 は「ここで止まる」
            }
          }
          next();
        }

      }, afterMonoDelay);
    }
  }


  // 1. #screen-ending のクラスをリセットし .active + .ending-${endKey} を追加
  var screenEnding = document.getElementById('screen-ending');
  if (!screenEnding) { console.warn('[showEnding] #screen-ending が見つかりません'); return; }
  screenEnding.className = '';
  screenEnding.classList.add('active', 'ending-' + endKey);

  // 2. karen endings の場合 body に .karen-resolve + .ending-${endKey} を追加
  if (karenEnds.indexOf(endKey) !== -1) {
    document.body.classList.remove('karen-resolve');
    karenEnds.forEach(function(k) { document.body.classList.remove('ending-' + k); });
    document.body.classList.add('karen-resolve', 'ending-' + endKey);
  }

  // 3. setStep(6)
  setStep(6);

  // 4. スコア・タイトル等を設定
  var endEmoji = document.getElementById('endEmoji');
  var endTitle = document.getElementById('endTitle');
  var endBuzz  = document.getElementById('endBuzz');
  var endSelf  = document.getElementById('endSelf');
  var endSub   = document.getElementById('endSub');

  if (endEmoji) endEmoji.textContent = E.emoji;
  if (endTitle) endTitle.textContent = E.name;
  if (endBuzz)  endBuzz.textContent  = GS.buzz + '%';
  if (endSelf)  endSelf.textContent  = GS.self + '%';

  // 5. endSub を空にしてモノローグ用エリアとして使う
  if (endSub) endSub.innerHTML = '';

  // 前回の動的要素をクリーンアップ
  var oldZangeArea = screenEnding.querySelector('.zange-area');
  if (oldZangeArea) oldZangeArea.parentNode.removeChild(oldZangeArea);
  var oldMysteryMsg = screenEnding.querySelector('.ending-mystery-msg');
  if (oldMysteryMsg) oldMysteryMsg.parentNode.removeChild(oldMysteryMsg);

  // 6. .btn-retry を非表示に設定
  var btnRetry = screenEnding.querySelector('.btn-retry');
  if (btnRetry) btnRetry.style.display = 'none';

  // 7. BGM変更（存在する場合のみ）
  if (typeof directionBgmChange === 'function' && E.bgmTrack) {
    var bgmDelay = E.bgmDelay || 0;
    setTimeout(function() {
      directionBgmChange({ track: E.bgmTrack, fadeMs: (E.fadeDuration || 0) * 1000, volume: 0.5 });
    }, bgmDelay);
  }

  // 8. モノローグ表示処理（blackoutDuration 秒待機後に開始）
  var blackoutMs = (E.blackoutDuration || 0) * 1000;

  setTimeout(function() {
    // モノローグを1行ずつ表示
    var monologue = E.monologue || [];
    var interval  = E.monologueInterval || 1500;

    // chinmoku: 最後の非空行を特定
    var lastNonEmptyIdx = -1;
    if (endKey === 'chinmoku') {
      for (var i = monologue.length - 1; i >= 0; i--) {
        if (monologue[i] !== '') { lastNonEmptyIdx = i; break; }
      }
    }

    var delay = 0;
    monologue.forEach(function(line, idx) {
      if (line === '') {
        // spacer: 間隔を加算するだけ
        delay += interval;
        return;
      }
      (function(d, l, isLast) {
        setTimeout(function() {
          if (!endSub) return;
          var div = document.createElement('div');
          var cls = 'ending-text';
          if (isLast) cls += ' ending-final-char';
          div.className = cls;
          div.textContent = l;
          endSub.appendChild(div);
          // 自動スクロール
          endSub.scrollTop = endSub.scrollHeight;
        }, d);
      })(delay, line, idx === lastNonEmptyIdx);
      delay += interval;
    });

    // モノローグ全行表示後の処理
    var afterMonologue = delay;

    // noReplyEffect: 入力欄をグレーアウト
    if (E.noReplyEffect) {
      setTimeout(function() {
        // チャット入力エリアを探してグレーアウト
        var targets = [
          document.getElementById('chatChoices'),
          document.querySelector('.chat-choices'),
          document.querySelector('#chatFooter'),
          document.querySelector('.chat-footer'),
          document.querySelector('.chat-input-area')
        ];
        targets.forEach(function(el) {
          if (el) {
            el.style.opacity = '0.3';
            el.style.pointerEvents = 'none';
          }
        });
      }, afterMonologue);
    }

    // zange 専用演出
    if (endKey === 'zange') {
      setTimeout(function() {
        _showZangeTyping(E, screenEnding);
      }, afterMonologue);
    }

    // chinmoku 専用演出
    if (endKey === 'chinmoku') {
      setTimeout(function() {
        _showChinmokuEffect(E, screenEnding);
      }, afterMonologue);
    }

    // zange / chinmoku の演出所要時間を大まかに加算してリトライボタンを表示
    var extraDelay = 0;
    if (endKey === 'zange') {
      // typingRetry + karenTypingLoops + karenResponse 全 pauseAfter の合計
      var zangeTypingMs = (E.typingText || '').length * 60;
      if (E.typingRetry) zangeTypingMs = zangeTypingMs * 2 + 1300 + 500;
      var loopMs = (E.karenTypingLoops || 0) * 1600 + 1000;
      var respMs = (E.karenResponse || []).reduce(function(s, r) { return s + (r.pauseAfter || 0); }, 0);
      extraDelay = zangeTypingMs + loopMs + respMs;
    }
    if (endKey === 'chinmoku') {
      extraDelay = E.silenceDuration != null ? E.silenceDuration : 10000;
    }

    var totalRetryDelay = afterMonologue + extraDelay + (E.retryButtonDelay || 5000);
    setTimeout(function() {
      var btn = document.getElementById('screen-ending') &&
                document.getElementById('screen-ending').querySelector('.btn-retry');
      if (btn) btn.style.display = '';
    }, totalRetryDelay);

  }, blackoutMs);
}
