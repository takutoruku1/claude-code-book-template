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

  // direction 命令がある場合は先に実行し、完了後に本来の処理へ進む
  if (node.direction && node.direction.length > 0) {
    processDirections(node.direction, () => _runChatNode(node, idx, pause));
  } else {
    setTimeout(() => _runChatNode(node, idx, pause), 0);
  }
}

function _runChatNode(node, idx, pause) {
  if (node.from === 'client') {
    addTyping();
    setTimeout(() => {
      removeTyping();
      addChatMsg('client', node.text, CHARACTERS[GS.route].avatar, node.keyword || null, node.image || null);
      runChat(idx + 1);
    }, pause + 900 + Math.random() * 600);

  } else if (node.from === 'player') {
    if (!_isChatOpen()) {
      // チャトルのトーク画面を開いている間だけ主人公の返信を送信（保留）
      window._pendingPlayerIdx = idx;
      return;
    }
    const nextStep = node.next ? () => runChatId(node.next) : () => runChat(idx + 1);
    setTimeout(() => {
      if (node.text) addChatMsg('self', node.text, '👤');
      setTimeout(nextStep, node.text ? 400 : 0);
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
  document.body.dataset.flashbackPhase = GS.flashbackPhase; // Phase B: mystery フェーズ連動

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

/* ============================================================
   Phase A: 演出エンジン追加
============================================================ */

/**
 * direction 配列を順番に直列実行する
 * @param {Array} directions - 演出命令の配列
 * @param {Function|null} onComplete - 全命令完了後のコールバック
 */
function processDirections(directions, onComplete) {
  if (!directions || directions.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  let idx = 0;

  function runNext() {
    if (idx >= directions.length) {
      if (onComplete) onComplete();
      return;
    }
    const d = directions[idx++];
    executeDirectionCmd(d, runNext);
  }

  runNext();
}

/**
 * 単一の演出命令を実行し、完了後に next() を呼ぶ
 * @param {Object} d - 演出命令オブジェクト
 * @param {Function} next - 次の命令へ進むコールバック
 */
function executeDirectionCmd(d, next) {
  switch (d.cmd) {

    case 'wait':
      setTimeout(next, d.ms || 1000);
      break;

    case 'bgm_change':
      directionBgmChange(d);
      // BGM切り替えはノンブロッキング（フェード中も次の命令へ進む）
      setTimeout(next, 50);
      break;

    case 'flash':
      directionFlash(d);
      setTimeout(next, (d.durationMs || 400) + 50);
      break;

    case 'glitch':
      directionGlitch(d);
      setTimeout(next, (d.durationMs || 600) + 50);
      break;

    case 'mono':
      if (typeof showProtagMsg === 'function') {
        const bubble = document.getElementById('protagBubble');
        if (d.style === 'flashback' && bubble) bubble.classList.add('flashback');
        if (d.style === 'hollow'    && bubble) bubble.classList.add('hollow');
        showProtagMsg(d.text, false, d.durationMs || 3200, d.force || false);
        setTimeout(() => {
          if (bubble) bubble.classList.remove('flashback', 'hollow');
          next();
        }, (d.durationMs || 3200) + 200);
      } else {
        next();
      }
      break;

    case 'overlay_text':
      directionOverlayText(d);
      setTimeout(next, (d.durationMs || 2800) + 100);
      break;

    case 'sfx':
      directionSfx(d);
      setTimeout(next, 80);
      break;

    case 'mystery_update':
      if (typeof applyMysteryPhase === 'function') applyMysteryPhase(GS.mysteryClues ? GS.mysteryClues.length : 0);
      setTimeout(next, 50);
      break;

    case 'shake':
      directionShake(d);
      setTimeout(next, (d.durationMs || 300) + 50);
      break;

    case 'silence_input':
      directionSilenceInput(d);
      setTimeout(next, (d.durationMs || 3000) + 100);
      break;

    case 'face':
      // 将来の立ち絵実装へのフック（現在はスタブ）
      console.debug('[direction:face]', d);
      next();
      break;

    case 'end':
      if (typeof showEnding === 'function') showEnding(d.key || 'saihan');
      next();
      break;

    default:
      console.warn('[processDirections] unknown cmd:', d.cmd);
      next();
      break;
  }
}

/* ===== BGM切り替え ===== */
function directionBgmChange(d) {
  const track  = d.track  || 'silence';
  const fadeMs = d.fadeMs !== undefined ? d.fadeMs : 800;
  const vol    = d.volume !== undefined ? d.volume : 0.6;

  // 現在再生中のBGMをフェードアウト
  const currentBgm = window._currentBgmEl;
  if (currentBgm && !currentBgm.paused) {
    const startVol = currentBgm.volume;
    const step = startVol / (fadeMs / 50);
    const fadeInterval = setInterval(() => {
      currentBgm.volume = Math.max(0, currentBgm.volume - step);
      if (currentBgm.volume <= 0) {
        currentBgm.pause();
        currentBgm.currentTime = 0;
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  if (track === 'silence') {
    window._currentBgmEl = null;
    return;
  }

  const BGM_SRC = {
    tension_low:    'bgm/tension_low.mp3',
    tension_high:   'bgm/tension_high.mp3',
    op:             'bgm/OP.mp3',
    ending_piano:   'bgm/ending_piano.mp3',
    ending_strings: 'bgm/ending_strings.mp3',
  };

  const src = BGM_SRC[track];
  if (!src) return;

  setTimeout(() => {
    const audio = new Audio(src);
    audio.volume = 0;
    audio.loop = true;
    audio.play().then(() => {
      window._currentBgmEl = audio;
      let v = 0;
      const fadeInInterval = setInterval(() => {
        v = Math.min(vol, v + vol / 20);
        audio.volume = v;
        if (v >= vol) clearInterval(fadeInInterval);
      }, 50);
    }).catch(e => console.warn('[bgm_change] play failed:', e));
  }, fadeMs);
}

/* ===== フラッシュ ===== */
function directionFlash(d) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: ${d.color || '#ffffff'};
    opacity: 0; pointer-events: none;
    transition: opacity ${Math.round((d.durationMs || 400) * 0.3)}ms ease;
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = d.opacity !== undefined ? d.opacity : 0.85;
    setTimeout(() => {
      overlay.style.transition = `opacity ${Math.round((d.durationMs || 400) * 0.7)}ms ease`;
      overlay.style.opacity = 0;
      setTimeout(() => overlay.remove(), (d.durationMs || 400) * 0.7 + 50);
    }, (d.durationMs || 400) * 0.3);
  });
}

/* ===== グリッチ ===== */
function directionGlitch(d) {
  const target = document.getElementById(d.target)
    || document.querySelector('.' + d.target)
    || document.body;
  const cls = `glitch-${d.intensity || 'medium'}`;
  target.classList.add(cls);
  setTimeout(() => target.classList.remove(cls), d.durationMs || 600);
}

/* ===== オーバーレイテキスト ===== */
function directionOverlayText(d) {
  const el = document.createElement('div');
  el.className = `direction-overlay-text direction-overlay-${d.style || 'revelation'}`;
  el.textContent = d.text || '';
  el.style.cssText = `
    position: fixed; inset: 0; z-index: 9990;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity ${d.fadeInMs || 400}ms ease;
  `;
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = 1;
    const holdMs = (d.durationMs || 2800) - (d.fadeInMs || 400) - (d.fadeOutMs || 600);
    setTimeout(() => {
      el.style.transition = `opacity ${d.fadeOutMs || 600}ms ease`;
      el.style.opacity = 0;
      setTimeout(() => el.remove(), (d.fadeOutMs || 600) + 50);
    }, Math.max(100, holdMs));
  });
}

/* ===== 効果音 (Web Audio API による合成音) ===== */
function directionSfx(d) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const vol = d.volume !== undefined ? d.volume : 0.6;

    switch (d.sound) {
      case 'phone_vibrate': {
        // バイブ音: 低周波ノイズ 3回パルス
        for (let i = 0; i < 3; i++) {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = 60;
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
          gain.gain.linearRampToValueAtTime(vol * 0.4, ctx.currentTime + i * 0.15 + 0.02);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.15 + 0.1);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.12);
        }
        break;
      }
      case 'notification_read': {
        // 既読音: 短い高音
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.22);
        break;
      }
      case 'glitch_buzz': {
        // グリッチ音: 短いノイズバースト
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data       = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        const source = ctx.createBufferSource();
        const gain   = ctx.createGain();
        source.buffer = buffer;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        source.connect(gain); gain.connect(ctx.destination);
        source.start(); source.stop(ctx.currentTime + 0.32);
        break;
      }
      case 'heartbeat': {
        // 心拍音: 低音2パルス
        for (let i = 0; i < 2; i++) {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 55;
          const t = ctx.currentTime + i * 0.32;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(vol * 0.7, t + 0.04);
          gain.gain.linearRampToValueAtTime(0, t + 0.18);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(t); osc.stop(t + 0.2);
        }
        break;
      }
      case 'static': {
        // スタティック: 高音ノイズ
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data       = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain   = ctx.createGain();
        filter.type = 'highpass'; filter.frequency.value = 4000;
        gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        source.buffer = buffer;
        source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        source.start(); source.stop(ctx.currentTime + 0.52);
        break;
      }
      default:
        console.debug('[sfx] unknown sound:', d.sound);
    }
  } catch (e) {
    console.warn('[directionSfx] AudioContext error:', e);
  }
}

