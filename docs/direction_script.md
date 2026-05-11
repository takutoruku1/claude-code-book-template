# バズったー — 演出スクリプト設計書

> バージョン: 1.0  
> 作成日: 2026-05-11  
> 担当: 演出・実装エージェント  
> 参照: `docs/機能設計書.md` / `docs/UI設計書.md` / `js/scenario.js` / `js/chat-engine.js`

---

## 目次

1. [演出命令セット定義](#1-演出命令セット定義)
2. [ルート別演出スクリプト](#2-ルート別演出スクリプト)
3. [mystery フェーズ連動UIエフェクト](#3-mystery-フェーズ連動uiエフェクト)
4. [フラッシュバック演出の設計](#4-フラッシュバック演出の設計)
5. [「既読無音」演出の実装案](#5-既読無音演出の実装案)

---

## 1. 演出命令セット定義

### 1-1. 命令一覧と概要

`CHAT_FLOWS` の各ステップに `direction` フィールドとして追加する命令配列。
チャットエンジン（`chat-engine.js`）の `runChat()` が各ステップ処理前に `processDirections()` を呼び出すことで実行される。

| 命令名 | 目的 | 主な使用ルート |
|--------|------|--------------|
| `wait` | 無音の沈黙を挿入する | 誠司・花蓮 |
| `bgm_change` | BGMトラックを切り替える | 朔・花蓮 |
| `flash` | 画面全体に白または色フラッシュ | 花蓮クライマックス |
| `glitch` | テキスト/UI のグリッチエフェクト | 花蓮 |
| `mono` | 主人公の内部モノローグを強制表示 | 朔・誠司・花蓮 |
| `overlay_text` | 画面中央に大きなテキストを一時表示 | 花蓮クライマックス |
| `face` | 将来の立ち絵表情切り替え（現在は拡張用） | 全ルート |
| `sfx` | 効果音を再生する | 誠司・花蓮 |
| `mystery_update` | `applyMysteryPhase()` を即時呼び出す | 朔・誠司・花蓮 |
| `shake` | 画面揺れ（短時間） | 花蓮 |
| `silence_input` | チャット入力欄を一時的に無効化して視覚的に封鎖 | 誠司・花蓮 |

---

### 1-2. 各命令のパラメータ仕様

#### `wait`
```json
{
  "cmd": "wait",
  "ms": 2000
}
```
- `ms`: 待機ミリ秒数。ランタイムで `pause` フィールドと合算して処理する。
- 効果: チャットの自動進行を止め、「間」を演出する。

#### `bgm_change`
```json
{
  "cmd": "bgm_change",
  "track": "tension_low",
  "fadeMs": 1200,
  "volume": 0.4
}
```
- `track`: `"tension_low"` / `"tension_high"` / `"silence"` / `"op"` / `"ending_piano"` / `"ending_strings"`
- `fadeMs`: 現在BGMのフェードアウト時間（ミリ秒）。省略時は 800ms。
- `volume`: 新BGMの音量 0.0〜1.0。省略時は 0.6。

#### `flash`
```json
{
  "cmd": "flash",
  "color": "#ffffff",
  "durationMs": 400,
  "opacity": 0.85
}
```
- `color`: CSS カラー値。白 `#ffffff`（強い想起）/ 暗赤 `#4a0000`（恐怖・罪悪感）/ 青白 `#ddf0ff`（記憶）。
- `durationMs`: フラッシュが消えるまでの時間。
- `opacity`: ピーク時の不透明度。

#### `glitch`
```json
{
  "cmd": "glitch",
  "target": "chatMessages",
  "durationMs": 600,
  "intensity": "medium"
}
```
- `target`: `"chatMessages"` / `"chatBubble"` / `"appWindow"` / `"body"`
- `durationMs`: グリッチ持続時間。
- `intensity`: `"mild"` / `"medium"` / `"severe"` — CSS アニメーション強度クラスに対応（`.mystery-glitch.mild/medium/severe`）。

#### `mono`
```json
{
  "cmd": "mono",
  "text": "…残す、か。あの記事も、残っている。",
  "style": "flashback",
  "durationMs": 3200,
  "force": true
}
```
- `text`: 主人公モノローグのテキスト。
- `style`: `"normal"` / `"flashback"` / `"hollow"` — `protagBubble` の CSS クラスに対応。
- `durationMs`: 表示持続時間。
- `force`: `true` の場合、他のモノローグ表示を割り込んで強制表示。

#### `overlay_text`
```json
{
  "cmd": "overlay_text",
  "text": "全てが、繋がる。",
  "style": "revelation",
  "durationMs": 2800,
  "fadeInMs": 400,
  "fadeOutMs": 600
}
```
- `text`: 画面中央に大きく表示するテキスト。
- `style`: `"revelation"` / `"warning"` / `"memory"` — オーバーレイのCSSクラス名。
- `durationMs`: 表示総時間（フェード込み）。

#### `face`
```json
{
  "cmd": "face",
  "character": "karen",
  "expression": "shocked",
  "position": "left"
}
```
- 現バージョンではスタブ実装（ログ出力のみ）。将来の立ち絵実装への拡張フック。
- `expression`: `"neutral"` / `"shocked"` / `"sad"` / `"determined"`

#### `sfx`
```json
{
  "cmd": "sfx",
  "sound": "notification_read",
  "volume": 0.7
}
```
- `sound`: `"notification_read"` / `"glitch_buzz"` / `"heartbeat"` / `"static"` / `"door_close"` / `"phone_vibrate"`
- 現バージョンでは Web Audio API の `AudioContext` でシンプルなサイン波・ノイズを生成して代替。

#### `mystery_update`
```json
{
  "cmd": "mystery_update"
}
```
- `applyMysteryPhase()` を即座に呼び出してUIクラスを更新する。
- 通常はカードめくり時に自動実行されるが、明示的な更新が必要な演出箇所に挿入する。

#### `shake`
```json
{
  "cmd": "shake",
  "target": "chatWindow",
  "intensity": "light",
  "durationMs": 300
}
```
- `intensity`: `"light"` (±3px) / `"medium"` (±6px) / `"heavy"` (±12px)
- `target`: `"chatWindow"` / `"appWindow"` / `"body"`

#### `silence_input`
```json
{
  "cmd": "silence_input",
  "durationMs": 3000,
  "visual": "kidoku"
}
```
- `visual`: `"kidoku"` — チャット入力欄に「既読」状態の視覚表現を加える。
- 詳細は §5 参照。

---

### 1-3. `scenario.js` での記述方法（JSON形式の実装案）

`CHAT_FLOWS` の各ステップに `direction` 配列フィールドとして追加する。
`direction` 内の命令は配列順に直列実行される（`wait` で次の命令を待機させる）。

```javascript
// scenario.js への追加例
// 朔ルート: @k_shinonoya からDM通知の直前
{
  id: 'saku_dilemma2',
  from: 'client',
  text: 'あの…DMきてて。\n知らないアカウントなんですけど「模型、すごく好きです」って。\nどう返せばいいですか。',
  direction: [
    { cmd: 'sfx',     sound: 'phone_vibrate', volume: 0.6 },
    { cmd: 'wait',    ms: 600 },
    { cmd: 'mono',    text: '（…k_shinonoya）', style: 'hollow', durationMs: 2400, force: true },
    { cmd: 'mystery_update' }
  ]
},

// 花蓮ルート: クライマックス（全て繋がる瞬間）
{
  id: 'karen_mystery_choice',
  from: 'choices',
  condition: 'mysteryClues.length >= 2',
  direction: [
    { cmd: 'bgm_change', track: 'silence', fadeMs: 2000 },
    { cmd: 'wait',       ms: 1800 },
    { cmd: 'flash',      color: '#ddf0ff', durationMs: 600, opacity: 0.6 },
    { cmd: 'overlay_text', text: '全て、繋がっていた。', style: 'revelation', durationMs: 2600, fadeInMs: 500, fadeOutMs: 700 },
    { cmd: 'wait',       ms: 2800 }
  ],
  opts: [
    { text: 'あなたのお姉さんに…記事を書いたのは私です', next: 'karen_zange_response', egoPlus: true, setFlag: 'zange' },
    { text: '（何も言わない）', next: 'karen_end' }
  ]
}
```

---

### 1-4. `processDirections()` 実装案（`chat-engine.js` への追加）

```javascript
// chat-engine.js に追加
/**
 * direction 配列を順番に実行する
 * @param {Array} directions - 演出命令の配列
 * @param {Function} onComplete - 全命令完了後のコールバック
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
      if (typeof applyMysteryPhase === 'function') applyMysteryPhase();
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

    default:
      console.warn('[processDirections] unknown cmd:', d.cmd);
      next();
      break;
  }
}
```

---

### 1-5. 各命令の実装関数

```javascript
// ===== BGM切り替え =====
function directionBgmChange(d) {
  const track = d.track || 'silence';
  const fadeMs = d.fadeMs !== undefined ? d.fadeMs : 800;
  const vol = d.volume !== undefined ? d.volume : 0.6;

  // 現在再生中の BGM をフェードアウト
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

// ===== フラッシュ =====
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

// ===== グリッチ =====
function directionGlitch(d) {
  const target = document.getElementById(d.target) || document.querySelector('.' + d.target) || document.body;
  const cls = `glitch-${d.intensity || 'medium'}`;
  target.classList.add(cls);
  setTimeout(() => target.classList.remove(cls), d.durationMs || 600);
}

// ===== オーバーレイテキスト =====
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

// ===== 効果音 (Web Audio API による合成音) =====
function directionSfx(d) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const vol = d.volume !== undefined ? d.volume : 0.6;

    switch (d.sound) {
      case 'phone_vibrate': {
        // バイブ音: 低周波ノイズ 3回パルス
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
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
        const osc = ctx.createOscillator();
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
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
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
          const osc = ctx.createOscillator();
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
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
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

// ===== 画面揺れ =====
function directionShake(d) {
  const target = document.getElementById(d.target) || document.body;
  const intensityMap = { light: 3, medium: 6, heavy: 12 };
  const px = intensityMap[d.intensity || 'light'] || 3;
  const durationMs = d.durationMs || 300;
  const cls = `shake-${d.intensity || 'light'}`;

  // CSS アニメーションクラスを付与
  target.style.setProperty('--shake-px', px + 'px');
  target.classList.add(cls);
  setTimeout(() => target.classList.remove(cls), durationMs);
}

// ===== 既読無音（入力欄封鎖） =====
function directionSilenceInput(d) {
  const inputArea = document.getElementById('chatChoices');
  if (!inputArea) return;

  if (d.visual === 'kidoku') {
    // 入力欄を「既読スタイル」でマスク
    inputArea.classList.add('silence-kidoku');
    setTimeout(() => inputArea.classList.remove('silence-kidoku'), d.durationMs || 3000);
  }
}
```

---

## 2. ルート別演出スクリプト

### 2-1. みどりルート: 演出なし（チュートリアル）

みどりルートは演出を最小化し、プレイヤーがシステムに慣れることを優先する。
`direction` フィールドは追加しない。既存の `pause` フィールドのみで十分。

**唯一の例外**: お母さんの話を明かす `midori_mother` ステップに軽いモノローグを加える。

```javascript
// scenario.js の midori_mother ステップに追加
{
  id: 'midori_mother',
  from: 'client',
  text: 'お母さんが最近、施設に入ったんです。\n離れてても繋がってるって感じたくて。\n私の日常、見ててほしいなって。',
  clippable: true, keyword: 'お母さんに届けたい',
  direction: [
    // plot_steinsgate.md §みどりルート「翻訳」テーマ確定テキストに合わせる
    { cmd: 'mono', text: '翻訳が上手くいった、と思う。その人の言葉として届く投稿——それが、この仕事の正解だ。', style: 'normal', durationMs: 3600, force: false }
  ]
},
```

---

### 2-2. 朔ルート: `@k_shinonoya` からDM前後の演出スクリプト

#### 演出シーン: DM通知の瞬間（`saku_dilemma2` ステップ前後）

```javascript
// scenario.js の saku_dilemma2 ステップを以下に置き換える
{
  id: 'saku_dilemma2',
  from: 'client',
  text: 'あの…DMきてて。\n知らないアカウントなんですけど「模型、すごく好きです」って。\nどう返せばいいですか。',
  direction: [
    // まず携帯バイブ音でDM着信感
    { cmd: 'sfx',   sound: 'phone_vibrate', volume: 0.5 },
    { cmd: 'wait',  ms: 700 },
    // 主人公に「k_shinonoya」が既知のアカウントである示唆
    { cmd: 'mono',  text: '（……聞いたことのある、アカウント名だ）', style: 'hollow', durationMs: 2800, force: true },
    { cmd: 'wait',  ms: 400 }
  ]
},

// saku_dm_name ステップ（アカウント名を聞いた後）
{
  id: 'saku_dm_name',
  from: 'client',
  text: 'え…k_shinonoya、って。\n知り合いですか？',
  direction: [
    { cmd: 'wait',  ms: 300 },
    // 画面を微細にグリッチさせ、記憶の刺激を表現
    { cmd: 'glitch', target: 'chatMessages', durationMs: 400, intensity: 'low' },
    { cmd: 'sfx',   sound: 'static', volume: 0.3 },
    { cmd: 'mono',  text: '（——3年前の、あのアカウント）', style: 'flashback', durationMs: 3000, force: true },
    { cmd: 'mystery_update' }
  ]
},

// saku_dm_name_reply ステップ（主人公の返答）
{
  id: 'saku_dm_name_reply',
  from: 'player',
  text: '……いえ。\n他人です。\n気にしないでください。',
  direction: [
    { cmd: 'wait', ms: 1200 },
    // 返答後の沈黙で重さを表現
    { cmd: 'mono', text: '（嘘をついた）', style: 'hollow', durationMs: 2200, force: true }
  ]
},
```

---

### 2-3. 誠司ルート: 「ゆきわりそう看板に気づく」シーンの演出スクリプト

看板の素材カード `sj_sign` をめくった瞬間を演出する。
`handleCardClick()` の `mysteryFlag` push 直後に呼ぶ演出フックを追加する。

```javascript
// game-logic.js の handleCardClick() 内、mysteryFlag push の直後に挿入する:
if (m.mysteryFlag && !GS.mysteryClues.includes(m.mysteryFlag)) {
  GS.mysteryClues.push(m.mysteryFlag);

  // 【演出フック】ゆきわりそう看板発見の演出
  if (m.mysteryFlag === 'yukiwarisou') {
    _onYukiwarisouDiscovered();
  }
}

// 追加する関数（game-logic.js または chat-engine.js に配置）
function _onYukiwarisouDiscovered() {
  // mysteryClues に yukiwarisou が追加されたタイミング
  // 既に気づいていた場合は演出を軽くする
  const clueCount = GS.mysteryClues.filter(c => c === 'yukiwarisou').length; // 重複なし配列なので常に<=1
  const totalClues = GS.mysteryClues.length;

  // 朔ルートで初めて気づく場合: 中程度の演出
  if (GS.route === 'saku' && totalClues === 1) {
    if (typeof showProtagMsg === 'function') {
      setTimeout(() => {
        const bubble = document.getElementById('protagBubble');
        if (bubble) bubble.classList.add('hollow');
        showProtagMsg('（…ゆきわりそう）', false, 2800, true);
        setTimeout(() => bubble && bubble.classList.remove('hollow'), 3200);
      }, 800);
    }
    return;
  }

  // 誠司ルートで看板に気づく: 記憶と現在の一致（演出強め）
  if (GS.route === 'seiji') {
    const directions = [
      { cmd: 'wait',    ms: 800 },
      { cmd: 'sfx',     sound: 'notification_read', volume: 0.4 },
      { cmd: 'mono',    text: '（…この看板。朔さんの写真にも——）', style: 'hollow', durationMs: 3200, force: true },
      { cmd: 'wait',    ms: 600 },
      { cmd: 'glitch',  target: 'appWindow', durationMs: 300, intensity: 'low' },
      { cmd: 'mystery_update' }
    ];
    processDirections(directions, null);
  }

  // 花蓮ルートで看板に気づく: クライマックス準備（演出最強）
  if (GS.route === 'karen') {
    const directions = [
      { cmd: 'wait',        ms: 1200 },
      { cmd: 'bgm_change',  track: 'tension_low', fadeMs: 1000, volume: 0.35 },
      { cmd: 'flash',       color: '#ddf0ff', durationMs: 500, opacity: 0.5 },
      { cmd: 'mono',        text: '（また、あの看板だ——）', style: 'flashback', durationMs: 3600, force: true },
      { cmd: 'mystery_update' }
    ];
    processDirections(directions, null);
  }
}
```

---

### 2-4. 花蓮ルート: クライマックス（全て繋がる瞬間）の演出スクリプト

`k_memo` カードをめくった瞬間〜`karen_mystery_choice` 表示までの演出シーケンス。

#### `k_memo` めくり時の演出（`handleCardClick` の `flashback3Trigger` 分岐内に追加）

```javascript
// game-logic.js の handleCardClick() 内、flashback3Trigger の処理を拡張
if (m.flashback3Trigger) {
  // 既存の triggerFlashback(3, null) を以下に置き換え
  setTimeout(() => {
    const karenRevealDirections = [
      { cmd: 'bgm_change',    track: 'silence',      fadeMs: 2000 },
      { cmd: 'wait',          ms: 1800 },
      { cmd: 'sfx',           sound: 'heartbeat',    volume: 0.6 },
      { cmd: 'flash',         color: '#1a0020', durationMs: 800, opacity: 0.7 },
      // overlay_textは使わず、mono連打で身体感覚・衝撃を表現（世界観視点レビュー指摘対応）
      { cmd: 'mono',          text: '——篠宮。', style: 'flashback', durationMs: 1800, force: true },
      { cmd: 'wait',          ms: 1200 },
      { cmd: 'mono',          text: 'カレンが好きそう、という名前。ゆきわりそう。既読のつかないメッセージ。', style: 'flashback', durationMs: 3400, force: true },
      { cmd: 'wait',          ms: 1600 },
      { cmd: 'mono',          text: '頭の中で、点と点が線になっていく。', style: 'flashback', durationMs: 2600, force: true },
      { cmd: 'wait',          ms: 1000 },
      { cmd: 'glitch',        target: 'appWindow', durationMs: 700, intensity: 'medium' },
      { cmd: 'sfx',           sound: 'glitch_buzz', volume: 0.5 },
      // 身体感覚・衝撃を一行に集中（plot_steinsgate.md §湊が気づく瞬間の設計 確定テキスト）
      { cmd: 'overlay_text',  text: '線になった瞬間——吐き気がした。',
                              style: 'memory', durationMs: 3200, fadeInMs: 600, fadeOutMs: 800 },
      { cmd: 'wait',          ms: 600 },
      { cmd: 'mystery_update' }
    ];
    processDirections(karenRevealDirections, () => {
      // 演出終了後に flashback3 を発火
      triggerFlashback(3, null);
    });
  }, 2500);
}
```

#### `karen_mystery_choice` ステップの演出

```javascript
// scenario.js の karen_mystery_choice ステップ
{
  id: 'karen_mystery_choice',
  from: 'choices',
  condition: 'mysteryClues.length >= 2',
  direction: [
    // 完全な沈黙に移行
    { cmd: 'bgm_change',   track: 'silence', fadeMs: 2500 },
    { cmd: 'wait',         ms: 2200 },
    // 一瞬のフラッシュで「真実の瞬間」を表現
    { cmd: 'flash',        color: '#ddf0ff', durationMs: 700, opacity: 0.65 },
    { cmd: 'wait',         ms: 400 },
    // 全てが繋がったことをオーバーレイで示す
    { cmd: 'overlay_text', text: '全て、繋がっていた。', style: 'revelation',
                           durationMs: 3000, fadeInMs: 500, fadeOutMs: 700 },
    { cmd: 'wait',         ms: 3200 },
    // 選択肢を出す前にわずかな間
    { cmd: 'mono',         text: '（…言うか、言わないか）', style: 'hollow', durationMs: 2400, force: true },
    { cmd: 'wait',         ms: 800 }
  ],
  opts: [
    { text: 'あなたのお姉さんに…記事を書いたのは私です', next: 'karen_zange_response', egoPlus: true, setFlag: 'zange' },
    { text: '（何も言わない）', next: 'karen_end' }
  ]
},

// karen_zange_response ステップ（花蓮の返答）
{
  id: 'karen_zange_response',
  from: 'client',
  text: '知っていました。',
  pause: 8000,
  direction: [
    // 告白直後の沈黙を演出
    { cmd: 'silence_input', durationMs: 3000, visual: 'kidoku' },
    { cmd: 'wait',          ms: 1500 },
    { cmd: 'sfx',           sound: 'notification_read', volume: 0.3 },
    // 8秒の pause の間、心拍音で緊張感を維持
    { cmd: 'sfx',           sound: 'heartbeat', volume: 0.25 }
  ]
},

// 贖罪エンド経路: karen_zange_response → エンディングへの橋渡し演出
// plot_steinsgate.md §「全てが繋がる」収束のナラティブ 確定テキストに準拠
{
  id: 'karen_zange_mono_bridge',
  from: 'player',
  text: '',
  direction: [
    { cmd: 'wait',  ms: 1200 },
    // 「翻訳」テーマの収束モノローグ（贖罪エンド経路）
    { cmd: 'mono',  text: '3年前の記事は、今もある。', style: 'hollow', durationMs: 2400, force: true },
    { cmd: 'wait',  ms: 1800 },
    { cmd: 'mono',  text: '翻訳者というのは、消えることだと思う。', style: 'hollow', durationMs: 2800, force: true },
    { cmd: 'wait',  ms: 2000 },
    { cmd: 'mono',  text: '3年前の私は、代わりに叫んだ。自分のために。', style: 'flashback', durationMs: 3000, force: true },
    { cmd: 'wait',  ms: 1800 },
    { cmd: 'mono',  text: '今は——その人の言葉として届けようとしている。', style: 'hollow', durationMs: 3000, force: true },
    { cmd: 'wait',  ms: 2000 },
    { cmd: 'mono',  text: 'これが贖罪なのか、ただの仕事なのか。わからないまま、明日も仕事がある。', style: 'hollow', durationMs: 4000, force: true },
    { cmd: 'wait',  ms: 1600 }
  ]
},
```

---

## 3. mystery フェーズ連動UIエフェクト

### 3-1. フェーズ定義

`GS.mysteryClues.length` の値に応じて4段階のUIフェーズを設定する。

| フェーズ | `mysteryClues.length` | 状態 | UIの変化 |
|--------|----------------------|------|---------|
| `mystery-0` | 0 | 手がかりなし | 通常UI |
| `mystery-1` | 1 | 最初の手がかり | 微細な変化（主人公ウィジェットの色調変化） |
| `mystery-2` | 2 | 手がかり収束中 | チャットバブルの境界線色変化・入力欄ヒント |
| `mystery-3` | 3以上 | 全手がかり揃い | グリッチフィルター・UIの不安定化 |

---

### 3-2. CSSクラス名と適用タイミング

```css
/* css/main.css に追加 */

/* ===== MYSTERY PHASE EFFECTS ===== */

/* Phase 1: 最初の手がかり — 微細な変化 */
body.mystery-1 #protagonistWidget .protagBubble {
  border-color: rgba(160, 107, 255, 0.25);
}
body.mystery-1 .msg-bubble.client {
  border-left: 2px solid transparent;
  transition: border-color 1.2s ease;
}

/* Phase 2: 手がかり収束中 — 境界線が染まりはじめる */
body.mystery-2 .msg-bubble.client {
  border-left: 2px solid rgba(160, 107, 255, 0.35);
}
body.mystery-2 #protagonistWidget .protagBubble {
  border-color: rgba(160, 107, 255, 0.5);
  box-shadow: 0 0 10px rgba(160, 107, 255, 0.15);
}
body.mystery-2 .protagBubble.hollow {
  background: rgba(30, 10, 50, 0.95);
  color: #c4a0ff;
}
/* チャット入力欄に微かな警告色 */
body.mystery-2 #chatInputArea {
  border-top-color: rgba(160, 107, 255, 0.2);
}

/* Phase 3: 全手がかり揃い — UIの不安定化 */
body.mystery-3 .msg-bubble.client {
  border-left: 2px solid rgba(160, 107, 255, 0.65);
}
body.mystery-3 #protagonistWidget .protagBubble {
  border-color: rgba(160, 107, 255, 0.75);
  box-shadow: 0 0 18px rgba(160, 107, 255, 0.28);
  animation: mysteryShadowPulse 3.5s ease-in-out infinite;
}
body.mystery-3 .desktop {
  filter: saturate(0.88) hue-rotate(-4deg);
  transition: filter 2s ease;
}
/* デスクトップ全体に極微細なグリッチフィルター */
body.mystery-3 .desktop::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 8888;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(160, 107, 255, 0.015) 2px,
    rgba(160, 107, 255, 0.015) 4px
  );
  animation: mysteryScanline 8s linear infinite;
  opacity: 0.6;
}

@keyframes mysteryShadowPulse {
  0%, 100% { box-shadow: 0 0 18px rgba(160, 107, 255, 0.28); }
  50%       { box-shadow: 0 0 28px rgba(160, 107, 255, 0.48); }
}

@keyframes mysteryScanline {
  0%   { background-position: 0 0; }
  100% { background-position: 0 40px; }
}

/* ===== GLITCH ANIMATION CLASSES ===== */
.glitch-low {
  animation: glitchLow 0.6s steps(2) forwards;
}
.glitch-medium {
  animation: glitchMedium 0.6s steps(3) forwards;
}
.glitch-high {
  animation: glitchHigh 0.7s steps(4) forwards;
}

@keyframes glitchLow {
  0%   { transform: translate(0, 0);    filter: none; }
  20%  { transform: translate(-2px, 1px); filter: brightness(1.05); }
  40%  { transform: translate(1px, -1px); }
  60%  { transform: translate(-1px, 0); }
  80%  { transform: translate(0, 1px); }
  100% { transform: translate(0, 0);    filter: none; }
}

@keyframes glitchMedium {
  0%   { transform: translate(0, 0);      clip-path: none; filter: none; }
  15%  { transform: translate(-4px, 2px); filter: hue-rotate(20deg) brightness(1.1); }
  30%  { transform: translate(3px, -2px); clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%); }
  50%  { transform: translate(-2px, 1px); clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%); }
  70%  { transform: translate(2px, -1px); filter: hue-rotate(-15deg); clip-path: none; }
  100% { transform: translate(0, 0);      filter: none; }
}

@keyframes glitchHigh {
  0%   { transform: translate(0, 0) skew(0);        filter: none; }
  10%  { transform: translate(-6px, 3px) skew(-2deg); filter: hue-rotate(40deg) brightness(1.2) saturate(2); }
  25%  { transform: translate(5px, -3px) skew(1deg);  clip-path: polygon(0 0, 100% 0, 100% 30%, 0 30%); }
  40%  { transform: translate(-3px, 5px) skew(-1deg); clip-path: polygon(0 40%, 100% 40%, 100% 70%, 0 70%); filter: invert(0.1); }
  55%  { transform: translate(4px, -2px) skew(2deg);  clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%); }
  70%  { transform: translate(-2px, 2px) skew(-1deg); clip-path: none; filter: hue-rotate(-30deg); }
  85%  { transform: translate(2px, -1px) skew(0); }
  100% { transform: translate(0, 0) skew(0);        filter: none; }
}

/* ===== SHAKE ANIMATIONS ===== */
.shake-light {
  animation: shakeLightAnim var(--shake-duration, 300ms) ease forwards;
}
.shake-medium {
  animation: shakeMediumAnim var(--shake-duration, 300ms) ease forwards;
}
.shake-heavy {
  animation: shakeHeavyAnim var(--shake-duration, 300ms) ease forwards;
}

@keyframes shakeLightAnim {
  0%, 100% { transform: translate(0, 0); }
  20%  { transform: translate(-3px, 1px); }
  40%  { transform: translate(3px, -1px); }
  60%  { transform: translate(-2px, 2px); }
  80%  { transform: translate(2px, -2px); }
}
@keyframes shakeMediumAnim {
  0%, 100% { transform: translate(0, 0); }
  20%  { transform: translate(-6px, 2px); }
  40%  { transform: translate(6px, -2px); }
  60%  { transform: translate(-4px, 4px); }
  80%  { transform: translate(4px, -4px); }
}
@keyframes shakeHeavyAnim {
  0%, 100% { transform: translate(0, 0); }
  15%  { transform: translate(-12px, 4px); }
  30%  { transform: translate(12px, -4px); }
  45%  { transform: translate(-8px, 8px); }
  60%  { transform: translate(8px, -8px); }
  75%  { transform: translate(-4px, 4px); }
  90%  { transform: translate(4px, -4px); }
}

/* ===== OVERLAY TEXT STYLES ===== */
.direction-overlay-text {
  font-family: 'DotGothic16', 'Noto Sans JP', monospace;
  font-size: clamp(20px, 4vw, 36px);
  line-height: 1.6;
  text-align: center;
  letter-spacing: 0.12em;
  white-space: pre-line;
  padding: 24px;
  text-shadow: 0 0 30px currentColor;
}
.direction-overlay-revelation {
  background: rgba(5, 0, 20, 0.88);
  color: #c4a0ff;
}
.direction-overlay-memory {
  background: rgba(0, 5, 25, 0.92);
  color: #a0c8ff;
  font-size: clamp(16px, 3vw, 28px);
}
.direction-overlay-warning {
  background: rgba(25, 0, 0, 0.90);
  color: #ff8080;
}

/* ===== PROTAGBUBBLE STYLES (新規追加) ===== */
.protagBubble.hollow {
  background: rgba(20, 8, 40, 0.97);
  border-color: rgba(160, 107, 255, 0.6);
  color: #c4a0ff;
}

/* ===== SILENCE KIDOKU STYLE ===== */
#chatChoices.silence-kidoku {
  position: relative;
  pointer-events: none;
  opacity: 0.35;
}
#chatChoices.silence-kidoku::after {
  content: '既読';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 0.1em;
}
```

---

### 3-3. `applyMysteryPhase()` 関数の実装案（JavaScript）

```javascript
// js/chat-engine.js または js/app-core.js に追加

/**
 * GS.mysteryClues.length に基づいて body の mystery-N クラスを切り替える。
 * カードめくり時・direction の mystery_update 命令・ルート開始時に呼ぶ。
 */
function applyMysteryPhase() {
  const count = GS.mysteryClues ? GS.mysteryClues.length : 0;
  const phase = count >= 3 ? 3 : count; // 0, 1, 2, 3

  // 既存の mystery-N クラスを全て除去してから新フェーズを適用
  document.body.classList.remove('mystery-0', 'mystery-1', 'mystery-2', 'mystery-3');
  document.body.classList.add(`mystery-${phase}`);

  // フェーズが上がった場合に主人公モノローグで示唆
  const prevPhase = window._lastMysteryPhase || 0;
  if (phase > prevPhase && phase > 0) {
    _onMysteryPhaseUp(phase);
  }
  window._lastMysteryPhase = phase;
}

/**
 * mystery フェーズが上昇したときの演出
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
      { cmd: 'wait',    ms: 400 },
      { cmd: 'glitch',  target: 'protagonistWidget', durationMs: 350, intensity: glitchIntensity },
      { cmd: 'mono',    text, style: 'hollow', durationMs: 2800, force: true }
    ], null);
  } else {
    if (typeof showProtagMsg === 'function') {
      setTimeout(() => showProtagMsg(text, false, 2800, false), 400);
    }
  }
}

// handleCardClick() 内の mysteryFlag push 後に追加:
// applyMysteryPhase();
```

**呼び出しタイミング一覧:**

| タイミング | 呼び出し箇所 |
|-----------|------------|
| カードをめくって mysteryFlag push された直後 | `game-logic.js` の `handleCardClick()` 内 |
| `direction` の `mystery_update` 命令実行時 | `executeDirectionCmd()` の `case 'mystery_update'` |
| ルート開始時（`initGS` 直後） | `resetGame()` 内（初回は phase-0 を適用） |
| セーブデータからロード時 | `loadFromSlot()` 内 |

---

## 4. フラッシュバック演出の設計

### 4-1. フェーズ進行条件とタイミング

既存の `triggerFlashback()` 関数（`chat-engine.js`）を拡張し、各フェーズの演出を強化する。

| フェーズ | 進行条件 | タイミング | `flashbackPhase` 値 |
|--------|---------|-----------|-------------------|
| Phase 0 | 初期状態 | ゲーム開始時 | 0 |
| Phase 1 | ゲーム開始直後（プロローグ） | `startMainModeAutoRoute()` 後の最初のシーン | 1 |
| Phase 2 | 朔ルート・`saku_fb2` trigger 発火時 | 朔が「なんか残したくて」と言った後 | 2 |
| Phase 3 | 花蓮ルート・`k_memo` カードめくり時（2500ms後） | `flashback3Trigger: true` カードめくり | 3 |

---

### 4-2. 各フェーズで表示するフラッシュバック内容

#### Phase 1: ゲーム開始直後のプロローグ

CRT風テキスト（既存実装）。追加演出として静的ノイズ音を加える。

```javascript
// 既存の Phase 1 プロローグ演出に sfx を追加
function showPhase1Prologue(callback) {
  // 既存の CRT テキスト表示の前に静的ノイズを鳴らす
  if (typeof directionSfx === 'function') {
    directionSfx({ cmd: 'sfx', sound: 'static', volume: 0.2 });
  }

  // 既存実装: CRT風テキスト5秒表示
  // 「深夜2時。送信ボタンを押した。」
  // 「@k_shinonoya のアカウントが削除されました」
  // → この処理は title-screen.js またはゲーム開始フックに存在する想定

  GS.flashbackPhase = 1;
  if (typeof applyMysteryPhase === 'function') applyMysteryPhase();
  if (callback) callback();
}
```

#### Phase 2: 朔ルート・「残したい」発言後

```javascript
// chat-engine.js の triggerFlashback() 内、phase === 2 の処理を以下に置き換え
function triggerFlashback(phase, callback) {
  GS.flashbackPhase = Math.max(GS.flashbackPhase, phase);

  if (phase === 2) {
    const phase2Directions = [
      // 0.8秒の無音停止
      { cmd: 'wait',       ms: 800 },
      // 暗赤フラッシュで記憶の侵入を表現
      { cmd: 'flash',      color: '#1a0000', durationMs: 500, opacity: 0.55 },
      { cmd: 'sfx',        sound: 'static', volume: 0.25 },
      // モノローグ行 1（plot_steinsgate.md §朔ルート「追加フラッシュバック強化テキスト」確定版）
      { cmd: 'mono',       text: '——残す。あの記事も、残っている。', style: 'flashback', durationMs: 2200, force: true },
      { cmd: 'wait',       ms: 1800 },
      // モノローグ行 2
      { cmd: 'mono',       text: '2200文字。送信まで8分かかった。', style: 'flashback', durationMs: 2000, force: true },
      { cmd: 'wait',       ms: 1600 },
      // モノローグ行 3
      { cmd: 'mono',       text: '@k_shinonoya のアカウントが削除されたのを確認したのは、翌朝の5時だった。', style: 'flashback', durationMs: 3200, force: true },
      { cmd: 'wait',       ms: 2000 },
      // モノローグ行 4
      { cmd: 'mono',       text: 'コメント欄は302件。私が書いたのはその火種の一つだった。', style: 'flashback', durationMs: 3000, force: true },
      { cmd: 'wait',       ms: 2200 }
    ];
    processDirections(phase2Directions, () => {
      document.getElementById('protagBubble')?.classList.remove('flashback');
      if (callback) callback();
    });

  } else if (phase === 3) {
    const phase3Directions = [
      // Phase 3 は §2-4 の k_memo 演出とのシーケンスで処理する
      // ここではモノローグのみ（オーバーレイ演出は game-logic.js 側で実行済み）
      // plot_steinsgate.md §湊が気づく瞬間の設計 確定テキストに準拠
      { cmd: 'wait',  ms: 500 },
      { cmd: 'mono',  text: '——篠宮。', style: 'flashback', durationMs: 1800, force: true },
      { cmd: 'wait',  ms: 1200 },
      { cmd: 'mono',  text: 'カレンが好きそう、という名前。ゆきわりそう。既読のつかないメッセージ。', style: 'flashback', durationMs: 3400, force: true },
      { cmd: 'wait',  ms: 1600 },
      { cmd: 'mono',  text: '頭の中で、点と点が線になっていく。', style: 'flashback', durationMs: 2600, force: true },
      { cmd: 'wait',  ms: 1400 },
      { cmd: 'mono',  text: '線になった瞬間——吐き気がした。', style: 'flashback', durationMs: 2800, force: true },
      { cmd: 'wait',  ms: 2200 }
    ];
    processDirections(phase3Directions, () => {
      document.getElementById('protagBubble')?.classList.remove('flashback');
      if (callback) callback();
    });
  }
}
```

---

### 4-3. フラッシュバックの視覚仕様

```css
/* css/main.css に追加 */

/* Phase 2/3 フラッシュバック中のプロタグバブルスタイル */
.protagBubble.flashback {
  background: rgba(30, 0, 0, 0.97);
  border: 1px solid rgba(160, 40, 40, 0.8);
  color: #ffb0b0;
  box-shadow: 0 0 20px rgba(140, 20, 20, 0.5), inset 0 0 10px rgba(80, 0, 0, 0.3);
  font-style: italic;
  letter-spacing: 0.04em;
}

/* フラッシュバック中のデスクトップ全体のフィルター */
body.flashback-active .desktop {
  filter: saturate(0.4) brightness(0.85) sepia(0.15);
  transition: filter 0.5s ease;
}
body:not(.flashback-active) .desktop {
  transition: filter 0.8s ease;
}
```

```javascript
// triggerFlashback() 内でクラスの付与/除去
// processDirections 開始時:
document.body.classList.add('flashback-active');
// processDirections 完了後 (callback 前):
document.body.classList.remove('flashback-active');
```

---

## 5. 「既読無音」演出の実装案

### 5-1. 演出概要

「送れないメッセージ」演出は誠司ルートおよび花蓮ルートで使用する。
プレイヤーが何かを入力しようとしても「既読」状態になっており、送信できないという無力感を演出する。

主な使用箇所:
- **花蓮ルート**: `karen_zange_response`（花蓮が「知っていました。」と告げた後）
- **花蓮ルート**: `kidoku` エンドの `clientMessage` 表示後（既読のみで返信不可）
- **誠司ルート** (オプション): クライアント反応の最後のメッセージ後

---

### 5-2. HTML構造

```html
<!-- buzzutter_v2.html のチャットウィンドウ内、#chatChoices の下に追加 -->
<!-- 既読無音オーバーレイ（通常は非表示） -->
<div id="kidokuOverlay" class="kidoku-overlay" style="display:none;">
  <div class="kidoku-status">
    <span class="kidoku-checkmarks">✓✓</span>
    <span class="kidoku-label">既読</span>
  </div>
  <div class="kidoku-input-mock" aria-hidden="true">
    <span class="kidoku-cursor-blink">|</span>
  </div>
</div>
```

---

### 5-3. CSS実装

```css
/* css/main.css に追加 */

/* ===== KIDOKU (既読無音) OVERLAY ===== */
.kidoku-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--bg);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 10;
  /* 表示アニメーション */
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.kidoku-overlay.visible {
  opacity: 1;
  transform: translateY(0);
}

/* 既読チェックマーク */
.kidoku-status {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kidoku-checkmarks {
  font-size: 12px;
  color: var(--line-green);
  letter-spacing: -2px;
  opacity: 0;
  animation: kidokuCheckIn 0.3s ease 0.8s forwards;
}
.kidoku-label {
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  opacity: 0;
  animation: kidokuCheckIn 0.3s ease 1.1s forwards;
}

/* フェイク入力欄（入力できないことを示す） */
.kidoku-input-mock {
  flex: 1;
  margin-left: 12px;
  height: 32px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 16px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  opacity: 0.3;
}
.kidoku-cursor-blink {
  font-size: 14px;
  color: var(--text-dim);
  animation: blink 1.2s steps(2) infinite;
}

@keyframes kidokuCheckIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* チャット画面全体が「既読無音」状態のとき */
#chatMessages.kidoku-mode .msg-bubble.client:last-of-type {
  position: relative;
}
#chatMessages.kidoku-mode .msg-bubble.client:last-of-type::after {
  content: '既読';
  position: absolute;
  bottom: -18px;
  right: 0;
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  white-space: nowrap;
}

/* 「既読無音」中の入力欄フォーカス抑制 */
#chatChoices.silence-kidoku {
  pointer-events: none;
  user-select: none;
  opacity: 0.2;
  filter: blur(1px);
  transition: opacity 0.6s ease, filter 0.6s ease;
}
```

---

### 5-4. JavaScript実装

```javascript
// js/chat-engine.js または js/ui.js に追加

/**
 * 既読無音演出を開始する
 * @param {Object} options
 * @param {number} options.durationMs - 演出の持続時間（ミリ秒）。0 の場合は手動解除まで継続
 * @param {Function} options.onEnd - 演出終了後のコールバック
 * @param {boolean} options.withSound - 既読音を再生するか（デフォルト: true）
 */
function showKidokuEffect(options = {}) {
  const {
    durationMs = 5000,
    onEnd = null,
    withSound = true
  } = options;

  const overlay = document.getElementById('kidokuOverlay');
  const chatMsgs = document.getElementById('chatMessages');
  const chatChoices = document.getElementById('chatChoices');

  if (!overlay) return;

  // 既存のチャット選択肢を非表示
  if (chatChoices) {
    chatChoices.style.opacity = '0';
    chatChoices.style.pointerEvents = 'none';
    chatChoices.style.transition = 'opacity 0.4s ease';
  }

  // 最後のクライアントメッセージに既読クラスを付与
  if (chatMsgs) chatMsgs.classList.add('kidoku-mode');

  // オーバーレイ表示
  overlay.style.display = 'flex';
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });

  // 既読音
  if (withSound && typeof directionSfx === 'function') {
    setTimeout(() => {
      directionSfx({ cmd: 'sfx', sound: 'notification_read', volume: 0.4 });
    }, 900);
  }

  // 自動解除
  if (durationMs > 0) {
    setTimeout(() => {
      hideKidokuEffect();
      if (onEnd) onEnd();
    }, durationMs);
  }
}

/**
 * 既読無音演出を終了する
 */
function hideKidokuEffect() {
  const overlay = document.getElementById('kidokuOverlay');
  const chatMsgs = document.getElementById('chatMessages');
  const chatChoices = document.getElementById('chatChoices');

  if (overlay) {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 400);
  }

  if (chatMsgs) chatMsgs.classList.remove('kidoku-mode');

  if (chatChoices) {
    chatChoices.style.opacity = '';
    chatChoices.style.pointerEvents = '';
    chatChoices.style.transition = '';
  }
}

/**
 * 「送れないメッセージ」演出
 * プレイヤーが何かを言おうとするが送信できない状態を再現する
 * @param {string} ghostText - フェイク入力テキスト（タイプされてから消える）
 * @param {Function} onEnd - 演出終了後のコールバック
 */
function showUnsentMessage(ghostText, onEnd) {
  const inputMock = document.querySelector('.kidoku-input-mock');
  if (!inputMock) {
    if (onEnd) onEnd();
    return;
  }

  const cursor = inputMock.querySelector('.kidoku-cursor-blink');
  const textSpan = document.createElement('span');
  textSpan.style.cssText = 'font-size:13px; color: var(--text); opacity:0.5;';
  inputMock.insertBefore(textSpan, cursor);

  const chars = [...ghostText];
  let i = 0;

  // タイプアニメーション
  const typeInterval = setInterval(() => {
    textSpan.textContent += chars[i];
    i++;
    if (i >= chars.length) {
      clearInterval(typeInterval);
      // 2秒後に全選択して削除するアニメーション
      setTimeout(() => {
        textSpan.style.cssText += 'background: rgba(160,107,255,0.3); border-radius:2px;';
        setTimeout(() => {
          textSpan.textContent = '';
          textSpan.style.cssText = 'font-size:13px; color: var(--text); opacity:0.5;';
          setTimeout(() => {
            textSpan.remove();
            if (onEnd) onEnd();
          }, 300);
        }, 800);
      }, 2000);
    }
  }, 80);
}
```

---

### 5-5. 使用例: 花蓮ルート・告白後の既読無音

```javascript
// karen_zange_response の後、花蓮が8秒後に「だから、頼みました。」と言うまでの間に使用

// chat-engine.js の runChat() 内、karen_zange_response のステップ処理時（pause: 8000 の間）に:
function _handleKarenZangeResponse(idx) {
  // 既読無音演出開始
  showKidokuEffect({
    durationMs: 0, // 手動解除
    withSound: true,
  });

  // 3秒後にフェイク入力（送れないメッセージ）
  setTimeout(() => {
    showUnsentMessage('……あなたは、', () => {
      // さらに2秒後に2回目の未送信
      setTimeout(() => {
        showUnsentMessage('ごめん、', () => {
          // 既読演出を解除して次のメッセージへ
          hideKidokuEffect();
        });
      }, 1500);
    });
  }, 3000);
}
```

---

### 5-6. `kidoku` エンディング画面での既読無音

エンディング画面で `clientMessage`（「知っていました。」）が表示された後の返信不可演出。

```javascript
// game-logic.js の onChatEnd() 内、karen ルートの kidoku エンド処理後に追加

function showKidokuEndingSequence(lastChoiceCallback) {
  // 花蓮の最後のメッセージ後、8秒間の既読無音
  showKidokuEffect({
    durationMs: 8000,
    withSound: true,
    onEnd: () => {
      hideKidokuEffect();
      // 8秒経過後に最終選択肢を提示
      if (typeof lastChoiceCallback === 'function') lastChoiceCallback();
    }
  });

  // 4秒後にフェイク入力（言葉にならない主人公）
  setTimeout(() => {
    if (typeof showProtagMsg === 'function') {
      showProtagMsg('（…何を、言えばいい）', true, 3500, true);
    }
  }, 2000);
}

/**
 * 沈黙エンド直前: 「翻訳、ありがとうございました。」への収束演出
 * plot_steinsgate.md §5「沈黙エンド」確定テキストに準拠
 * 差出人不明のメッセージが届く前の、主人公の空白を演出する。
 */
function showChinmokuEndTranslationConverge(onComplete) {
  if (typeof processDirections !== 'function') {
    if (onComplete) onComplete();
    return;
  }

  const chinmokuDirections = [
    { cmd: 'bgm_change',   track: 'silence', fadeMs: 2000 },
    { cmd: 'wait',         ms: 2200 },
    // 湊が「何も言えなかった」という空白を示す
    { cmd: 'mono',         text: '言えなかった。', style: 'hollow', durationMs: 2200, force: true },
    { cmd: 'wait',         ms: 1800 },
    { cmd: 'mono',         text: '口を開けたまま、何も出てこなかった。', style: 'hollow', durationMs: 2600, force: true },
    { cmd: 'wait',         ms: 2000 },
    // 「翻訳、ありがとうございました。」が届く直前の空白
    { cmd: 'silence_input', durationMs: 3500, visual: 'kidoku' },
    { cmd: 'wait',         ms: 3000 },
    // 収束演出: 差出人不明のメッセージへの橋渡し
    { cmd: 'sfx',          sound: 'notification_read', volume: 0.3 },
    { cmd: 'wait',         ms: 1200 }
  ];

  processDirections(chinmokuDirections, () => {
    if (onComplete) onComplete();
  });
}
```

---

## 付録: `runChat()` への `processDirections` 統合方法

```javascript
// chat-engine.js の runChat() 関数を以下のように拡張する

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

// 既存の runChat() 内ロジックを _runChatNode() に切り出す
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
```

---

*以上が「バズったー」演出・実装担当エージェントによる `direction_script.md` の全内容。*  
*`chat-engine.js` への `processDirections()` 統合・`applyMysteryPhase()` の `handleCardClick()` への組み込み・CSSの `main.css` への追記によって、本設計書の演出を実際に動作させることができる。*
