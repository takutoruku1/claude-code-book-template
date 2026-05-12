/* ============================================================
   PROTAGONIST WIDGET
============================================================ */
const _PROTAG_ON_CLIENT = {
  midori:   ['（感情系だ。言葉を慎重に選べ）', '（言葉の裏にある感情を読む）', '（傷つきやすい。急ぐな）', '（何を本当に求めている？）'],
  saku:     ['（職人気質か。行動で語る人間だ）', '（この人の「核」は何だ）', '（まず傾聴する）', '（何かが引っかかる…）'],
  seiji:    ['（経営者。数字で動く人間だ）', '（要件を整理する）', '（効率を求めている）', '（話がまとまってきた）'],
  karen:    ['（何かを隠している）', '（情報が足りない。もっと引き出せ）', '（慎重に進む）', '（依頼の裏を探る）'],
  _default: ['（まず相手を読む）', '（パターンを探せ）', '（情報を整理しよう）', '（何を求めている？）'],
};
const _PROTAG_ON_CHOICES = {
  midori:   ['（感情に寄り添う選択か、論理的な選択か）', '（彼女が求めているのは共感だ）', '（言葉が武器になる）', '（慎重に選べ）'],
  saku:     ['（職人の言語で話そう）', '（直感より根拠が響く）', '（核心に近い言葉を選ぶ）', '（言葉を絞る）'],
  seiji:    ['（ROIで考える）', '（ビジネス言語で組み立てよう）', '（シンプルに）', '（結論から話した方がいい）'],
  karen:    ['（地雷がある。慎重に）', '（どちらがリスクが低い）', '（…情報が少なすぎる）', '（感情のトリガーを避けながら進む）'],
  _default: ['（変数を整理する）', '（論理か感情か）', '（可能性を絞っていく）', '（どちらのリスクが低い）'],
};
const _PROTAG_ON_ANSWER = {
  midori:   ['（…伝わったか）', '（反応を待つ）', '（彼女の心に届いていれば）', '（計算通りか確認しよう）'],
  saku:     ['（狙い通りか）', '（職人には正直さが一番響く）', '（手応えはある）', '（データを待つ）'],
  seiji:    ['（数字が答えを出す）', '（結果を見よう）', '（打てる手は打った）', '（あとは市場が決める）'],
  karen:    ['（…読み違えていなければいいが）', '（予想外の反応があるかもしれない）', '（監視を続ける）', '（変数が多すぎた）'],
  _default: ['（結果を分析しよう）', '（狙い通りか？）', '（次のデータを待つ）', '（手応えはある）'],
};

const _PROTAG_ON_WINDOW = {
  appWindow:         ['（ばずったー。言葉を設計する）', '（戦略を立てよう）', '（ターゲットは何を求めている）'],
  chatWindow:        ['（依頼人からの情報収集）', '（会話から手がかりを探す）', '（言葉の裏を読め）'],
  memoAppWindow:     ['（情報を整理する）', '（記録を確認しよう）', '（メモを分析する）'],
  gamesWindow:       ['（…休憩か）', '（リフレッシュも戦略のうちだ）', '（少し頭を冷やす）'],
  minesweeperWindow: ['（リスク管理。一手一手確認しよう）', '（論理で解ける）', '（慎重に）'],
  invadersWindow:    ['（標的を捕捉）', '（反射神経の訓練だ）', '（集中）'],
  solitaireWindow:   ['（パターン認識の訓練になる）', '（一手ずつ積み上げる）', '（論理的に解け）'],
  trashWindow:       ['（不要な情報を整理する）', '（断捨離も仕事のうちだ）', '（精査する）'],
  yWindow:           ['（…Yか。世間の空気を読む）', '（情報収集。ここが一番早い）', '（トレンドを把握しておく）', '（数字と感情、両方ある場所だ）'],
};

const _PROTAG_ON_DRAG_START = ['（移動か）', '（追跡する）', '（位置を変えるのか）', '（了解）'];
const _PROTAG_ON_DRAG_END   = ['（位置確認）', '（ここか）', '（よし）', '（確定）'];

