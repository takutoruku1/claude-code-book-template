# レビュー: visual_spec.md — 演出・実装視点

> レビュアー: 演出・実装担当エージェント  
> レビュー対象: `docs/visual_spec.md`  
> 参照: `docs/direction_script.md`  
> 作成日: 2026-05-11

---

## 総合評価: **B**

仕様書の完成度は高く、ミステリーフェーズの段階的演出設計や `prefers-reduced-motion` 対応など、演出連携を意識した記述が随所に見られる。しかし演出スクリプトとの間に **クラス名体系の根本的不一致** が存在し、そのままでは実装時に動作しない箇所がある。修正は局所的だが、早期対処が必要。

---

## 重大な問題点（演出との不整合・実装上の問題）

### 問題1: グリッチ強度クラス名の不一致（最重大）

`direction_script.md` §1-4 `directionGlitch()` 関数は、`glitch` 命令の `intensity` パラメータを使って以下のクラスを付与する:

```javascript
// direction_script.md §1-4
const cls = `glitch-${d.intensity || 'medium'}`;
target.classList.add(cls);
```

つまり演出エンジンが付与するクラス名は:
- `glitch-low`
- `glitch-medium`
- `glitch-high`

一方 `visual_spec.md` §2-3 で定義されているクラス名は:
- `.mystery-glitch.mild`
- `.mystery-glitch.medium`
- `.mystery-glitch.severe`

**名前が完全に食い違っている。** `glitch` 命令で `intensity: "low"` を指定しても `.mystery-glitch.mild` のアニメーションは発火しない。逆に `intensity: "high"` を指定しても `.mystery-glitch.severe` は反応しない。

さらに `visual_spec.md` §2-4 の適用タイミング表は `.mystery-glitch` クラスの手動付与を前提としているが、`direction_script.md` の `directionGlitch()` はそのクラスを付与しない。

**正しい対応関係（どちらかに統一が必要）:**

| direction_script.md の `intensity` | visual_spec.md の意図 | 実際に付与されるクラス |
|-------------------------------------|----------------------|--------------------|
| `"low"` | `mild` | `glitch-low` |
| `"medium"` | `medium` | `glitch-medium` |
| `"high"` | `severe` | `glitch-high` |

`direction_script.md` §3-2 には `.glitch-low`, `.glitch-medium`, `.glitch-high` のCSSアニメーション定義が含まれており、こちらが演出エンジンと正しく対応している。`visual_spec.md` §2 の `.mystery-glitch.*` クラス群は、**演出エンジンから呼ばれない孤立した定義**になっている。

**修正方針（推奨）:** `visual_spec.md` §2-3 の強度クラス名を `direction_script.md` のクラス名（`.glitch-low`, `.glitch-medium`, `.glitch-high`）に統一する。または `directionGlitch()` 関数を修正して `.mystery-glitch` クラスも併用する形にする。

---

### 問題2: `applyMysteryPhase()` が使うクラス体系と `body[data-mystery="N"]` 属性体系の並立・混在

`visual_spec.md` は `body[data-mystery="0〜3"]` のデータ属性セレクタでミステリーフェーズを制御する設計を採用している（§1-4）。

一方 `direction_script.md` §3-3 の `applyMysteryPhase()` 実装は:

```javascript
document.body.classList.remove('mystery-0', 'mystery-1', 'mystery-2', 'mystery-3');
document.body.classList.add(`mystery-${phase}`);
```

と **CSSクラス** を使う。さらに §3-2 のCSS定義も `body.mystery-1 ...`, `body.mystery-2 ...` のクラスセレクタになっている。

`visual_spec.md` §1-2 のJS実装例は:

```javascript
document.body.dataset.mystery = Math.min(GS.mysteryClues.length, 3).toString();
```

と **data 属性** を使う。

**結果として**:
- `visual_spec.md` の `body[data-mystery="2"] .game-panel { filter: ... }` → `applyMysteryPhase()` を呼んでも反応しない（クラスが設定されるが属性は変わらない）
- `direction_script.md` の `body.mystery-2 .msg-bubble.client { ... }` → `visual_spec.md` 側のJSコードから呼ばれると反応しない（属性が設定されるがクラスは変わらない）

どちらの方式を採用するか明示的に統一しなければ、片方のCSS定義が必ず機能しない。

