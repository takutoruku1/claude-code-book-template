# MINATOルート ビジュアル仕様書

> バージョン: 1.0
> 担当: ビジュアル・デザイン担当エージェント
> 作成日: 2026-05-12
> 参照: `docs/UI設計書.md` v1.1 / `docs/visual_spec.md` v1.1

---

## 設計の前提

MINATOルートは4ルートクリアによって解放される「隠しルート」である。主人公・瀬川 湊が「依頼主のいない側」、つまりシステム（AI）として機能する逆転的な構造を持つ。以下の3点を設計の軸とする。

1. **「人間として存在していた湊」が「システムに置き換えられた」違和感** — 解放メッセージから始まり、ルート中のUIに一貫して流れるテーマ
2. **既存4ルートとの連続性** — デザイントークン（`--bg`, `--surface` 等）を継承しつつ、固有の冷たさを上乗せする
3. **ロック状態とのコントラスト** — 未解放時のカードが「謎めいた存在」として画面に居続けることで、4ルートクリア前からプレイヤーの関心を引く

---

## 1. 解放メッセージ演出

### 表示トリガー

花蓮ルート（4番目）のエンドロールが完了し、`showEndroll(goToTitle)` がタイトル遷移直前に発火する時点で割り込ませる。具体的にはエンドロール末尾のフェードアウト中（`#screen-endroll` の `opacity` が 0 に向かうタイミング）に `.minato-unlock-overlay` を `z-index: 10000` で挿入する。

**JSトリガーの想定:**

```javascript
// endroll完了コールバック内（showEndroll の goToTitle 実行直前）
if (isAllRoutesCleared()) {
  showMinatoUnlockOverlay(() => {
    goToTitle();
  });
}
```

---

### ビジュアル仕様

#### 背景

エンドロールの漆黒（`#080808` 相当）からシームレスに繋がるよう、背景はほぼ黒に近いダークネイビー基調とする。ただし既存の `--bg: #0d0d14`（宇宙のような深い紺）ではなく、より青みが抜けた純粋な黒に近い `#080810` を使用し、「これはゲームの外の画面だ」という質感差を出す。

```
背景色: #080810
前景グラデーション: 画面中央から放射状に、極めて弱いシアン光（rgba(0,200,255,0.04) — ほぼ見えない）
```

#### テキスト内容とレイアウト

全体を3フェーズに分けてタイムライン制御する。

**フェーズ A（0〜1.5秒）: システム起動**

```
[中央配置 / DotGothic16 / 9px / letter-spacing: 0.4em / color: #444455]

BUZZUTTER SYSTEM v4.1.0
ROUTE_MINATO — INITIALIZATION
```

フェーズAのテキストは `opacity: 0` → `0.6` のフェードインのみ。モーションは最小限。

**フェーズ B（1.5〜4.0秒）: AIメッセージ本体**

```
[中央配置 / DotGothic16 / 14px / letter-spacing: 0.12em / color: #c0c8e0]

湊 AI v2.3.1
診断を開始します。

> 依頼者: 存在しません
> スコア軸: 再定義中
> 感情ログ: 3年分 残存

再起動しますか？
```

各行はタイプライター式に1文字ずつ出現する（`typewriter` 関数を流用、速度: 28ms/文字）。`>` プレフィックス行はシステムログ感を強調するため `color: #6080a0` / `font-size: 12px` にダウンスケール。「再起動しますか？」の行は他行と間を1秒あけてから出現し、直後から点滅カーソル（`blink` アニメーション流用）を付ける。

**フェーズ C（4.0〜6.0秒）: 選択肢出現 → 解放確定**

```
[中央配置 / Noto Sans JP / 13px]

[ はい — MINATOルートを開始 ]
```

ボタンはひとつだけ。`Yes/No` を与えない。「断る」選択肢を持たせないことで、「システムに巻き込まれた」という体験を演出する。ボタンクリック後、`opacity: 1 → 0` の0.8秒フェードアウトでオーバーレイを消去し、`goToTitle()` を実行する（タイトル画面のキャラ選択でMINATOカードが解放済み状態になっている）。

---

### CSSクラス案

