# バズったー ビジュアル仕様書 (visual_spec.md)

> バージョン: 1.1  
> 担当: ビジュアル・デザイン担当エージェント  
> 作成日: 2026-05-11  
> 更新日: 2026-05-11（Phase 3 レビュー指摘反映）  
> 参照: `docs/UI設計書.md` v1.1 との整合確認済み

---

## 実装上の最重要注意事項

### A. ミステリーフェーズ制御方式の統一

**本仕様書は `body[data-mystery="N"]` データ属性セレクタでミステリーフェーズを制御する。**

`direction_script.md` 側の `applyMysteryPhase()` が `body.classList` でクラスを付与する実装になっている場合は、以下のいずれかに統一すること:

- **推奨**: `applyMysteryPhase()` を修正し、クラスと data 属性の両方を設定する:
  ```javascript
  // applyMysteryPhase() 内で両方を設定する
  document.body.classList.remove('mystery-0', 'mystery-1', 'mystery-2', 'mystery-3');
  document.body.classList.add(`mystery-${phase}`);
  document.body.dataset.mystery = String(phase); // 本仕様書のCSSセレクタ用
  ```
- または: 本仕様書の CSS セレクタを `body.mystery-N ...` に統一変更する

**本仕様書のCSS (`body[data-mystery="N"]`) は、`document.body.dataset.mystery` が正しく設定されていることを前提とする。**

### B. `.karen-climax` の付与手段

`direction_script.md` の `executeDirectionCmd()` に以下の命令が追加されていることを前提とする:

```javascript
// add_class 命令の実装（direction_script.md 側に追加が必要）
case 'add_class': {
  const el = document.querySelector(d.target);
  if (el) el.classList.add(d.class);
  break;
}
case 'remove_class': {
  const el = document.querySelector(d.target);
  if (el) el.classList.remove(d.class);
  break;
}
```

`.karen-climax` は以下の演出命令から呼ばれる:

```javascript
// direction_script.md の karen_mystery_choice シーケンス内
{ type: 'add_class', target: '.reaction-area', class: 'karen-climax' }
// 収束時:
{ type: 'remove_class', target: '.reaction-area', class: 'karen-climax' }
{ type: 'add_class',    target: '.reaction-area', class: 'karen-resolve' }
```

---

## 目次