**修正方針（推奨）:** `applyMysteryPhase()` で両方を設定する（クラスと data 属性の両方）か、どちらかの方式に一本化する。演出エンジン側の `applyMysteryPhase()` を正とするなら、`visual_spec.md` §1-4 の CSS セレクタを `body[data-mystery="N"]` から `body.mystery-N` に変更する。

---

### 問題3: `karen_mystery_choice` 時の `.karen-climax` クラス付与タイミングが未定義

`visual_spec.md` §4-1 では `.karen-climax` クラスを `.reaction-area` に付与することで「バズ数字暴走」演出が発動する設計になっている。

`direction_script.md` §2-4 の `karen_mystery_choice` 演出シーケンスには:
- `bgm_change → wait → flash → overlay_text → wait → mono → wait`

の命令が含まれているが、`.karen-climax` クラスを付与・除去するステップが **どこにも存在しない**。

`direction_script.md` の `executeDirectionCmd()` に `karen-climax` を制御する命令（例: `add_class` / `climax_start` コマンド）は定義されておらず、演出スクリプトから `.karen-climax` を発火させる手段がない。

**修正方針（推奨）:** 演出スクリプト側に `.karen-climax` クラスを付与・除去するフックを追加するか、`direction_script.md` の命令セットに `add_class` / `remove_class` コマンドを追加する。または `karen_mystery_choice` の `direction` ステップ内で直接 DOM 操作するコールバックを定義する。

---

## 改善推奨

### 改善1: `body[data-yukiwarisou="found"]` の設定コードが演出スクリプトに存在しない

`visual_spec.md` §5-3 には `body[data-yukiwarisou="found"]` セレクタを使った「ゆきわりそう」ハイライト強化演出が定義されている。しかし `direction_script.md` §2-3 の `_onYukiwarisouDiscovered()` 関数内にこの属性を設定するコードがない。

`visual_spec.md` §6-2 のJS実装例には:
```javascript
document.body.dataset.yukiwarisou = GS.mysteryClues.includes('yukiwarisou') ? 'found' : '';
```
が示されているが、これが呼ばれる箇所が演出スクリプト側に記載されていない。`_onYukiwarisouDiscovered()` 内か `applyMysteryPhase()` 内のどちらかに明示的に追加すべき。

### 改善2: `.karen-resolve` の付与タイミングと `karen-climax` 除去タイミングが未定義

`visual_spec.md` §4-2 に `.karen-resolve` クラスの収束アニメーションが定義されているが、これを付与するJSコードもそのタイミングも `direction_script.md` 内で言及されていない。`karen_zange_response` 後なのか、エンディング遷移直前なのか不明。

### 改善3: `glitch-scanline` キーフレームが演出エンジンの `filter` 変数を参照しているが、クラスが孤立している

`visual_spec.md` §2-2 の `glitch-scanline` アニメーションは `var(--mystery-hue)` と `var(--mystery-contrast)` を参照しており、ミステリーフェーズ変数との統合設計として良好。しかし前述の問題1の通り、このアニメーションを使用する `.mystery-glitch.medium` / `.mystery-glitch.severe` クラスが演出エンジンから到達できない。フィルター変数を活用した設計は保持しつつ、クラス名を修正することで機能させるべき。

### 改善4: `mystery-crack-slide` キーフレームに実装バグの可能性

`visual_spec.md` §1-4 の `mystery-crack-slide` アニメーション:

```css
@keyframes mystery-crack-slide {
  0%        { left: -100%; right: 100%; }
  40%, 60%  { left: 0; right: 0; }
  100%      { left: 100%; right: -100%; }
}
```

`::after` 疑似要素に `left` / `right` を同時に操作しているが、親要素に `overflow: hidden` がなければ要素外に飛び出し、`position: absolute` の `left: -100%` の基準が親ではなく `positioned` 祖先になる場合がある。`.titlebar` に `position: relative` と `overflow: hidden` が設定されているか確認が必要。また `left: 100%; right: -100%;` の組み合わせは論理的に幅が 200% 相当になり意図通りか確認を要する。`transform: translateX()` を使ったほうが安全。

### 改善5: `.karen-climax` の `transition: filter 0.3s ease` と `animation: glitch-scanline` の競合

`visual_spec.md` §4-1:
```css
.karen-climax {
  filter: hue-rotate(25deg) contrast(1.15) saturate(1.3);
  animation: glitch-scanline 1.5s step-end infinite;
  transition: filter 0.3s ease;
}
```