```css
/* ====================================================
   MINATOルート解放オーバーレイ
   エンドロール完了後、タイトル遷移前に差し込まれる
   ==================================================== */

.minato-unlock-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #080810;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  opacity: 0;
  animation: minato-overlay-fadein 0.6s ease 0.2s forwards;
}

@keyframes minato-overlay-fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* システムヘッダー（フェーズA） */
.minato-unlock-overlay .muo-sys-header {
  font-family: 'DotGothic16', monospace;
  font-size: 9px;
  letter-spacing: 0.4em;
  color: #444455;
  text-align: center;
  margin-bottom: 48px;
  opacity: 0;
  animation: minato-line-in 0.4s ease 0.4s forwards;
}

/* メインテキストブロック（フェーズB） */
.minato-unlock-overlay .muo-main-text {
  font-family: 'DotGothic16', monospace;
  font-size: 14px;
  letter-spacing: 0.12em;
  color: #c0c8e0;
  text-align: left;
  line-height: 2.4;
  min-width: 280px;
  max-width: 400px;
  margin-bottom: 40px;
}

/* システムログ行（> プレフィックス） */
.minato-unlock-overlay .muo-log-line {
  font-size: 12px;
  color: #6080a0;
  display: block;
}

/* 「再起動しますか？」行 — 目立たせる */
.minato-unlock-overlay .muo-restart-prompt {
  display: block;
  margin-top: 16px;
  color: #e0e8ff;
  letter-spacing: 0.18em;
}

/* 点滅カーソル（blink 流用） */
.minato-unlock-overlay .muo-cursor {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background: #e0e8ff;
  vertical-align: middle;
  margin-left: 3px;
  animation: blink 0.9s step-end infinite; /* 既存 blink を流用 */
}

/* 「はい」ボタン（フェーズC） */
.minato-unlock-overlay .muo-confirm-btn {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 13px;
  color: #c0c8e0;
  background: transparent;
  border: 1px solid rgba(192, 200, 224, 0.35);
  border-radius: 4px; /* 意図的に角丸を小さくする: 他UIの 8px から外す */
  padding: 10px 32px;
  letter-spacing: 0.2em;
  cursor: pointer;
  opacity: 0;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  animation: minato-btn-in 0.5s ease 4.2s forwards;
}

.minato-unlock-overlay .muo-confirm-btn:hover {
  background: rgba(192, 200, 224, 0.08);
  border-color: rgba(192, 200, 224, 0.70);
  color: #ffffff;
}

@keyframes minato-line-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes minato-btn-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* フェードアウト（クリック後にJSでクラス付与） */
.minato-unlock-overlay.dismissing {
  animation: minato-overlay-fadeout 0.8s ease forwards;
}

@keyframes minato-overlay-fadeout {
  from { opacity: 1; }
  to   { opacity: 0; }
}

/* prefers-reduced-motion 対応 */
@media (prefers-reduced-motion: reduce) {
  .minato-unlock-overlay,
  .minato-unlock-overlay .muo-sys-header,
  .minato-unlock-overlay .muo-confirm-btn {
    animation: none;
    opacity: 1;
  }
  .minato-unlock-overlay.dismissing {
    animation: none;
    opacity: 0;
  }
}
```

---

## 2. MINATOキャラカード

### 他4キャラとの差別化方針

既存4キャラのカードは「人物のプロフィールカード」として機能する（名前・一言・テーマカラー）。MINATOカードはこれを「システムエントリー」として設計し、以下の3点で差別化する。

| 項目 | 既存4キャラ | MINATO |
|------|------------|--------|
| アバター表示 | 絵文字（🌿🌙☕🌸） | ターミナル風アスキー表現（後述） |
| テーマカラー | 暖色〜有彩色 | `#8090b0`（冷たいグレーシアン） |
| カード名称 | 「田中 みどり」等の人名 | `MINATO AI v2.3.1` |
| タグ表記 | 「自立系」「静かな夜」等 | `SYSTEM` / `HIDDEN` |

---

### ロック状態（未解放時）のデザイン

4ルートクリア前は常に表示されているが、選択不可能な「存在感のある謎」として機能させる。プレイヤーが「これは何？」と思わせることが目的。

