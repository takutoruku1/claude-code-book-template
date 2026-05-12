/* ============================================================
   CHARACTERS
============================================================ */
const CHARACTERS = {
  midori: { name: '田中 みどり', avatar: '🌿', tag: 'チュートリアル' },
  saku:   { name: '水無月 朔',   avatar: '🔧', tag: '' },
  seiji:  { name: '天羽 誠司',   avatar: '☕', tag: '' },
  karen:  { name: '篠宮 花蓮',   avatar: '🌸', tag: 'キーパーソン' },
  minato: { name: 'MINATO AI',  avatar: '[AI]', tag: 'SYSTEM' },
};

/* ============================================================
   ROUTE CLEAR TRACKING
============================================================ */
const _CLEARED_KEY = 'buzzutter_cleared';

function markRouteClear(route) {
  const d = getClearedRoutes();
  d[route] = true;
  localStorage.setItem(_CLEARED_KEY, JSON.stringify(d));
}

function getClearedRoutes() {
  try { return JSON.parse(localStorage.getItem(_CLEARED_KEY) || '{}'); }
  catch { return {}; }
}

function isAllRoutesClear() {
  const d = getClearedRoutes();
  return ['midori', 'saku', 'seiji', 'karen'].every(r => d[r]);
}

/* ============================================================
   CLIENT REACTION MESSAGES (for midori/seiji post-reaction phase)
============================================================ */
const CLIENT_REACTIONS = {
  midori: {
    high_self: 'お母さんからリプライが来た…！！！\nなんか泣けてきた😢\nこれ、私の言葉っぽい気がする',
    high_buzz: 'すごいいいねが来てる…！\nでもなんか、私じゃない感じがして\nちょっとこわいです😢',
    balanced:  'お母さんが毎日見てくれてる…！\nこれくらいのペースが自分に合ってる気がする。\n次、自分で書いてみたいかも',
  },
  saku: {
    high_self: '…ありがとうございます。\nこんなに見てもらえるとは思ってなくて。\nなんか、続けてみようかなって思いました。',
    high_buzz: 'すごい数字で。\nちょっと、こわいくらいです。\n俺の模型で合ってますよね…？',
    balanced:  'ゆっくり見てくれてる人がいるんですね。\nそれだけで、なんか十分な気がして。',
  },
  seiji: {
    high_self: '先週、若いお客さんが来てくれて。SNSで見たって言ってくれました。\nなんか嬉しかったです笑',
    high_buzz: 'すごい反応ですね笑\nでもなんかうちっぽくないな…',
    balanced:  '常連さんが「見たよ」って言ってくれました。\nこれくらいがちょうどいいのかも。',
  },
  karen: {
    high_self: '…見てもらえている、という感じがします。\n姉にも届いていたらいいのですが。',
    high_buzz: '思ったより広がってしまいました。\n少し、怖いです。',
    balanced:  'ゆっくり、でもちゃんと届いている気がします。\nありがとうございました。',
  },
};

/* ============================================================
   GAME STATE
============================================================ */
let GS = {};

function initGS(route) {
  GS = {
    route,
    buzz: 0, self: 0,
    chatBuzzBonus: 0, chatSelfBonus: 0,
    chatBuzzBase: 0,  chatSelfBase: 0,
    egoScore: 0,
    flags: {},
    mysteryClues: [],
    chatResumeAt: null,
    postResumeAt: null,
    selectedStyle:    null,
    selectedHash:     null,
    selectedTime:     null,
    selectedImageSrc: null,
    selectedCards: [],
    flippedCards:  [],
    baseFollowers: 1240,
    flashbackPhase: 0,
    collectedKeywords: [],
    collectedNotes: [],
  };
}

/* ===== ボーナス適用（ゲームやイベント用） ===== */
function applyBonus(selfBonus, buzzBonus) {
  if (selfBonus) GS.chatSelfBonus = Math.min(100, Math.max(0, (GS.chatSelfBonus || 0) + selfBonus));
  if (buzzBonus) GS.chatBuzzBonus = Math.min(100, Math.max(0, (GS.chatBuzzBonus || 0) + buzzBonus));
}

/* ============================================================
   CHAT FLOW MAP  (id → array index)
============================================================ */
let flowMap = {};

function buildFlowMap(route) {
  flowMap = {};
  CHAT_FLOWS[route].forEach((step, i) => {
    if (step.id) flowMap[step.id] = i;
  });
}

