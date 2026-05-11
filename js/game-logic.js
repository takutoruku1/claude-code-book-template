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
      // 固定タイマーではなく karenRevealDirections の演出キュー完了後に発火
      // (固定 2500ms だと 12700ms+ の演出キューと二重発火するため)
      const revealDirs = typeof karenRevealDirections !== 'undefined' ? karenRevealDirections : [];
      if (revealDirs.length > 0 && typeof processDirections === 'function') {
        processDirections(revealDirs, () => triggerFlashback(3, null));
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
    w.classList.toggle('locked',
      GS.selectedCards.length >= 2 && !GS.selectedCards.includes(idx));
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
    return 'zure';
  }
  if (GS.route === 'seiji') {
    if (GS.buzz >= 65 && GS.self < 50)     return 'zure';
    return 'saihan';
  }
  return 'saihan';
}

function resolveKarenEnding() {
  if (GS.buzz >= 65 && GS.self < 50) return 'zure';
  return 'kidoku';
}

/* ============================================================
   SHOW ENDING
============================================================ */
function showEnding(endKey) {
  const E = ENDINGS[endKey] || ENDINGS['saihan'];
  const karenEnds = ['zange', 'kidoku', 'chinmoku'];

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

/* ============================================================
   ZANGE 専用演出: typingText + karenResponse
============================================================ */
function _showZangeTyping(E, screenEnding) {
  // .zange-area を作成（まだない場合）
  var zangeArea = screenEnding.querySelector('.zange-area');
  if (!zangeArea) {
    zangeArea = document.createElement('div');
    zangeArea.className = 'zange-area';
    screenEnding.appendChild(zangeArea);
  }

  // .zange-typing-wrap を作成
  var wrap = document.createElement('div');
  wrap.className = 'zange-typing-wrap';
  var display = document.createElement('div');
  display.className = 'zange-typing-display';
  display.textContent = '';
  var cursor = document.createElement('span');
  cursor.className = 'zange-typing-cursor';
  wrap.appendChild(display);
  wrap.appendChild(cursor);
  zangeArea.appendChild(wrap);

  var typingText = E.typingText || '';
  var charMs = 60;

  function typeChars(text, cb) {
    var i = 0;
    function next() {
      if (i >= text.length) { if (cb) cb(); return; }
      display.textContent += text[i];
      i++;
      setTimeout(next, charMs);
    }
    next();
  }

  function deleteChars(cb) {
    function del() {
      if (display.textContent.length === 0) { if (cb) cb(); return; }
      display.textContent = display.textContent.slice(0, -1);
      setTimeout(del, 200 / Math.max(typingText.length, 1));
    }
    del();
  }

  function doTyping(cb) {
    if (E.typingRetry) {
      // 1回目入力
      typeChars(typingText, function() {
        setTimeout(function() {
          // 全削除（200ms かけて）
          deleteChars(function() {
            setTimeout(function() {
              // 2回目入力
              typeChars(typingText, cb);
            }, 500);
          });
        }, 800);
      });
    } else {
      typeChars(typingText, cb);
    }
  }

  doTyping(function() {
    // カーソル非表示
    cursor.style.display = 'none';

    // karenTypingLoops 回インジケーター表示
    var loops = E.karenTypingLoops || 0;
    var loopDelay = 0;
    for (var i = 0; i < loops; i++) {
      (function(d) {
        setTimeout(function() {
          var ind = document.createElement('div');
          ind.className = 'zange-typing-display';
          ind.style.cssText = 'opacity:0.5;letter-spacing:0.3em;';
          ind.textContent = '…';
          zangeArea.appendChild(ind);
          setTimeout(function() {
            if (ind.parentNode) ind.parentNode.removeChild(ind);
          }, 1600);
        }, d);
      })(loopDelay);
      loopDelay += 1600;
    }

    // karenResponse を順次表示
    setTimeout(function() {
      var responses = E.karenResponse || [];
      var rDelay = 0;
      responses.forEach(function(r) {
        (function(d, resp) {
          setTimeout(function() {
            var line = document.createElement('div');
            line.className = 'karen-reply-line';
            line.textContent = resp.text;
            zangeArea.appendChild(line);
          }, d);
        })(rDelay, r);
        rDelay += (r.pauseAfter || 0);
      });

      // silence 1000ms（何もしない）
    }, loopDelay + 1000);
  });
}

/* ============================================================
   CHINMOKU 専用演出: appIconFade + mysteryMessage
============================================================ */
function _showChinmokuEffect(E, screenEnding) {
  // appIconFade
  if (E.appIconFade) {
    var icon = document.querySelector('.desktop-icon[data-app]') ||
               document.querySelector('.app-icon') ||
               document.querySelector('.dock-icon');
    if (icon) {
      icon.style.transition = 'opacity 3s ease';
      icon.style.opacity = '0';
    } else {
      console.warn('[showEnding/chinmoku] appIconFade: アイコン要素が見つかりません');
    }
  }

  // silenceDuration ms 待機
  var silence = E.silenceDuration != null ? E.silenceDuration : 10000;

  setTimeout(function() {
    // mysteryMessage 表示
    if (E.mysteryMessage) {
      var msg = document.createElement('div');
      msg.className = 'ending-mystery-msg';
      msg.innerHTML =
        '<div class="mystery-sender">' + (E.mysteryMessage.sender || '──────') + '</div>' +
        '<div class="mystery-text">' + E.mysteryMessage.text + '</div>';
      screenEnding.appendChild(msg);
    }
  }, silence);
}