```css
/* ====================================================
   MINATOカード — ロック状態
   .char-card.minato-card.locked
   ==================================================== */

.char-card.minato-card.locked {
  background: #0a0a12; /* 他カードより暗い */
  border: 1px solid rgba(128, 144, 176, 0.18);
  border-radius: 6px; /* 既存 .char-card 準拠 */
  opacity: 1; /* フルopacityで「意図的に存在している」感を出す */
  cursor: not-allowed;
  pointer-events: none; /* 選択不可 */
  position: relative;
  overflow: hidden;
  box-shadow: none;
}

/* 全体に走査線ノイズ（軽い） */
.char-card.minato-card.locked::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0, 0, 0, 0.15) 3px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* 中央に錠前アイコン代わりのテキスト表示 */
.char-card.minato-card.locked .minato-card-lock-label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  z-index: 2;
}

/* 「???.???.???」表示（DotGothic16 / 12px / 点滅） */
.char-card.minato-card.locked .minato-lock-glyph {
  font-family: 'DotGothic16', monospace;
  font-size: 12px;
  color: rgba(128, 144, 176, 0.45);
  letter-spacing: 0.25em;
  animation: minato-lock-blink 3.2s ease-in-out infinite;
}

@keyframes minato-lock-blink {
  0%, 85%, 100% { opacity: 0.45; }
  90%, 95%      { opacity: 0.15; }
}

/* 「4ルートクリアで解放」ヒント（極小） */
.char-card.minato-card.locked .minato-lock-hint {
  font-size: 9px;
  color: rgba(128, 144, 176, 0.30);
  letter-spacing: 0.1em;
}
```

**ロックカードのHTML構造（参考）:**

```html
<div class="char-card minato-card locked">
  <!-- 走査線オーバーレイ（::before 疑似要素） -->
  <div class="minato-card-lock-label">
    <span class="minato-lock-glyph">???.???.???</span>
    <span class="minato-lock-hint">LOCKED</span>
  </div>
</div>
```

---

### 解放後のデザイン

解放後はアニメーション付きで変容する。ロック状態の「暗くて静止した画面」が「動き出す」ことで解放感を演出する。

```css
/* ====================================================
   MINATOカード — 解放状態
   .char-card.minato-card.unlocked
   ==================================================== */

.char-card.minato-card.unlocked {
  background: linear-gradient(135deg, #0c0e18, #0a1020);
  border: 1px solid rgba(128, 144, 176, 0.40);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  animation: minato-card-boot 0.8s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
}

@keyframes minato-card-boot {
  0%   { opacity: 0; transform: scale(0.94); filter: brightness(0.4); }
  40%  { opacity: 0.8; filter: brightness(1.2); }
  70%  { filter: brightness(0.9); }
  100% { opacity: 1; transform: scale(1.0); filter: none; }
}

/* ホバー時 */
.char-card.minato-card.unlocked:hover {
  border-color: rgba(128, 144, 176, 0.75);
  box-shadow:
    0 0 12px rgba(128, 144, 176, 0.15),
    0 0  4px rgba(128, 144, 176, 0.25) inset;
  transform: translateY(-2px); /* 既存 .char-card:hover と同じ量 */
}

/* 上部の微細なグラデーションライン（システム感） */
.char-card.minato-card.unlocked::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(128, 144, 176, 0.60) 40%,
    rgba(192, 208, 255, 0.80) 60%,
    transparent
  );
  animation: minato-card-line-slide 6s ease-in-out infinite;
}

@keyframes minato-card-line-slide {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 0.25; }
}
```

---

### アバター表示

既存4キャラの絵文字アバター（🌿🌙☕🌸）に対し、MINATOのアバターは「プログラムが表示するシンボル」として以下の仕様で実装する。

**ターミナル風アバター（テキスト描画）:**

```
┌──┐
│AI│
└──┘
```

フォント: `DotGothic16` / `font-size: 18px` / `color: #8090b0` / `letter-spacing: 0` / `line-height: 1.3`

実装上は `<span>` 要素にテキストとして入れる（絵文字と同様の方法）。SVGは使わない。

```css
/* MINATOアバター（解放後） */
.minato-card-avatar {
  font-family: 'DotGothic16', monospace;
  font-size: 18px;
  color: #8090b0;
  line-height: 1.3;
  letter-spacing: -0.02em;
  display: block;
  text-align: center;
  animation: minato-avatar-flicker 8s step-end infinite;
}

@keyframes minato-avatar-flicker {
  0%, 91%, 100% { opacity: 1; }
  92%            { opacity: 0.4; }
  93%            { opacity: 1; }
  96%            { opacity: 0.2; }
  97%            { opacity: 1; }
}
```