/* ===== 画面揺れ ===== */
function directionShake(d) {
  const target     = document.getElementById(d.target) || document.body;
  const intensityMap = { light: 3, medium: 6, heavy: 12 };
  const px         = intensityMap[d.intensity || 'light'] || 3;
  const durationMs = d.durationMs || 300;
  const cls        = `shake-${d.intensity || 'light'}`;

  target.style.setProperty('--shake-px', px + 'px');
  target.classList.add(cls);
  setTimeout(() => target.classList.remove(cls), durationMs);
}

/* ===== 既読無音（入力欄封鎖） ===== */
function directionSilenceInput(d) {
  const inputArea = document.getElementById('chatChoices');
  if (!inputArea) return;

  if (d.visual === 'kidoku') {
    inputArea.classList.add('silence-kidoku');
    setTimeout(() => inputArea.classList.remove('silence-kidoku'), d.durationMs || 3000);
  }
}

/* ============================================================
   Phase A: mystery フェーズ連動
============================================================ */

/**
 * GS.mysteryClues.length に基づいて body の mystery-N クラスを切り替える。
 * カードめくり時・direction の mystery_update 命令・ルート開始時に呼ぶ。
 * Phase B で内容を拡充予定。
 */
function applyMysteryPhase(phase) {
  const count = GS && GS.mysteryClues ? GS.mysteryClues.length : 0;
  const raw = phase !== undefined ? phase : count;
  const resolvedPhase = Math.min(raw, 3); // 常に 0〜3 にクランプ

  // 既存の mystery-N クラスを全て除去してから新フェーズを適用
  document.body.classList.remove('mystery-0', 'mystery-1', 'mystery-2', 'mystery-3');
  document.body.classList.add(`mystery-${resolvedPhase}`);
  document.body.dataset.mystery = String(resolvedPhase);

  // フェーズが上がった場合に主人公モノローグで示唆
  const prevPhase = window._lastMysteryPhase || 0;
  if (resolvedPhase > prevPhase && resolvedPhase > 0) {
    _onMysteryPhaseUp(resolvedPhase);
  }
  window._lastMysteryPhase = resolvedPhase;
}

/**
 * mystery フェーズが上昇したときの演出（Phase B で内容を拡充予定）
 * @param {number} newPhase - 新しいフェーズ値 (1〜3)
 */
function _onMysteryPhaseUp(newPhase) {
  const monoTexts = {
    1: '（……何か、引っかかる）',
    2: '（同じ場所が、また出てきた）',
    3: '（——全部、繋がっている）',
  };
  const text = monoTexts[newPhase];
  if (!text) return;

  const glitchIntensity = newPhase === 3 ? 'medium' : 'low';

  // フェーズ2以上ではグリッチを伴う
  if (newPhase >= 2 && typeof processDirections === 'function') {
    processDirections([
      { cmd: 'wait',   ms: 400 },
      { cmd: 'glitch', target: 'protagonistWidget', durationMs: 350, intensity: glitchIntensity },
      { cmd: 'mono',   text, style: 'hollow', durationMs: 2800, force: true }
    ], null);
  } else {
    if (typeof showProtagMsg === 'function') {
      setTimeout(() => showProtagMsg(text, false, 2800, false), 400);
    }
  }
}
