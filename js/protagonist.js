/* ============================================================
   PROTAGONIST WIDGET
============================================================ */

let _protagIdle         = null;
let _protagChoiceTimers = [];

const _MOOD_STATES = {
  neutral: { cls: 'p1', bpm: 23, d: 'M0,11 L40,11 L48,4 L56,18 L64,2 L72,20 L80,11 L120,11 L130,11 L138,4 L146,18 L154,2 L162,20 L170,11 L200,11' },
  nervous: { cls: 'p2', bpm: 62, d: 'M0,11 L20,11 L28,2 L36,20 L44,0 L52,22 L60,11 L90,11 L98,2 L106,20 L114,0 L122,22 L130,11 L160,11 L168,2 L176,20 L184,0 L192,22 L200,11' },
  happy:   { cls: 'p3', bpm: 30, d: 'M0,11 Q20,4 40,11 T80,11 Q100,4 120,11 T160,11 Q180,4 200,11' },
  quiet:   { cls: 'p4', bpm: 18, d: 'M0,11 L60,11 L70,8 L80,14 L90,11 L150,11 L160,8 L170,14 L180,11 L200,11' },
  focused: { cls: 'p5', bpm: 34, d: 'M0,11 L30,11 L38,5 L46,17 L54,3 L62,19 L70,11 L100,11 L108,5 L116,17 L124,3 L132,19 L140,11 L170,11 L178,5 L186,17 L200,11' },
  shaken:  { cls: 'p6', bpm: 78, d: 'M0,11 L15,3 L22,19 L28,7 L36,15 L44,11 L58,11 L64,2 L70,20 L76,5 L82,17 L90,11 L108,11 L114,2 L120,20 L126,5 L134,17 L142,11 L160,11 L166,3 L172,19 L180,7 L188,15 L200,11' },
};
let _currentMood = 'neutral';

function setMood(key) {
  const s = _MOOD_STATES[key];
  if (!s || key === _currentMood) return;
  _currentMood = key;
  const w = document.getElementById('protagonistWidget');
  if (!w) return;
  w.classList.remove('p1', 'p2', 'p3', 'p4', 'p5', 'p6');
  w.classList.add(s.cls);
  const bpmEl = document.getElementById('moodBpm');
  if (bpmEl) bpmEl.textContent = s.bpm;
  const pulse = document.getElementById('moodPulse');
  if (pulse) pulse.setAttribute('d', s.d);
}

function _pick(arr) {
  if (!arr || arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  if (!arr._sq || arr._sq.length === 0) {
    const last = arr._sl ?? null;
    const idxs = arr.map((_, i) => i).sort(() => Math.random() - 0.5);
    if (last !== null && arr[idxs[0]] === last && idxs.length > 1) idxs.push(idxs.shift());
    arr._sq = idxs;
  }
  const idx = arr._sq.shift();
  arr._sl = arr[idx];
  return arr[idx];
}

function clearProtagChoices() {
  _protagChoiceTimers.forEach(t => { clearTimeout(t); clearInterval(t); });
  _protagChoiceTimers = [];
  const c = document.getElementById('protagChoices');
  if (c) c.innerHTML = '';
  setMood('neutral');
}

function showProtagChoices(opts, onSelect) {
  clearProtagChoices();
  setMood('focused');
  const container = document.getElementById('protagChoices');
  if (!container) return;

  let startDelay = 300;

  opts.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'protag-choice-btn';
    btn.style.animationDelay = `${idx * 80}ms`;
    btn.tabIndex = -1; // タイピング完了まで Tab フォーカス対象外

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
          btn.tabIndex = 0; // タイピング完了後に Tab フォーカス対象に
          btn.setAttribute('aria-label', opt.text);
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

function updateProtagWidget() {
  const w = document.getElementById('protagonistWidget');
  if (!w) return;
  if (window.appIsRunning) {
    w.classList.add('visible');
    const topWin = _getTopWindow();
    if (topWin) moveProtagWidgetToWindow(topWin);
    if (!w.classList.contains('p1') && !w.classList.contains('p2') &&
        !w.classList.contains('p3') && !w.classList.contains('p4') &&
        !w.classList.contains('p5') && !w.classList.contains('p6')) {
      _currentMood = '';
      setMood(GS?.route === 'karen' ? 'nervous' : 'neutral');
    }
  } else {
    _protagTrackedWin = null;
    w.classList.remove('visible', 'tracking');
    w.style.left   = '';
    w.style.top    = '';
    w.style.bottom = '';
    _currentMood = '';
  }
}

function _getTopWindow() {
  const ids = ['appWindow','chatWindow','memoAppWindow','gamesWindow','trashWindow','minesweeperWindow','yWindow'];
  let top = null, maxZ = -1;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.classList.contains('active')) return;
    const z = parseInt(el.style.zIndex) || 0;
    if (z > maxZ) { maxZ = z; top = el; }
  });
  return top;
}