**カード名称エリア:**

```
MINATO AI v2.3.1
──────────────
[SYSTEM]  [HIDDEN]
```

名前は `'DotGothic16'` / `12px` / `color: #c0c8e0` / `letter-spacing: 0.08em`。
区切り線は `color: rgba(128,144,176,0.35)` の `────` テキスト。
タグは既存の `.char-card-tag` スタイルを継承しつつ、カラーのみ上書き:

```css
.minato-card .char-card-tag.system-tag {
  background: rgba(128, 144, 176, 0.10);
  border: 1px solid rgba(128, 144, 176, 0.28);
  color: #8090b0;
}

.minato-card .char-card-tag.hidden-tag {
  background: rgba(80, 60, 120, 0.12);
  border: 1px solid rgba(80, 60, 120, 0.30);
  color: rgba(160, 140, 220, 0.80);
}
```

---

## 3. ルート内チャット画面

### 設計の核

依頼主が存在しないため「誰かと会話する」チャットパネルの文脈が根底から変わる。湊 AI はシステムとして動作しており、プレイヤーは「依頼主の椅子に座っている」立場になる。この逆転を以下の方法でビジュアルに表現する。

- **「client」側のバブルが湊 AI（システムログ形式）に変わる** — 送信者は湊だが、それは人間ではなくAIである
- **「self」側のバブルがプレイヤー（依頼主）になる** — 普段は依頼主の椅子に座っていたプレイヤーが、今度は依頼主として選択する
- **背景・トーンを冷たい機械的な色調へシフト** — ルートテーマカラーの一貫した適用

---

### ルートテーマ変数（body[data-route="minato"]）

```css
/* ====================================================
   MINATOルート テーマ変数
   body[data-route="minato"] に適用
   ==================================================== */
body[data-route="minato"] {
  --route-accent:       #8090b0;   /* グレーシアン（テーマカラー） */
  --route-accent2:      #6070a0;   /* ダークシアンブルー */
  --route-bg-tint:      rgba(64, 80, 128, 0.05); /* ほぼ無色のブルーオーバーレイ */
  --route-chat-bg:      #0c101a;   /* 深いナイトブルー（他ルートより暗い） */
  --route-chat-border:  rgba(128, 144, 176, 0.20);
  --route-avatar-grad:  linear-gradient(135deg, #0c1020, #080c18);
  --route-avatar-border: #8090b0;
  --route-shadow:       rgba(64, 80, 128, 0.10);

  /* ミステリーグリッチは常にオフ（MINATOルートは「既に答えが出ている」） */
  --mystery-glitch-opacity: 0;

  /* クラックカラー（システムブルー） */
  --mystery-crack-color-subtle:  rgba(128, 144, 176, 0.20);
  --mystery-crack-color-mid:     rgba(128, 144, 176, 0.35);
  --mystery-crack-color-glow:    rgba(128, 144, 176, 0.10);
  --mystery-crack-color-line:    rgba(128, 144, 176, 0.70);
  --mystery-crack-color-inset:   rgba(128, 144, 176, 0.08);
  --mystery-crack-color-reduced: rgba(128, 144, 176, 0.04);
}

/* デスクトップ背景オーバーレイ（最小限の青み） */
body[data-route="minato"] .desktop::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(64, 80, 128, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse at 20% 80%, rgba(0, 40, 80, 0.08) 0%, transparent 45%);
  pointer-events: none;
  z-index: 0;
}
```

---

### チャットパネルヘッダー

通常は依頼主のアバター・名前・オンライン状態が表示される `.chat-panel-header` を以下のように読み替える。

| 項目 | 通常ルート | MINATOルート |
|------|-----------|-------------|
| アバター | 依頼主絵文字 | `[AI]` アスキー表示（MINATOカードと同仕様） |
| 名前 | 「田中 みどり」等 | `MINATO AI v2.3.1` |
| オンライン状態 | 「オンライン」 | `ONLINE — SYSTEM ACTIVE` |
| ステータス色 | `--line-green: #06c755` | `#8090b0` |