`animation` と `transition` が同じ `filter` プロパティに同時適用されている。`animation` はアニメーション仕様上 `transition` より優先されるため `transition` は実質無効になる。クラス付与時のスムーズなフィルター遷移が必要なら、ラッパー要素を分離するか、フェーズイン専用のCSSを別途定義すべき。

### 改善6: `num-spin-up` アニメーションのパフォーマンス

`visual_spec.md` §5-2:
```css
@keyframes num-spin-up {
  0%   { transform: translateY(0); opacity: 1; }
  49%  { transform: translateY(-50%); opacity: 0.6; }
  50%  { transform: translateY(50%); opacity: 0.6; }
  100% { transform: translateY(0); opacity: 1; }
}
```

`animation-duration: 0.15s` で `linear infinite` という設定は 1秒間に6.7回ループする非常に高速なアニメーションで、クライマックスシーン中に複数の `.stat-num.runaway` 要素が同時に存在する場合、コンポジタースレッドの負荷が高い。`transform` のみで処理されるため `paint` は発生しないが、要素数が増える場合は `will-change: transform` を追加すべき。

---

## 良かった点

### 1. CSS custom properties の段階的オーバーライド設計が演出連携に適している

`--mystery-hue` / `--mystery-contrast` / `--mystery-glitch-opacity` をCSS変数として定義し、フェーズごとに値を変える設計は、演出エンジン側からJSで変数を直接上書きする（例: `document.documentElement.style.setProperty('--mystery-hue', '20deg')`）ことも将来的に可能にする柔軟な設計。演出の細かいチューニングをCSSとJSの両方から行える。

### 2. `prefers-reduced-motion` の完全対応がアクセシビリティと演出の両立を実現

アニメーション停止後も静的なカラー変化でミステリー状態を伝える代替設計が明確に定義されている。これは演出の核心（「何かがおかしい」感覚）を動きなしでも維持する工夫であり、設計上の判断として適切。

### 3. `.karen-avatar` の3段階変化とJSトリガーの明示

通常 → `.unsettled`（Phase 2連動） → `.revealed`（JSで手動付与）という段階が明確で、演出スクリプトの `mystery_update` 命令タイミングと概念的に整合している。`karen-reveal` アニメーションの `cubic-bezier(0.34, 1.56, 0.64, 1)` はバネ感のある演出として花蓮ルートの感情的クライマックスにマッチしている。

### 4. エンディング別背景の差別化が各ルートの感情に即している

贖罪エンドの `#1e1020`（紫みのある暗闇）、沈黙エンドの `#080808`（漆黒）、既読エンドの `#0e1428`（藍）という色選定は、各エンドの感情（罪悪感・断絶・余韻）と対応しており、演出スクリプトの感情設計と方向性が一致している。

### 5. SNS違和感演出の要素（バッジ・数値暴走・トレンド）が具体的で実装可能

`.chatapp-talk-badge.abnormal`・`.stat-num.runaway`・`.y-trend-item.karen-trend` のように、HTMLクラス名レベルまで具体化されており、実装担当が迷わずJSから呼び出せる設計になっている。

### 6. 実装上の注意点（§6-3）が演出連携上の落とし穴を先回りして記述している

`data-mystery` の更新タイミング、`filter` の CSS specificity 競合、`.desktop::before` の `position` 要件など、演出実装時に実際に踏む可能性の高い問題が事前に文書化されている点は、演出エンジンとの統合作業を大幅に助ける。

---

## サマリー

| 項目 | 評価 |
|------|------|
| グリッチクラス名の整合 | **NG** — `mild/medium/severe` vs `low/medium/high` が不一致 |
| `applyMysteryPhase()` との連携 | **NG** — class vs data属性の二重管理が衝突する |
| `karen-climax` 発火の演出連携 | **NG** — 演出スクリプトからの付与ルートがない |
| `data-route` 切り替えタイミング | **OK** — §6-2 のJS例が演出設計と整合 |
| パフォーマンス | **概ね良好** — `transform`/`opacity` 中心、`num-spin-up` の高速ループのみ要注意 |
| `prefers-reduced-motion` 対応 | **優良** — 完全対応 |
| 変数・クラス命名規則の明確さ | **良好** — 実装者が追いやすい |

**修正必須項目は問題1・2・3の3件。** 特に問題1（クラス名不一致）は演出が一切動かない根本的な不整合であり、最優先で統一が必要。
