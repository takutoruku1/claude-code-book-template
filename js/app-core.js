/* ============================================================
   CHARACTERS
============================================================ */
const CHARACTERS = {
  midori: { name: '田中 みどり', avatar: '🌿', tag: 'チュートリアル' },
  saku:   { name: '倉田 朔',     avatar: '🔧', tag: '' },
  seiji:  { name: '松本 誠司',   avatar: '☕', tag: '' },
  karen:  { name: '篠宮 花蓮',   avatar: '🌸', tag: 'キーパーソン' },
};

/* ============================================================
   CLIENT REACTION MESSAGES (for midori/seiji post-reaction phase)
============================================================ */
const CLIENT_REACTIONS = {
  midori: {
    high_self: 'お母さんからリプライが来た…！！！\nなんか泣けてきた😢\nこれ、私の言葉っぽい気がする',
    high_buzz: 'すごいいいねが来てる…！\nでもなんか、私じゃない感じがして\nちょっとこわいです😢',
    balanced:  'お母さんが毎日見てくれてる…！\nこれくらいのペースが自分に合ってる気がする。\n次、自分で書いてみたいかも',
  },
  seiji: {
    high_self: '先週、若いお客さんが来てくれて。SNSで見たって言ってくれました。\nなんか嬉しかったです笑',
    high_buzz: 'すごい反応ですね笑\nでもなんかうちっぽくないな…',
    balanced:  '常連さんが「見たよ」って言ってくれました。\nこれくらいがちょうどいいのかも。',
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
    selectedStyle: null,
    selectedHash:  null,
    selectedTime:  null,
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
  const needsAction = ['materialArea','postArea','reactionArea'].includes(name);
  setDesktopNotif('notifApp', needsAction);
}

function addChatMsg(from, text, ava, keyword) {
  const msgs = document.getElementById('chatMessages');
  const row  = document.createElement('div');
  row.className = 'msg-row' + (from === 'self' ? ' self' : '');
  const now = new Date();
  const t   = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  const extraClass = (from === 'client' && keyword) ? ' clippable' : '';
  row.innerHTML = `
    <div class="msg-ava ${from}">${ava}</div>
    <div class="msg-bubble ${from}${extraClass}">${text.replace(/\n/g,'<br>')}</div>
    <div class="msg-time">${t}</div>`;
  if (from === 'client' && keyword) {
    const bubble = row.querySelector('.msg-bubble');
    bubble.title = '📎 クリックしてメモ';
    bubble.addEventListener('click', () => collectKeyword(keyword, bubble));
  }
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
}

function addTyping() {
  removeTyping();
  const msgs = document.getElementById('chatMessages');
  const r = document.createElement('div');
  r.className = 'msg-row'; r.id = 'typingRow';
  r.innerHTML = `<div class="msg-ava client">${CHARACTERS[GS.route].avatar}</div>
    <div class="typing-indicator">
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
}