```css
/* MINATOルートのヘッダーステータス色上書き */
body[data-route="minato"] .chat-header-status {
  color: #8090b0;
  letter-spacing: 0.12em;
  font-size: 9px;
}

/* アバターボーダー色（ルートテーマカラーで流用） */
body[data-route="minato"] .chat-avatar {
  border-color: var(--route-avatar-border); /* #8090b0 */
  background: var(--route-avatar-grad);
  font-family: 'DotGothic16', monospace;
  font-size: 10px;
  color: #8090b0;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

### 送信者表示（AIメッセージ vs プレイヤー）

#### 湊AIからのメッセージ（旧「依頼主」側 / `.msg-bubble.client`）

システムログ形式とし、通常の会話バブルとは明確に異なる質感にする。

```css
/* ====================================================
   MINATOルート — AIシステムログバブル
   body[data-route="minato"] .msg-bubble.client
   ==================================================== */
body[data-route="minato"] .msg-bubble.client {
  background: #0a0e18;  /* 既存 --chat-other より暗い */
  border: 1px solid rgba(128, 144, 176, 0.25);
  border-left: 2px solid rgba(128, 144, 176, 0.55); /* ログ行の左ライン */
  border-top-left-radius: 2px; /* 通常は 4px — さらに角を立てる */
  border-top-right-radius: 16px;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  font-family: 'DotGothic16', monospace;
  font-size: 12px;
  color: #b0bcd4;
  line-height: 1.8;
  padding: 8px 14px 8px 12px;
  position: relative;
}

/* システムログ行の > プレフィックス装飾（::before 疑似要素） */
body[data-route="minato"] .msg-bubble.client::before {
  content: '> ';
  color: rgba(128, 144, 176, 0.50);
  font-family: 'DotGothic16', monospace;
}

/* タイムスタンプ / 送信者名 */
body[data-route="minato"] .msg-row:not(.self) .msg-sender-name {
  font-family: 'DotGothic16', monospace;
  font-size: 9px;
  color: rgba(128, 144, 176, 0.55);
  letter-spacing: 0.15em;
}
```

**送信者名の表示テキスト:** `MINATO_AI` （通常の「湊」ではなくシステム識別子）

#### プレイヤー（依頼主）からのメッセージ（`.msg-bubble.self`）

プレイヤーが今回は「依頼主の椅子」に座っている。バブルの色を既存の `--chat-self: #2a1f4a` のまま維持しつつ、ボーダーをルートテーマカラーで微調整することで「依頼主として機能している」ことを示す。

```css
body[data-route="minato"] .msg-bubble.self {
  background: var(--chat-self); /* #2a1f4a — 既存そのまま */
  border-color: rgba(128, 144, 176, 0.25); /* 通常は accent2 系 → ルートカラーに */
}
```

---

### 背景色・トーン

チャットパネル（`.chat-messages`）の背景は既存の `--bg: #0d0d14` から `--route-chat-bg: #0c101a` へ変化する。既存変数の上書きではなく `background` プロパティの直接指定で適用する。

```css
body[data-route="minato"] .chat-panel,
body[data-route="minato"] .chat-messages {
  background: var(--route-chat-bg); /* #0c101a */
}
```

---

### フォントスタイルの変化

AIからのメッセージに `DotGothic16` を適用することで、他ルートの「人間らしい丸みのある Noto Sans JP」との質感差を出す。プレイヤー側（`.msg-bubble.self`）のフォントは通常通り `Noto Sans JP` を維持し、「AIと人間」という対比を視覚的に強調する。

| 送信者 | フォント | サイズ | カラー | 備考 |
|--------|---------|--------|--------|------|
| 湊 AI (client) | `DotGothic16` | `12px` | `#b0bcd4` | ログ行形式 |
| プレイヤー (self) | `Noto Sans JP` | `13px` | `#e8e8f0` | 通常通り |
| システムメッセージ (.sys-msg) | `DotGothic16` | `10px` | `#8090b0` | 既存 `--accent3` の色を置換 |

---

### システムメッセージ（`.sys-msg`）の変化

通常は「──── チャットを開始しました ────」等の緑テキスト（`--accent3: #00d4aa`）が表示される `.sys-msg` を、MINATOルートでは以下に変更する。

```css
body[data-route="minato"] .sys-msg {
  font-family: 'DotGothic16', monospace;
  color: #8090b0; /* --accent3 の緑から置換 */
  font-size: 10px;
  letter-spacing: 0.15em;
}
```