1. [カラーパレット完全仕様](#1-カラーパレット完全仕様)
2. [UIグリッチ・歪みエフェクト仕様](#2-uiグリッチ歪みエフェクト仕様)
3. [キャラクターアバター変化仕様](#3-キャラクターアバター変化仕様)
4. [花蓮ルートのクライマックスビジュアル](#4-花蓮ルートのクライマックスビジュアル)
5. [SNS風UIを「違和感ツール」として使う設計](#5-sns風uiを違和感ツールとして使う設計)
6. [フラッシュバック演出レイヤー仕様](#6-フラッシュバック演出レイヤー仕様)
7. [既存UI設計書との整合確認・差分](#7-既存ui設計書との整合確認差分)

> **v1.2 更新内容（Phase 3 レビュー指摘反映）:**
> - §A: `.karen-climax` 付与手段・タイミング・JS命令を明記（演出視点 問題3）
> - §1-2: `--flashback-danger: #8b2020` を `:root` に追加（plot指摘）
> - §1-3: 朔ルートに hue-rotate 最終表示の補足コメントを追加（plot指摘）
> - §5-4: `@hanaren_log` リプライの「目立たない」CSS仕様を新規追加（世界観視点 推奨④）
> - §6: フラッシュバック演出レイヤー仕様（2枚並列重ねレイヤー）を新規追加（世界観視点 問題②・演出視点 問題3）

---

## 1. カラーパレット完全仕様

### 1-1. 設計方針

ゲームの進行（ルート・ミステリーフェーズ）に応じて `body` の `data-route` 属性と `data-mystery` 属性を切り替え、CSS custom properties を段階的に上書きする。ベーストークンは既存の `:root` 定義（`--bg: #0d0d14` 等）を継承し、ルート固有変数のみを override する。

### 1-2. ベーストークン（既存 :root との対応）

既存 `UI設計書.md` §2-1 で定義されたトークンを参照ベースとする。以下の変数は本仕様書で**追加・拡張**するものであり、既存変数を削除・上書きしない。

```css
/* ルート共通拡張変数（:root に追加） */
:root {
  /* ルートテーマ（デフォルト値はベースダーク） */
  --route-accent:    #ff6b9d;   /* ルート固有アクセント（デフォルト: 既存 --accent） */
  --route-accent2:   #7c6af7;   /* ルート固有サブアクセント（デフォルト: 既存 --accent2） */
  --route-bg-tint:   rgba(0, 0, 0, 0);  /* デスクトップ背景への色調オーバーレイ */
  --route-chat-bg:   #1e2a1e;   /* クライアントバブル背景（既存 --chat-other） */
  --route-chat-border: rgba(6, 199, 85, 0.15); /* バブルボーダー */
  --route-avatar-grad: linear-gradient(135deg, #2a4a2a, #1a3a1a); /* アバター背景 */
  --route-avatar-border: #06c755; /* アバターボーダー（既存 --line-green） */
  --route-shadow:    rgba(0, 0, 0, 0.6); /* ウィンドウシャドウ */

  /* ミステリーフェーズ変数 */
  --mystery-noise:   0;    /* CSS filter noise 強度（0〜1の論理値、実装はJSで補完） */
  --mystery-hue:     0deg; /* hue-rotate 量 */
  --mystery-contrast: 1;   /* contrast() 倍率 */
  --mystery-glitch-opacity: 0; /* グリッチオーバーレイ透明度 */

  /*
   * ミステリークラックカラー（ルートごとに上書き）
   * デフォルトは花蓮ルート用のダークローズだが、各ルートで上書きして
   * 「花蓮色が他ルートに漏れる」問題を防ぐ。
   * ※ CSS の rgba() は現状 custom property を channel 分離できないため、
   *    ルート別のオーバーライドで直接 rgba 値を指定する方式を採用。
   */
  --mystery-crack-color-subtle:  rgba(200, 120, 144, 0.35); /* フェーズ2以降の枠色（花蓮デフォルト） */
  --mystery-crack-color-mid:     rgba(200, 120, 144, 0.55); /* フェーズ3の枠色 */
  --mystery-crack-color-glow:    rgba(200, 120, 144, 0.15); /* フェーズ3のシャドウ */
  --mystery-crack-color-line:    rgba(200, 120, 144, 0.90); /* タイトルバー「傷」の最大輝度 */
  --mystery-crack-color-inset:   rgba(200, 120, 144, 0.15); /* フェーズ3 inset シャドウ */
  --mystery-crack-color-reduced: rgba(200, 120, 144, 0.06); /* reduced-motion 代替カラー */

  /* 朔ルート専用フラッシュバック危険色 */
  --flashback-danger: #8b2020; /* 暗赤色 — 朔ルートの「暗赤色フラッシュバック」専用 */
}
```

### 1-3. ルート別 CSS custom properties

```css
/* ================================================
   みどりルート（田中みどり / midori）
   テーマ: 植物・明るい・温かい・春の朝
   ================================================ */
body[data-route="midori"] {
  --route-accent:      #4caf80;   /* 緑系アクセント（自己スコアに近いトーン） */
  --route-accent2:     #7eb8f7;   /* 空色サブアクセント */
  --route-bg-tint:     rgba(76, 175, 128, 0.06); /* 薄いグリーンオーバーレイ */
  --route-chat-bg:     #1a2e1e;   /* やや緑みを強めたチャット背景 */
  --route-chat-border: rgba(76, 175, 128, 0.22);
  --route-avatar-grad: linear-gradient(135deg, #2a5a2a, #1a4a20);
  --route-avatar-border: #4caf80;
  --route-shadow:      rgba(76, 175, 128, 0.12);

  /*
   * みどりルートは「安心ゾーン」として機能する（伏線密度 0〜10%）。
   * グリッチ透明度を 0 に強制し、花蓮色が漏れないようにする。
   * ミステリーフェーズが更新されても視覚変化は最小限に抑える。
   */
  --mystery-glitch-opacity: 0;

  /* みどりルートの「翻訳・安心」を表す緑系クラックカラー */
  --mystery-crack-color-subtle:  rgba(76, 175, 128, 0.20);
  --mystery-crack-color-mid:     rgba(76, 175, 128, 0.35);
  --mystery-crack-color-glow:    rgba(76, 175, 128, 0.10);
  --mystery-crack-color-line:    rgba(76, 175, 128, 0.70);
  --mystery-crack-color-inset:   rgba(76, 175, 128, 0.10);
  --mystery-crack-color-reduced: rgba(76, 175, 128, 0.04);
}

/* デスクトップ背景オーバーレイ（::before 疑似要素で重ねる） */
body[data-route="midori"] .desktop::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 80%, rgba(76, 175, 128, 0.10) 0%, transparent 55%),
    radial-gradient(ellipse at 70% 20%, rgba(126, 184, 247, 0.07) 0%, transparent 40%);
  pointer-events: none;
  z-index: 0;
}

/* ================================================
   朔ルート（倉田朔 / saku）
   テーマ: 工場・鋼・静寂・深夜シフト
   ================================================ */
body[data-route="saku"] {
  --route-accent:      #6aa0c8;   /* スチールブルー */
  --route-accent2:     #8899aa;   /* メタリックグレー */
  --route-bg-tint:     rgba(106, 160, 200, 0.05);
  --route-chat-bg:     #181e26;   /* 冷たい青みグレー */
  --route-chat-border: rgba(106, 160, 200, 0.18);
  --route-avatar-grad: linear-gradient(135deg, #1a2a3a, #0e1a28);
  --route-avatar-border: #6aa0c8;
  --route-shadow:      rgba(106, 160, 200, 0.10);

  /*
   * 朔ルートの不安は「工場・寒色・低温の孤独」。
   * グリッチカラーをスチールブルー系に設定し、花蓮色が漏れないようにする。
   * hue-rotate は寒色方向（デフォルトの暖色化とは逆）に振る。
   * ※ hue-rotate の実際の方向は body[data-mystery] セレクタ側で -N deg に上書きすること。
   */
  --mystery-crack-color-subtle:  rgba(106, 160, 200, 0.25);
  --mystery-crack-color-mid:     rgba(106, 160, 200, 0.45);
  --mystery-crack-color-glow:    rgba(106, 160, 200, 0.12);
  --mystery-crack-color-line:    rgba(106, 160, 200, 0.80);
  --mystery-crack-color-inset:   rgba(106, 160, 200, 0.12);
  --mystery-crack-color-reduced: rgba(106, 160, 200, 0.05);

  /*
   * 暗赤色フラッシュバック（--flashback-danger）の朔ルートでの最終表示:
   * body[data-route="saku"][data-mystery="1"] では hue-rotate(4deg) が適用されるため、
   * --flashback-danger: #8b2020 (R:139, G:32, B:32) に +4deg の色相回転が重なる。
   * 結果: わずかに橙みを帯びた暗赤 (#8d2218 相当) — 血錆びた工場壁のイメージ。
   * Phase 2 (hue-rotate 10deg): #8f1c10 相当 — より鮮烈な赤みに。
   * Phase 3 (hue-rotate 20deg): #901408 相当 — 強い警告赤に近づく。
   */
}

body[data-route="saku"] .desktop::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 80% 90%, rgba(106, 160, 200, 0.09) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 30%, rgba(136, 153, 170, 0.06) 0%, transparent 40%);
  pointer-events: none;
  z-index: 0;
}

/* ================================================
   誠司ルート（松本誠司 / seiji）
   テーマ: 喫茶・セピア・昭和レトロ・不安・黄昏
   ================================================ */
body[data-route="seiji"] {
  --route-accent:      #c8a878;   /* セピアゴールド */
  --route-accent2:     #886655;   /* テラコッタブラウン */
  --route-bg-tint:     rgba(200, 168, 120, 0.06);
  --route-chat-bg:     #221a12;   /* 濃いセピア */
  --route-chat-border: rgba(200, 168, 120, 0.20);
  --route-avatar-grad: linear-gradient(135deg, #3a2a1a, #28180a);
  --route-avatar-border: #c8a878;
  --route-shadow:      rgba(200, 168, 120, 0.12);

  /* 誠司ルートの不安は「黄昏・居場所の喪失・古い電球のちらつき」。
     グリッチカラーはセピアゴールド系に設定する。 */
  --mystery-crack-color-subtle:  rgba(200, 168, 120, 0.28);
  --mystery-crack-color-mid:     rgba(200, 168, 120, 0.48);
  --mystery-crack-color-glow:    rgba(200, 168, 120, 0.12);
  --mystery-crack-color-line:    rgba(200, 168, 120, 0.85);
  --mystery-crack-color-inset:   rgba(200, 168, 120, 0.12);
  --mystery-crack-color-reduced: rgba(200, 168, 120, 0.05);
}

body[data-route="seiji"] .desktop::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 100%, rgba(200, 168, 120, 0.11) 0%, transparent 55%),
    radial-gradient(ellipse at 15% 40%,  rgba(136, 102,  85, 0.07) 0%, transparent 40%);
  pointer-events: none;
  z-index: 0;
}

/* ================================================
   花蓮ルート（篠宮花蓮 / karen）
   テーマ: 花道・謎・暗闇・刺さるような美しさ・贖罪
   ================================================ */
body[data-route="karen"] {
  --route-accent:      #c87890;   /* ダークローズ */
  --route-accent2:     #7a4a6a;   /* ダークモーブ */
  --route-bg-tint:     rgba(200, 120, 144, 0.07);
  --route-chat-bg:     #200e18;   /* 深い紫がかったダーク */
  --route-chat-border: rgba(200, 120, 144, 0.20);
  --route-avatar-grad: linear-gradient(135deg, #2a0e1e, #180a14);
  --route-avatar-border: #c87890;
  --route-shadow:      rgba(200, 120, 144, 0.15);

  /*
   * 花蓮ルートのみ、クラックカラーをダークローズ（デフォルト値）のまま使用する。
   * 他ルートが各自の色で上書きすることで「花蓮色が他ルートに漏れる問題」を解消し、
   * 花蓮ルートでのみダークローズが現れることで「この色が全伏線の答えだった」
   * という視覚的回収を実現する。
   */
  /* --mystery-crack-color-* はデフォルト値（ダークローズ）を継承 */
}

body[data-route="karen"] .desktop::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 60% 90%, rgba(200, 120, 144, 0.12) 0%, transparent 55%),
    radial-gradient(ellipse at 30% 20%, rgba(42, 18, 42, 0.30) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

### 1-4. ミステリーフェーズ（0〜3）の段階的変化

`GS.mysteryClues.length` に応じて `body[data-mystery="0〜3"]` を切り替える。JSで `document.body.dataset.mystery = GS.mysteryClues.length` とすれば良い（clamp: 最大3）。

```css
/* ================================================
   Phase 0: ミステリークルー未蓄積（デフォルト）
   視覚変化なし
   ================================================ */
body[data-mystery="0"] {
  /* no overrides */
}

/* ================================================
   Phase 1: clue 1個蓄積
   ごく微細な違和感 — ほぼ気づかない程度
   ================================================ */
body[data-mystery="1"] {
  --mystery-hue:     4deg;
  --mystery-contrast: 1.02;
  --mystery-glitch-opacity: 0.04;
}

/* ゲームパネルの微細な色ずれ */
body[data-mystery="1"] .game-panel,
body[data-mystery="1"] .chat-panel {
  filter: hue-rotate(4deg) contrast(1.02);
}

/* ================================================
   Phase 2: clue 2個蓄積
   テキストに滲み・ウィンドウ枠に亀裂の兆候
   ================================================ */
body[data-mystery="2"] {
  --mystery-hue:     10deg;
  --mystery-contrast: 1.05;
  --mystery-glitch-opacity: 0.12;
}

body[data-mystery="2"] .game-panel,
body[data-mystery="2"] .chat-panel {
  filter: hue-rotate(10deg) contrast(1.05);
}

/* ウィンドウ枠がルートカラーを帯びる（花蓮色ではなく現在ルートのクラックカラーを使用） */
body[data-mystery="2"] .app-window {
  border-color: var(--mystery-crack-color-subtle);
  box-shadow: 0 0 0 1px var(--mystery-crack-color-inset) inset;
}

/* スコアバーのバズ側がわずかに歪む */
body[data-mystery="2"] .score-fill.buzz {
  filter: saturate(1.3) brightness(1.08);
  animation: mystery-score-pulse 3.5s ease-in-out infinite;
}

/* ================================================
   Phase 3: clue 3個以上蓄積
   「何かがおかしい」が明確になる段階
   テキストにノイズ・UIに傷
   ================================================ */
body[data-mystery="3"] {
  --mystery-hue:     20deg;
  --mystery-contrast: 1.10;
  --mystery-glitch-opacity: 0.28;
}

body[data-mystery="3"] .game-panel,
body[data-mystery="3"] .chat-panel {
  filter: hue-rotate(20deg) contrast(1.10);
  transition: filter 1.2s ease;
}

body[data-mystery="3"] .app-window {
  border-color: var(--mystery-crack-color-mid);
  box-shadow:
    0 0 0 1px var(--mystery-crack-color-inset) inset,
    0 4px 24px var(--mystery-crack-color-glow);
}

/* タイトルバーに「傷」を表現するグラデーションライン */
body[data-mystery="3"] .titlebar::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--mystery-crack-color-mid)  40%,
    var(--mystery-crack-color-line) 60%,
    transparent 100%
  );
  animation: mystery-crack-slide 4s ease-in-out infinite;
}

/* mysteryClues 蓄積スコアパルス */
@keyframes mystery-score-pulse {
  0%, 100% { filter: saturate(1.3) brightness(1.08); }
  50%       { filter: saturate(1.6) brightness(1.15) hue-rotate(8deg); }
}

/* タイトルバー「傷」のスライドアニメーション */
@keyframes mystery-crack-slide {
  0%        { left: -100%; right: 100%; }
  40%, 60%  { left: 0; right: 0; }
  100%      { left: 100%; right: -100%; }
}
```

---

## 2. UIグリッチ・歪みエフェクト仕様

### 2-1. グリッチエフェクトの設計原則

- **3段階強度**: `mild`（微細）・`medium`（中程度）・`severe`（最大演出）
- **適用対象要素に `.mystery-glitch` クラスを付与し、強度クラスで制御**
- 花蓮ルートのクライマックス専用 `.karen-climax-glitch` は別途定義
- `prefers-reduced-motion` 対応: 全アニメーションを無効化し、静的な色変化のみ残す

### 2-2. 共通グリッチアニメーション定義

```css
/* ================================================
   グリッチ: テキスト走査ライン（RGB分離風）
   使用箇所: ミステリーPhase 2以降のチャットバブル
   ================================================ */
@keyframes glitch-text-shift {
  0%   { text-shadow: none; clip-path: none; }
  /* 左にシアンずれ */
  8%   {
    text-shadow:
      -2px 0 rgba(0, 255, 255, 0.45),
       2px 0 rgba(255, 0, 128, 0.45);
    clip-path: inset(2% 0 96% 0);
    transform: translateX(-1px);
  }
  /* 右にマゼンタずれ */
  16%  {
    text-shadow:
       2px 0 rgba(0, 255, 255, 0.45),
      -2px 0 rgba(255, 0, 128, 0.45);
    clip-path: inset(50% 0 48% 0);
    transform: translateX(1px);
  }
  24%  { text-shadow: none; clip-path: none; transform: none; }
  100% { text-shadow: none; clip-path: none; transform: none; }
}

/* ================================================
   グリッチ: ブロックノイズ（画面断裂）
   使用箇所: 花蓮クライマックス・Phase 3 ウィンドウ
   ================================================ */
@keyframes glitch-block {
  0%    { transform: translate(0); }
  /* ランダムな矩形領域がずれる */
  2%    { transform: translate(-4px,  1px) skewX( 0.5deg); clip-path: inset(10% 0 85% 0); }
  4%    { transform: translate( 4px, -2px) skewX(-0.5deg); clip-path: inset(45% 0 50% 0); }
  6%    { transform: translate(-2px,  0px);                 clip-path: inset(80% 0 10% 0); }
  8%    { transform: translate(0); clip-path: none; }
  100%  { transform: translate(0); clip-path: none; }
}

/* ================================================
   グリッチ: ウィンドウ全体の水平スキャンライン揺れ
   使用箇所: Phase 3 app-window / karen climax
   ================================================ */
@keyframes glitch-scanline {
  0%, 100% { filter: hue-rotate(var(--mystery-hue)) contrast(var(--mystery-contrast)); }
  3%        { filter: hue-rotate(calc(var(--mystery-hue) + 15deg)) contrast(1.2) brightness(0.9); }
  6%        { filter: hue-rotate(var(--mystery-hue)) contrast(var(--mystery-contrast)); }
  50%       { filter: hue-rotate(calc(var(--mystery-hue) - 5deg)) contrast(var(--mystery-contrast)); }
}

/* ================================================
   グリッチ: フラッシュ白飛び（贖罪エンド冒頭）
   ================================================ */
@keyframes glitch-whiteflash {
  0%   { opacity: 0; }
  5%   { opacity: 1; filter: brightness(3) saturate(0); }
  10%  { opacity: 0.6; filter: brightness(1.5); }
  15%  { opacity: 1; filter: brightness(2.5) saturate(0.2); }
  25%  { opacity: 0; }
  100% { opacity: 0; }
}
```

### 2-3. 強度クラス定義

```css
/* ================================================
   .mystery-glitch — 基底クラス（強度クラスと組み合わせて使用）
   適用タイミング: JS で classList.add('mystery-glitch', 'mild') 等
   ================================================ */
.mystery-glitch {
  position: relative;
  /* グリッチ用オーバーレイ（::before）のベース */
}

/* 強度 mild: Phase 1〜2 / 主にテキスト */
.mystery-glitch.mild {
  animation: glitch-text-shift 8s step-end infinite;
  animation-delay: calc(var(--glitch-seed, 0) * 1.3s); /* 要素ごとにずらす */
}

/* 強度 medium: Phase 2〜3 / バブル・ウィンドウ枠 */
.mystery-glitch.medium {
  animation: glitch-text-shift 5s step-end infinite,
             glitch-scanline   5s step-end infinite;
  animation-delay: calc(var(--glitch-seed, 0) * 0.9s);
}

/* 強度 severe: Phase 3 / 花蓮クライマックス直前 */
.mystery-glitch.severe {
  animation: glitch-block    3s step-end infinite,
             glitch-scanline 3s step-end infinite;
  animation-delay: 0s;
}

/* ================================================
   グリッチオーバーレイ（走査線ノイズ効果）
   .mystery-glitch::before で描画するCSSノイズ
   ================================================ */
.mystery-glitch.medium::before,
.mystery-glitch.severe::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.06) 2px,
    rgba(0, 0, 0, 0.06) 4px
  );
  pointer-events: none;
  opacity: var(--mystery-glitch-opacity, 0.1);
  z-index: 999;
  border-radius: inherit;
}

/* ================================================
   prefers-reduced-motion 対応
   すべてのグリッチアニメーションを無効化
   静的な色変化（hue-rotate）のみ維持
   ================================================ */
@media (prefers-reduced-motion: reduce) {
  .mystery-glitch,
  .mystery-glitch.mild,
  .mystery-glitch.medium,
  .mystery-glitch.severe {
    animation: none !important;
  }

  .mystery-glitch.medium::before,
  .mystery-glitch.severe::before {
    /* アニメーションの代わりに静的な色オーバーレイで「異常」を示す */
    background: var(--mystery-crack-color-reduced);
    opacity: 0.08;
  }

  /* ミステリーフェーズの色調変化（filter）は維持 */
  body[data-mystery="3"] .game-panel,
  body[data-mystery="3"] .chat-panel {
    transition: none;
  }

  /* カーソル点滅・走査線等も停止 */
  body[data-mystery="3"] .titlebar::after {
    animation: none;
    opacity: 0.3;
  }
}
```

### 2-4. 適用タイミング早見表

| 強度 | フェーズ / シーン | 対象要素 | JSトリガー |
|------|-------------------|---------|------------|
| `mild` | Phase 1 (clue=1) | `.protag-bubble.flashback` | `mysteryClues.length >= 1` |
| `mild` | Phase 2 (clue=2) | 花蓮バブル（最新1件） | `mysteryClues.length >= 2` |
| `medium` | Phase 2 | `.app-window`（花蓮ルートのみ） | 同上 |
| `medium` | Phase 3 (clue=3+) | `.chat-panel`, `.step-bar` | `mysteryClues.length >= 3` |
| `severe` | 花蓮クライマックス（選択肢表示直前） | `.app-window`, `.game-panel` | `karen_mystery_choice` 到達時 |
| `severe` | 贖罪エンド冒頭 | `#screen-ending` | `showEnding('zange')` |

---

## 3. キャラクターアバター変化仕様

### 3-1. 花蓮（篠宮花蓮 / 🌸）アバターの段階的変化

花蓮アバターは `data-mystery` の値と連動して3段階で変化する。アバター要素に `.karen-avatar` クラスを付与しておくこと。

```css
/* ================================================
   花蓮アバター — 通常状態（Phase 0〜1）
   クールで謎めいた印象。通常のアバタースタイル。
   ================================================ */
.karen-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--route-avatar-grad, linear-gradient(135deg, #2a0e1e, #180a14));
  border: 2px solid var(--route-avatar-border, #c87890);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color  0.8s ease,
    box-shadow    0.8s ease,
    filter        0.8s ease;
}

/* ================================================
   花蓮アバター — 不穏状態（Phase 2 / data-mystery="2"）
   ボーダーが脈動し、「何かを隠している」雰囲気を醸す
   ================================================ */
body[data-mystery="2"] .karen-avatar,
.karen-avatar.unsettled {
  border-color: rgba(200, 120, 144, 0.85);
  box-shadow:
    0 0  8px rgba(200, 120, 144, 0.35),
    0 0 16px rgba(200, 120, 144, 0.15);
  animation: karen-avatar-pulse 2.8s ease-in-out infinite;
}

@keyframes karen-avatar-pulse {
  0%, 100% {
    box-shadow:
      0 0  8px rgba(200, 120, 144, 0.35),
      0 0 16px rgba(200, 120, 144, 0.15);
  }
  50% {
    box-shadow:
      0 0 12px rgba(200, 120, 144, 0.60),
      0 0 24px rgba(200, 120, 144, 0.28);
    border-color: rgba(200, 120, 144, 1.0);
  }
}

/* ================================================
   花蓮アバター — 開示状態（Phase 3 / 真実告白後）
   .revealed クラスをJSで付与する
   ボーダーが「砕ける」→「金色に昇華」する演出
   ================================================ */
.karen-avatar.revealed {
  border-color: #f0d080;  /* 金色：真実が明かされた解放感 */
  box-shadow:
    0 0 20px rgba(240, 208, 128, 0.55),
    0 0  8px rgba(240, 208, 128, 0.80);
  filter: none;
  animation: karen-reveal 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes karen-reveal {
  0%   {
    transform: scale(0.92);
    filter: brightness(0.7) saturate(0.5);
    border-color: rgba(200, 120, 144, 0.4);
  }
  40%  {
    transform: scale(1.12);
    filter: brightness(1.4) saturate(1.2);
  }
  60%  {
    transform: scale(0.96);
    border-color: #f0d080;
    box-shadow: 0 0 32px rgba(240, 208, 128, 0.8);
  }
  100% {
    transform: scale(1.0);
    filter: none;
    border-color: #f0d080;
  }
}
```

### 3-2. 各キャラの「伏線として機能する」表情差分仕様

チャットアバター要素に `data-mood` 属性を付与し、感情状態をCSSで制御する。

#### 共通アバター状態クラス

```css
/* ================================================
   感情状態クラス — 全キャラ共通
   使用例: <div class="chat-avatar midori-avatar" data-mood="concerned">
   ================================================ */

/* 通常 */
[data-mood="normal"] {
  /* デフォルトスタイルを維持 */
}

/* 心配・不安（伏線ヒント用） */
[data-mood="concerned"] {
  filter: brightness(0.88) saturate(0.85);
  transition: filter 0.6s ease;
}

/* 驚き・動揺 */
[data-mood="shocked"] {
  animation: avatar-shock 0.4s ease-out;
  filter: brightness(1.2);
}

@keyframes avatar-shock {
  0%   { transform: scale(1.0) rotate(0deg); }
  25%  { transform: scale(1.08) rotate(-3deg); }
  50%  { transform: scale(0.96) rotate(2deg); }
  75%  { transform: scale(1.04) rotate(-1deg); }
  100% { transform: scale(1.0) rotate(0deg); }
}

/* 沈黙・距離感（特定の意味深な返答後） */
[data-mood="distant"] {
  filter: brightness(0.72) saturate(0.6) blur(0.3px);
  transition: filter 1.2s ease;
}

/* 解放・喜び */
[data-mood="relieved"] {
  filter: brightness(1.1) saturate(1.15);
  box-shadow: 0 0 12px var(--route-accent, rgba(255, 107, 157, 0.4));
  transition: all 0.5s ease;
}
```

#### みどりアバター固有仕様

```css
/* みどり: 過去の炎上への言及時（フラッシュバック段階1）
   「お母さん」ワード後 — アバターが一瞬固まる */
.midori-avatar[data-mood="flashback-hint"] {
  animation: midori-freeze 0.8s ease forwards;
}

@keyframes midori-freeze {
  0%   { filter: brightness(1.0) saturate(1.0); }
  30%  { filter: brightness(0.7) saturate(0.4) blur(0.5px); transform: scale(0.97); }
  70%  { filter: brightness(0.7) saturate(0.4) blur(0.5px); transform: scale(0.97); }
  100% { filter: brightness(0.88) saturate(0.85); transform: scale(1.0); }
}
```

#### 朔アバター固有仕様

```css
/* 朔: 「残したい」発言後（フラッシュバック段階2）
   アバターの明度がゆっくり下がり、工場夜勤の「遠さ」を表現 */
.saku-avatar[data-mood="flashback-hint"] {
  filter: brightness(0.75) saturate(0.5) sepia(0.15);
  transition: filter 2.0s ease;
}
```

#### 花蓮アバター固有仕様（再掲・集約）

```css
/* 花蓮: 伏線用「知っている顔」
   素材カード「依頼の理由メモ」フリップ後（フラッシュバック段階3）に適用 */
.karen-avatar[data-mood="knowing"] {
  border-color: rgba(200, 120, 144, 0.95);
  box-shadow:
    0 0 10px rgba(200, 120, 144, 0.50),
    0 0  4px rgba(200, 120, 144, 0.80) inset;
  animation: karen-knowing 3s ease-in-out infinite;
  transition: all 0.6s ease;
}

@keyframes karen-knowing {
  0%, 100% { box-shadow: 0 0 10px rgba(200, 120, 144, 0.50), 0 0 4px rgba(200, 120, 144, 0.80) inset; }
  50%       { box-shadow: 0 0 18px rgba(200, 120, 144, 0.75), 0 0 6px rgba(200, 120, 144, 1.0) inset; }
}
```

---

## 4. 花蓮ルートのクライマックスビジュアル

### 4-1. 「バズ数字が暴走する」SNS投稿UIの演出CSS

花蓮ルートのクライマックス（`karen_mystery_choice` 選択肢表示直前）では、SNS反響フィード（`.reaction-area`）の数値UIが「暴走」するアニメーションを演出する。

```css
/* ================================================
   バズ数字暴走モード
   JSで .reaction-area に .karen-climax クラスを付与して発動
   ================================================ */

/* 数値カウンターの異常高速カウントアップ */
.karen-climax .stat-num {
  animation:
    karen-num-runaway   0.3s step-end infinite,
    karen-num-flicker   1.5s ease-in-out infinite;
  color: var(--accent, #ff6b9d);
  filter: brightness(1.4) saturate(1.6);
}

@keyframes karen-num-runaway {
  /* CSSだけで数値を変えることはできないため、
     テキストの「震え」と色でパニック感を演出。
     実数値の高速増加はJSで制御する（setInterval毎100msで+乱数）。 */
  0%   { transform: translateX(0) rotate(0deg); }
  20%  { transform: translateX(-2px) rotate(-0.5deg); }
  40%  { transform: translateX(2px) rotate(0.5deg); }
  60%  { transform: translateX(-1px) rotate(-0.3deg); }
  80%  { transform: translateX(1px) rotate(0.3deg); }
  100% { transform: translateX(0) rotate(0deg); }
}

@keyframes karen-num-flicker {
  0%, 100% { opacity: 1; }
  45%       { opacity: 0.85; }
  47%       { opacity: 0.4; filter: brightness(2) saturate(0.5); }
  49%       { opacity: 1; }
}

/* いいねアイコンが「狂ったように点灯」する */
.karen-climax .feed-action {
  animation: karen-like-frenzy 0.4s step-end infinite;
}

@keyframes karen-like-frenzy {
  0%   { color: var(--heart, #f91880); opacity: 1; }
  33%  { color: var(--accent2, #7c6af7); opacity: 0.8; }
  66%  { color: var(--accent, #ff6b9d); opacity: 1; }
  100% { color: var(--heart, #f91880); opacity: 1; }
}

/* フィードカードのボーダーが脈動・拡散 */
.karen-climax .feed-card {
  border-color: rgba(200, 120, 144, 0.8);
  animation: karen-feed-pulse 0.6s ease-in-out infinite;
  box-shadow:
    0 0 20px rgba(200, 120, 144, 0.30),
    0 0  8px rgba(200, 120, 144, 0.50) inset;
}

@keyframes karen-feed-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(200, 120, 144, 0.30), 0 0 8px rgba(200, 120, 144, 0.50) inset;
  }
  50% {
    box-shadow: 0 0 40px rgba(200, 120, 144, 0.55), 0 0 16px rgba(200, 120, 144, 0.70) inset;
  }
}

/* ハッシュタグが赤く染まる */
.karen-climax .feed-tags,
.karen-climax .preview-hash {
  color: var(--accent, #ff6b9d);
  animation: karen-hash-bleed 2s ease-in-out infinite;
}

@keyframes karen-hash-bleed {
  0%, 100% { color: var(--accent, #ff6b9d); text-shadow: none; }
  50% {
    color: #ff3366;
    text-shadow: 0 0 8px rgba(255, 51, 102, 0.6), 0 0 16px rgba(255, 51, 102, 0.3);
  }
}

/* 全体フィルター（ゲームパネル全体が歪む） */
.karen-climax {
  filter:
    hue-rotate(25deg)
    contrast(1.15)
    saturate(1.3);
  animation: glitch-scanline 1.5s step-end infinite;
  transition: filter 0.3s ease;
}
```

### 4-2. 収束シーン（解決へ向かう）の色調・画面デザイン

贖罪エンド（`zange`）・既読エンド（`kidoku`）での「解決へ向かう」収束シーンの色調変化。

```css
/* ================================================
   収束フェーズ — 暴走終息（.karen-climax → .karen-resolve）
   JSで .karen-climax を除去し .karen-resolve を付与
   ※ エンディング別に分岐する。以下参照。
   ================================================ */

/* 贖罪エンド（zange）: 白飛びから温かい金色へ */
.karen-resolve.ending-zange {
  filter: none;
  animation: karen-resolve-fade-zange 2.5s ease-out forwards;
}

@keyframes karen-resolve-fade-zange {
  0%   { filter: hue-rotate(25deg) contrast(1.15) saturate(1.3); }
  15%  { filter: brightness(2.5) saturate(0.2); background: rgba(255, 255, 255, 0.05); }
  30%  { filter: brightness(1.8) saturate(0.5) hue-rotate(5deg); }
  70%  { filter: brightness(1.1) saturate(0.85) sepia(0.08); }
  100% { filter: brightness(1.0) saturate(1.0); }
}

/* 既読エンド（kidoku）: 藍色のまま静かに落ち着く。解決感を出さない */
.karen-resolve.ending-kidoku {
  filter: none;
  animation: karen-resolve-fade-kidoku 3s ease-out forwards;
}

@keyframes karen-resolve-fade-kidoku {
  0%   { filter: hue-rotate(25deg) contrast(1.15) saturate(1.3); }
  20%  { filter: hue-rotate(15deg) contrast(1.05) saturate(0.9); }
  60%  { filter: hue-rotate(5deg)  contrast(1.0)  saturate(0.75) brightness(0.9); }
  100% { filter: hue-rotate(0deg)  contrast(1.0)  saturate(0.7)  brightness(0.88); }
}

/* 沈黙エンド（chinmoku）: 暴走が「消える」だけで何も解決しない */
.karen-resolve.ending-chinmoku {
  filter: none;
  animation: karen-resolve-fade-chinmoku 4s ease-out forwards;
}

@keyframes karen-resolve-fade-chinmoku {
  0%   { filter: hue-rotate(25deg) contrast(1.15) saturate(1.3); }
  40%  { filter: hue-rotate(10deg) contrast(1.0)  saturate(0.5); }
  100% { filter: hue-rotate(0deg)  contrast(1.0)  saturate(0.0) brightness(0.7); }
}

/* 収束後の画面背景（贖罪エンドのみ金色グラデーション） */
body[data-route="karen"].karen-resolved.ending-zange .desktop::before {
  background:
    radial-gradient(ellipse at 50% 60%, rgba(240, 208, 128, 0.08) 0%, transparent 55%),
    radial-gradient(ellipse at 30% 20%, rgba(200, 120, 144, 0.06) 0%, transparent 40%);
  transition: background 3s ease;
}

/* エンディング画面 — 贖罪エンド専用背景 */
#screen-ending.ending-zange {
  background: radial-gradient(
    ellipse at center,
    #1e1020 0%,
    #0d0d14 60%,
    rgba(200, 120, 144, 0.04) 100%
  );
}

/* エンディング画面 — 沈黙エンド専用背景（漆黒） */
#screen-ending.ending-chinmoku {
  background: #080808;
  transition: background 3s ease;
}

/* エンディング画面 — 既読エンド専用背景（夜明け前の藍） */
#screen-ending.ending-kidoku {
  background: radial-gradient(
    ellipse at center,
    #0e1428 0%,
    #080d18 70%
  );
}

/* 贖罪エンド: タイピング入力欄の演出CSS
   「書きかけて消す → 再入力」アニメーション用コンテナ */
.zange-typing-wrap {
  position: relative;
  overflow: hidden;
}

/* テキストカーソルの点滅（typingRetry: true 演出） */
.zange-typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: var(--accent2, #7c6af7);
  vertical-align: middle;
  margin-left: 1px;
  animation: blink 0.8s step-end infinite; /* 既存 blink アニメーション流用 */
}
```

---

## 5. SNS風UIを「違和感ツール」として使う設計

### 5-1. 通知バッジの異常表示

```css
/* ================================================
   通知バッジ異常系
   花蓮クライマックス時に .abnormal クラスを付与
   ================================================ */

/* 未読バッジが「999+」表示 + 膨張アニメーション */
.chatapp-talk-badge.abnormal,
.chatapp-nav-badge.abnormal {
  content: "999+";
  min-width: 28px;
  background: var(--accent, #ff6b9d);   /* 通常の緑 #06c755 から赤系に変化 */
  color: #fff;
  font-weight: 900;
  animation: badge-overflow 1.2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes badge-overflow {
  0%, 100% { transform: scale(1.0);    background: var(--accent, #ff6b9d); }
  30%       { transform: scale(1.25);  background: #ff3366; }
  50%       { transform: scale(0.92);  background: var(--accent, #ff6b9d); }
  70%       { transform: scale(1.15);  background: #ff3366; }
}

/* デスクトップアイコンの通知ドットが「赤く暴走」 */
.desktop-notif.abnormal {
  background: var(--accent, #ff6b9d);  /* 通常の白 #fff から変化 */
  width: 14px;
  height: 14px;
  top: 6px;
  right: 4px;
  animation: notif-panic 0.8s step-end infinite; /* notifPulse より速い */
  border: 2px solid rgba(255, 107, 157, 0.4);
}

@keyframes notif-panic {
  0%   { transform: scale(1.0); opacity: 1; }
  25%  { transform: scale(1.4); opacity: 0.8; }
  50%  { transform: scale(0.8); opacity: 1; }
  75%  { transform: scale(1.3); opacity: 0.7; }
  100% { transform: scale(1.0); opacity: 1; }
}
```

### 5-2. いいね数・フォロワー数が「おかしい」演出CSS

```css
/* ================================================
   数値異常演出
   反響フェーズの .stat-num, .y-window 内の数値に適用
   ================================================ */

/* いいね数が急増する「カウンタースピン」演出
   数値要素を上方向にスクロールさせ、新数値が飛び込む錯視 */
.stat-num.runaway {
  overflow: hidden;
  height: 1.2em;
  position: relative;
  animation: num-spin-up 0.15s linear infinite;
}

@keyframes num-spin-up {
  0%   { transform: translateY(0); opacity: 1; }
  49%  { transform: translateY(-50%); opacity: 0.6; }
  50%  { transform: translateY(50%); opacity: 0.6; }
  100% { transform: translateY(0); opacity: 1; }
}

/* フォロワー数表示が「マイナス」に反転する瞬間
   （存在確認: 実際の数値変更はJS側。CSSは視覚的ショックを担当）*/
.stat-num.negative-flash {
  color: var(--accent, #ff6b9d);
  text-decoration: line-through;
  animation: neg-flash 0.5s ease forwards;
}

@keyframes neg-flash {
  0%   { color: var(--accent3, #00d4aa); filter: brightness(1.0); }
  20%  { color: #ff3366; filter: brightness(1.6) saturate(1.5); }
  50%  { color: var(--accent, #ff6b9d); filter: brightness(1.2); text-decoration: line-through; }
  100% { color: var(--accent, #ff6b9d); text-decoration: line-through; }
}

/* Yウィンドウ内トレンドが「花蓮」関連ワードで埋め尽くされる演出
   .y-trend-item.karen-trend で適用 */
.y-trend-item.karen-trend {
  background: rgba(200, 120, 144, 0.10);
  border-left: 2px solid var(--route-accent, #c87890);
  animation: trend-highlight 2s ease-in-out infinite;
  padding-left: 10px;
  transition: background 0.3s ease;
}

@keyframes trend-highlight {
  0%, 100% { background: rgba(200, 120, 144, 0.10); }
  50%       { background: rgba(200, 120, 144, 0.22); }
}
```

### 5-3. 「喫茶 ゆきわりそう」看板のハイライト仕様

誠司ルート・花蓮ルートを通じた伏線装置として機能する「喫茶 ゆきわりそう」への言及をUI上でハイライトする。

```css
/* ================================================
   「ゆきわりそう」ハイライト
   チャットバブル内のキーワードに .yukiwarisou-kw クラスをJSで付与
   ================================================ */
.yukiwarisou-kw {
  color: var(--accent, #ff6b9d);
  font-weight: 700;
  cursor: pointer;
  position: relative;
  padding: 0 2px;
  border-radius: 2px;
  transition: background 0.2s ease, color 0.2s ease;
}

/* ホバーで「クリックで詳細」示唆 */
.yukiwarisou-kw:hover {
  background: rgba(200, 168, 120, 0.18);  /* 誠司カラーの温かみ */
  color: #c8a878;
  text-shadow: 0 0 8px rgba(200, 168, 120, 0.5);
}

/* mysteryClues に 'yukiwarisou' が蓄積済みの場合の追加演出
   body[data-yukiwarisou="found"] でハイライト強化 */
body[data-yukiwarisou="found"] .yukiwarisou-kw {
  color: #c8a878;
  background: rgba(200, 168, 120, 0.12);
  animation: yukiwarisou-glow 3s ease-in-out infinite;
}

/* 古い電球の不均一なちらつき: steps() で非連続な点灯 */
@keyframes yukiwarisou-glow {
  0%   { text-shadow: 0 0 4px rgba(200, 168, 120, 0.3);  background: rgba(200, 168, 120, 0.10); }
  15%  { text-shadow: 0 0 10px rgba(200, 168, 120, 0.8); background: rgba(200, 168, 120, 0.22); }
  18%  { text-shadow: 0 0 2px rgba(200, 168, 120, 0.2);  background: rgba(200, 168, 120, 0.06); }
  20%  { text-shadow: 0 0 8px rgba(200, 168, 120, 0.7);  background: rgba(200, 168, 120, 0.18); }
  60%  { text-shadow: 0 0 4px rgba(200, 168, 120, 0.3);  background: rgba(200, 168, 120, 0.10); }
  80%  { text-shadow: 0 0 6px rgba(200, 168, 120, 0.5);  background: rgba(200, 168, 120, 0.14); }
  81%  { text-shadow: 0 0 1px rgba(200, 168, 120, 0.1);  background: rgba(200, 168, 120, 0.04); }
  83%  { text-shadow: 0 0 6px rgba(200, 168, 120, 0.5);  background: rgba(200, 168, 120, 0.14); }
  100% { text-shadow: 0 0 4px rgba(200, 168, 120, 0.3);  background: rgba(200, 168, 120, 0.10); }
}

/* メモ帳ウィンドウ内のゆきわりそうキーワード */
.note-item-keyword[data-clue="yukiwarisou"] {
  color: #c8a878;     /* 誠司ルートのセピアゴールド */
  border-left: 2px solid rgba(200, 168, 120, 0.5);
  padding-left: 6px;
  font-weight: 700;
}
```

---

## 6. 既存UI設計書との整合確認・差分

### 6-1. 整合確認済み項目

以下の項目は `docs/UI設計書.md` v1.1 の仕様と矛盾なく設計されている。

| 仕様項目 | 本仕様書での対応 | 整合状況 |
|---------|----------------|---------|
| 基盤カラー（`--bg`, `--surface` 等） | 上書きせず、ルート固有変数として追加（`--route-accent` 等） | 整合 |
| アニメーション名（`blink`, `fadeIn`, `pop` 等） | 既存を参照・流用（重複定義なし） | 整合 |
| `prefers-reduced-motion` 対応 | §9 優先度:低 に記載されていた課題を本仕様書で先行実装 | 拡張 |
| `mysteryClues` UI通知の方針（静かな蓄積） | グリッチ演出は視覚にとどめ、トースト通知を追加しない設計を維持 | 整合 |
| `egoScore` 非表示方針 | 本仕様書でegoScore専用UIを定義せず | 整合 |
| `.chat-avatar` のボーダー・背景 | ルート別変数 `--route-avatar-grad`, `--route-avatar-border` で上書き可能にした | 拡張 |
| `DotGothic16` フォント使用 | スコア数値・異常演出の数値要素で継続使用 | 整合 |
| エンディング背景（全エンド共通 `#1a0a2e`） | §9 改善案に「差別化の余地あり」と記載されていたため、各エンド専用背景を定義 | 拡張実装 |

### 6-2. 既存との差分（追加・変更）

#### 追加: ルートテーマ変数

既存 `UI設計書.md` にはルート別CSS変数の定義がなかった。本仕様書で新規追加。

```css
/* 追加変数一覧（:root に追記が必要） */
--route-accent
--route-accent2
--route-bg-tint
--route-chat-bg
--route-chat-border
--route-avatar-grad
--route-avatar-border
--route-shadow
--mystery-hue
--mystery-contrast
--mystery-glitch-opacity
```

#### 追加: body 属性によるテーマ切り替え

JSでの実装として以下が必要:

```javascript
// ルート設定時
document.body.dataset.route = GS.character; // 'midori' | 'saku' | 'seiji' | 'karen'

// ミステリーフェーズ更新時（mysteryClues 蓄積ごとに呼ぶ）
document.body.dataset.mystery = Math.min(GS.mysteryClues.length, 3).toString();

// ゆきわりそう発見フラグ
document.body.dataset.yukiwarisou =
  GS.mysteryClues.includes('yukiwarisou') ? 'found' : '';
```

#### 変更: チャットアバタースタイルの個別化

既存の `UI設計書.md` §6-2 では「朔のアバター背景は緑グラデーション（共通）のまま、テーマカラーのパープルは未反映」と記録されていた。本仕様書では `--route-avatar-grad` / `--route-avatar-border` 変数で各ルート固有アバタースタイルを実現し、この課題を解消する。

| キャラ | 旧アバターボーダー | 新アバターボーダー |
|--------|------------------|------------------|
| みどり | `#06c755` | `#4caf80` |
| 朔 | `#06c755` | `#6aa0c8` |
| 誠司 | `#06c755` | `#c8a878` |
| 花蓮 | `#06c755` | `#c87890` |

#### 拡張: エンディング別背景

既存 `UI設計書.md` §9（優先度:低）に「エンディング別の背景グラデーションカラー差別化」が課題として挙げられていた。本仕様書で先行定義（§4-2 参照）。

| エンド | クラス | 背景色 |
|--------|--------|-------|
| 贖罪（zange） | `.ending-zange` | `#1e1020 → #0d0d14` |
| 沈黙（chinmoku） | `.ending-chinmoku` | `#080808`（漆黒） |
| 既読（kidoku） | `.ending-kidoku` | `#0e1428 → #080d18` |
| その他 | （変更なし） | `#1a0a2e → #0d0d14`（既存） |

### 6-3. 実装上の注意点

1. **`.desktop::before` 疑似要素**: 既存の `.desktop` は CSS で `radial-gradient` 背景を設定している。`::before` を使う場合、`.desktop` に `position: relative` が必要。確認のこと（既存コードでは `position: absolute` が使われているが、デスクトップ自体が `position: fixed / absolute` の場合は問題ない）。

2. **`data-mystery` の更新タイミング**: `handleCardClick()` 内で `mysteryClues` を更新した直後に `document.body.dataset.mystery` を更新すること。更新漏れがあるとグリッチが発動しない。

3. **グリッチと既存フィルター**: 既存の `filter` プロパティ（例: `.card-flip-wrapper.locked { opacity: .45 }`）とグリッチフィルターが同一要素に重なる場合、CSS specificity の競合に注意。グリッチはなるべく親要素（`.game-panel`, `.app-window`）に適用し、子要素の既存フィルターと分離すること。

4. **`prefers-reduced-motion` の優先度**: 本仕様書の `@media (prefers-reduced-motion: reduce)` ブロックは全グリッチアニメーションを停止する。ゲームプレイ体験上の核心演出（花蓮クライマックス）に影響するが、アクセシビリティを優先しこの設計を維持する。代替として、静的なカラー変化のみで「何かがおかしい」ことを伝える設計とする。

---

---

## 7. フラッシュバック演出レイヤー仕様

### 7-1. `#flashback-overlay` — フラッシュバック3「2枚並列演出」

`plot_steinsgate.md §3` が定義するフラッシュバック3の二層テキスト演出のCSS。
- **背景レイヤー**: 過去テキスト（Phase 1 のフラッシュバック文）を薄く重ねる
- **前景レイヤー**: `k_memo` カードを画面中央に固定表示

```css
/* ================================================
   #flashback-overlay — フラッシュバック3専用レイヤー
   JS で show()/hide() で表示切り替え
   ================================================ */
#flashback-overlay {
  position: fixed;
  inset: 0;
  z-index: 8000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease;
}

#flashback-overlay.visible {
  opacity: 1;
}

/* 過去テキスト（背景レイヤー、約30%透明度） */
#flashback-overlay .fb-past-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.28);
  font-size: 0.85rem;
  line-height: 2;
  text-align: center;
  white-space: pre-line;
  padding: 40px;
  animation: fb-past-fadein 1.2s ease forwards;
  letter-spacing: 0.05em;
}

@keyframes fb-past-fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* 前景カード（k_memo カード、影を強調して「浮いている」感） */
#flashback-overlay .fb-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.92);
  width: min(320px, 80vw);
  background: var(--surface, #1e1e2a);
  border: 1px solid var(--mystery-crack-color-mid);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.8),
    0 0 24px var(--mystery-crack-color-glow);
  animation: fb-card-rise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  z-index: 1;
}

@keyframes fb-card-rise {
  from { transform: translate(-50%, -40%) scale(0.85); opacity: 0.4; }
  to   { transform: translate(-50%, -50%) scale(1.0);  opacity: 1; }
}
```

### 7-2. 沈黙エンドの「文字が浮かび上がる」テキスト演出

```css
/* ================================================
   沈黙エンド: テキストが漆黒から静かに浮かぶ
   完全には見えないまま留まる（解決しない余韻）
   ================================================ */
.ending-chinmoku .ending-text {
  opacity: 0;
  animation: chinmoku-text-float 5s ease-in 0.5s forwards;
  color: rgba(200, 200, 220, 0.7);
  font-size: 1.1rem;
  letter-spacing: 0.12em;
  line-height: 2.2;
  text-align: center;
}

@keyframes chinmoku-text-float {
  0%   { opacity: 0;    transform: translateY(8px); }
  40%  { opacity: 0.35; transform: translateY(4px); }
  70%  { opacity: 0.55; transform: translateY(2px); }
  100% { opacity: 0.6;  transform: translateY(0); }
  /* 意図的に 0.6 止まり。完全な透明度 1.0 には達しない */
}

/* 「——カ」1文字だけが最後に出る専用クラス */
.ending-chinmoku .ending-final-char {
  opacity: 0;
  animation: chinmoku-final 3s ease-in 3s forwards;
  font-size: 1.4rem;
  color: rgba(200, 180, 220, 0.5);
  display: block;
  margin-top: 2em;
}

@keyframes chinmoku-final {
  from { opacity: 0; letter-spacing: 0.6em; }
  to   { opacity: 0.5; letter-spacing: 0.12em; }
}

@media (prefers-reduced-motion: reduce) {
  .ending-chinmoku .ending-text,
  .ending-chinmoku .ending-final-char {
    animation: none;
    opacity: 0.6;
    transform: none;
  }
}
```

### 7-3. 湊の内部モノローグ専用バブルスタイル（「翻訳」テーマの視覚化）

```css
/* ================================================
   湊の内部モノローグバブル
   「翻訳者として自分が消える」アイデンティティを
   UIで表現: 通常バブルより透明度を高め、斜体で
   ================================================ */
.protag-bubble {
  background: rgba(30, 30, 50, 0.65);   /* 通常バブルより薄い */
  border: 1px solid rgba(126, 184, 247, 0.15);
  color: rgba(220, 230, 255, 0.80);
  font-style: italic;
  opacity: 0.88;
  transition: opacity 0.4s ease;
}

/* flashback スタイル: より薄く、過去の残滓 */
.protag-bubble.flashback {
  background: rgba(20, 10, 30, 0.55);
  border-color: var(--mystery-crack-color-subtle);
  color: rgba(200, 180, 240, 0.65);
  opacity: 0.80;
}

/* hollow スタイル（贖罪エンド経路）: 輪郭だけが残る */
.protag-bubble.hollow {
  background: transparent;
  border: 1px solid rgba(126, 184, 247, 0.20);
  color: rgba(200, 220, 255, 0.55);
  opacity: 0.75;
  font-style: italic;
}

/* モノローグが増えるほど湊が「見えてくる」— flashbackPhase 3 以降 */
body[data-flashback-phase="3"] .protag-bubble {
  opacity: 1.0;
  font-style: normal;
  border-color: rgba(126, 184, 247, 0.35);
  color: rgba(230, 235, 255, 0.95);
  transition: all 0.8s ease;
}
```

---

*本仕様書は `docs/UI設計書.md` v1.1 を基準とし、ビジュアル演出の拡張仕様として位置づける。実装時は `css/main.css` の該当セクションに追記すること。*