/* ============================================================
   UTILS
============================================================ */
function setStep(n) {
  window._currentStep = n;
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('s' + i);
    if (!el) continue;
    el.className = 'step-item' + (i < n ? ' done' : i === n ? ' active' : '');
  }
}

function showArea(name) {
  ['gamePlaceholder','materialArea','postArea','reactionArea'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  if (name) document.getElementById(name).style.display = 'flex';
  window._currentArea = name || 'gamePlaceholder';
  const needsAction = ['materialArea','postArea','reactionArea'].includes(name);
  setDesktopNotif('notifApp', needsAction);
}

function addChatMsg(from, text, ava, keyword, imageSrc) {
  const msgs = document.getElementById('chatMessages');
  const row  = document.createElement('div');
  row.className = 'msg-row' + (from === 'self' ? ' self' : '');
  const senderLabel = from === 'self' ? '湊' : (CHARACTERS[GS?.route]?.name || '相手');
  row.setAttribute('aria-label', `${senderLabel}: ${text}`);
  const now = new Date();
  const t   = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  const extraClass = (from === 'client' && keyword) ? ' clippable' : '';
  // Build image HTML if imageSrc is provided
  const imgHtml = imageSrc
    ? `<div class="msg-image-wrap"><img class="msg-image" src="${imageSrc}" alt="" loading="lazy" onclick="openChatImageViewer(this.src)"></div>`
    : '';
  row.innerHTML = `
    <div class="msg-ava ${from}">${ava}</div>
    <div class="msg-bubble ${from}${extraClass}">${imgHtml}${text.replace(/\n/g,'<br>')}</div>
    <div class="msg-time">${t}</div>`;
  if (from === 'client' && keyword) {
    const bubble = row.querySelector('.msg-bubble');
    bubble.title = '📎 クリックしてメモ';
    bubble.addEventListener('click', () => collectKeyword(keyword, bubble));
  }
  msgs.appendChild(row);
  const pastVisible = document.getElementById('chatPastMessages')?.style.display !== 'none';
  if (!pastVisible) msgs.scrollTop = msgs.scrollHeight;
  if (!window._skipChatHistory) {
    if (!window._chatHistory) window._chatHistory = [];
    window._chatHistory.push({ type: 'msg', from, text, avatar: ava, route: GS?.route, image: imageSrc || null });
    if (from === 'client' && imageSrc) {
      if (!window._chatImages) window._chatImages = [];
      if (!window._chatImages.includes(imageSrc)) window._chatImages.push(imageSrc);
    }
  }
  if (from === 'client' && !window._skipChatHistory) {
    updateChatContactPreview(text);
    const winActive    = document.getElementById('chatWindow')?.classList.contains('active');
    const threadActive = document.getElementById('chatScreenThread')?.classList.contains('active');
    if (!(winActive && threadActive)) {
      window._chatUnread = (window._chatUnread || 0) + 1;
      updateChatBadge();
    }
    if (typeof showProtagMsg === 'function') {
      if (!winActive) {
        setTimeout(() => showProtagMsg(_protagMsg(_PROTAG_GUIDE_CHAT), false, 7000), 600);
      } else {
        if (typeof setMood === 'function') setMood('nervous');
        setTimeout(() => showProtagMsg(_protagMsg(_PROTAG_ON_CLIENT), true, 2800), 600);
      }
    }
  }
  if (from === 'self' && !window._skipChatHistory) {
    if (typeof setMood === 'function') setMood('neutral');
    if (typeof showProtagMsg === 'function') {
      setTimeout(() => showProtagMsg(_protagMsg(_PROTAG_ON_ANSWER), true, 3000), 300);
    }
  }
}

function addTyping() {
  removeTyping();
  const msgs = document.getElementById('chatMessages');
  const r = document.createElement('div');
  r.className = 'msg-row'; r.id = 'typingRow';
  r.setAttribute('role', 'status');
  r.setAttribute('aria-label', '入力中...');
  r.innerHTML = `<div class="msg-ava client">${CHARACTERS[GS.route].avatar}</div>
    <div class="typing-indicator" aria-hidden="true">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>`;
  msgs.appendChild(r);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typingRow');
  if (t) t.remove();
}

function addSysMsg(text) {
  if (!text) return;
  const msgs = document.getElementById('chatMessages');
  const d = document.createElement('div');
  d.className = 'sys-msg'; d.textContent = text;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  if (!window._skipChatHistory) {
    if (!window._chatHistory) window._chatHistory = [];
    window._chatHistory.push({ type: 'sys', text });
  }
}