システムメッセージのテキスト例（JS側のコンテンツ変更を想定）:

- 通常: `──── セッション開始 ROUTE_MINATO ────`
- 素材カードフリップ後: `> MEMORY_FRAGMENT loaded`
- 投稿フェーズ移行: `> GENERATING_POST — please wait`

---

### ステップバーの変化

通常は `チャット → 素材確認 → 投稿 → 反響` の4ステップ。MINATOルートでは依頼主がいないため文言を変更する（CSS上はクラス構成を変えず、テキストコンテンツのみ差し替える）。

| 通常 | MINATO |
|------|--------|
| チャット | DIALOGUE |
| 素材確認 | MEMORY |
| 投稿 | OUTPUT |
| 反響 | RESULT |

ステップバーの `.step-item.active` カラーは通常 `--accent: #ff6b9d` だが、MINATOルートでは `--route-accent: #8090b0` を流用する。

```css
body[data-route="minato"] .step-item.active {
  color: var(--route-accent); /* #8090b0 */
  background: rgba(128, 144, 176, 0.10);
}

body[data-route="minato"] .step-item.done {
  color: rgba(128, 144, 176, 0.60);
}
```

---

### 選択肢ボタン（`.choice-btn`）の変化

MINATOルートの選択肢は「依頼主として何を要求するか」という立場なので、ホバー時の `accent2` をルートカラーに差し替える。

```css
body[data-route="minato"] .choice-btn:hover {
  border-color: var(--route-accent2); /* #6070a0 */
  background: rgba(96, 112, 160, 0.10);
}
```

---

## 4. 既存UI設計書との整合確認

| 仕様項目 | 本仕様書での対応 | 整合状況 |
|---------|----------------|---------|
| 基盤カラー（`--bg`, `--surface` 等） | 上書きせず、`--route-*` 変数として追加 | 整合 |
| `DotGothic16` フォント | AIメッセージに積極使用（既存はスコア・タイトルのみ） | 拡張 |
| `blink` アニメーション | 解放オーバーレイのカーソルで流用 | 整合 |
| `.char-card:hover` の `translateY(-2px)` | MINATOカード解放後ホバーでも同値を使用 | 整合 |
| `prefers-reduced-motion` | 解放オーバーレイに対応節を追加 | 整合 |
| ルート別 `body[data-route="*"]` 制御 | `visual_spec.md` §1-3 の方式を踏襲 | 整合 |
| `.mystery-glitch-opacity: 0` 強制 | MINATOルートはグリッチ不使用（答えが出ているから） | 整合 |
| エンディング背景差別化 | MINATO固有エンドは本仕様書では未定義（シナリオ担当と要調整） | 要確認 |

---

## 5. 実装上の注意点

1. **解放フラグの管理**: `localStorage` に `minato_unlocked: true` を保存し、タイトル再訪時にもMINATOカードが解放済み状態を維持すること。`#screen-charselect` 初期化時に確認する。

2. **`DotGothic16` の使用**: 既存ではスコア数値・タイトルロゴ専用だったが、MINATOルートのAIバブルにも使用する。フォントロードは既存の `@import url(...)` で既に行われているため追加読み込みは不要。

3. **`.msg-bubble.client::before` の `content: '> '`**: `::before` 疑似要素を使うため、既存実装で `.msg-bubble.client` に `::before` を使用していないか確認すること。競合する場合はJSで要素を直接追加する方式に切り替える。

4. **ステップバーのテキスト差し替え**: ステップ名は通常JSで動的に設定されている前提。`data-route="minato"` が設定された時点で `buildStepBar()` 等の初期化処理がMINATO用テキストを注入するよう実装する（CSSのみでは対応不可）。

5. **チャットアバターの `[AI]` 表示**: 他のキャラは絵文字1文字で収まるが、MINATOは複数文字のアスキーアートになる。`width: 36px / height: 36px` の円形アバター内に収めるため `font-size: 10px` と `letter-spacing: -0.02em` で対応する。はみ出す場合は `overflow: hidden` で切り抜く。

---

*本仕様書は `docs/UI設計書.md` v1.1 および `docs/visual_spec.md` v1.1 を基準とし、MINATOルート固有のビジュアル拡張仕様として位置づける。実装時は `css/main.css` の `/* === MINATO ROUTE === */` セクションに追記すること。*