const _PROTAG_ON_GAME = {
  'invaders:start':     ['（始めるか）', '（ひとつずつ）', '（集中）'],
  'invaders:playerHit': ['（被弾）', '（…くそ）', '（想定外だった）'],
  'invaders:gameover':  ['（…任務失敗）', '（データを見直す）', '（次は対策する）'],
  'invaders:win':       ['（全標的排除。完了）', '（作戦成功）', '（計算通り）'],
  'invaders:ufo':       ['（UFOか）', '（チャンスだ）', '（狙える）'],
  'ms:start':           ['（リスクマップの解析開始）', '（論理で解ける）', '（慎重に進む）'],
  'ms:lose':            ['（…読み違えた）', '（データ不足だった）', '（失敗。分析しよう）'],
  'ms:win':             ['（完全解析。クリア）', '（論理通りだ）', '（計算通り）'],
  'sol:start':          ['（組み合わせパターンを解析する）', '（最適解を探せ）', '（始めるか）'],
  'sol:foundation':     ['（一手進んだ）', '（順調だ）', '（パターン通り）'],
  'sol:win':            ['（全パターン解析完了）', '（クリア）', '（論理は裏切らない）'],
};

let _protagTimer           = null;
let _protagIdle            = null;
let _protagChoiceTimers    = [];
let _protagMsgExpiry       = 0;
let _choiceHesitationTimer = null;

const _PROTAG_HESITATING = {
  midori:   ['（…感情的な選択か、論理的な選択か）', '（彼女にとって何が正解なんだろう）', '（情報から判断しよう）', '（言葉の温度を合わせる）'],
  saku:     ['（どちらが核心に近い）', '（職人に刺さるのはどっちだ）', '（…分析中）', '（根拠のある方を選ぶ）'],
  seiji:    ['（費用対効果を考えよう）', '（どちらがリターンが高い）', '（…）', '（論理的に考える）', '（計算する）'],
  karen:    ['（…情報が少なすぎる）', '（地雷原を歩いている気分だ）', '（どちらがリスクが低い）', '（勘か、慎重か）', '（慎重に進む）'],
  _default: ['（変数を絞っていこう）', '（…考える）', '（論理か感情か）', '（可能性を排除していく）', '（どちらのリスクが低い）'],
};

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

function _protagMsg(map) {
  const arr = (GS?.route && map[GS.route]) || map._default || [];
  return _pick(arr);
}

function showProtagMsg(text, thinking = false, duration = 3200, force = false) {
  if (!force && Date.now() < _protagMsgExpiry) return;

  const widget = document.getElementById('protagonistWidget');
  const bubble = document.getElementById('protagBubble');
  const textEl = document.getElementById('protagText');
  if (!widget || !bubble || !textEl) return;

  clearTimeout(_protagTimer);
  _protagMsgExpiry = Date.now() + duration;
  textEl.textContent = text;
  bubble.classList.toggle('thinking', thinking);
  bubble.classList.add('show');

  _protagTimer = setTimeout(() => {
    bubble.classList.remove('show');
    _protagMsgExpiry = 0;
  }, duration);
}

function _startChoiceHesitation() {
  _stopChoiceHesitation();
  function tick() {
    const bubble = document.getElementById('protagBubble');
    if (!bubble) return;
    if (!bubble.classList.contains('show')) {
      showProtagMsg(_protagMsg(_PROTAG_HESITATING), true, 4200, true);
      _choiceHesitationTimer = setTimeout(tick, 5400);
    } else {
      _choiceHesitationTimer = setTimeout(tick, 500);
    }
  }
  _choiceHesitationTimer = setTimeout(tick, 1600);
}
function _stopChoiceHesitation() {
  clearTimeout(_choiceHesitationTimer);
  _choiceHesitationTimer = null;
}

function clearProtagChoices() {
  _stopChoiceHesitation();
  _protagChoiceTimers.forEach(t => { clearTimeout(t); clearInterval(t); });
  _protagChoiceTimers = [];
  const c = document.getElementById('protagChoices');
  if (c) c.innerHTML = '';
}

function showProtagChoices(opts, onSelect) {
  clearProtagChoices();
  _startChoiceHesitation();
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
    // アバターはHTML側でSVG定義済みのため上書き不要
    const topWin = _getTopWindow();
    if (topWin) moveProtagWidgetToWindow(topWin);
  } else {
    _protagTrackedWin = null;
    w.classList.remove('visible', 'tracking');
    w.style.left   = '';
    w.style.top    = '';
    w.style.bottom = '';
    clearTimeout(_protagTimer);
    document.getElementById('protagBubble')?.classList.remove('show');
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
