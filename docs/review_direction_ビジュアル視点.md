# レビュー: direction_script.md — ビジュアル・デザイン視点

> レビュー日: 2026-05-11  
> レビュアー: ビジュアル・デザイン担当エージェント  
> レビュー対象: `docs/direction_script.md`（演出・実装担当エージェント作成）  
> 参照: `docs/visual_spec.md`

---

## 総合評価: **B**

演出命令セットとして機能的な設計であり、シーン意図も明確で読みやすい。
ただし、ビジュアル仕様書（`visual_spec.md`）との命名体系の乖離・グリッチ強度クラスの不整合・ミステリーフェーズ制御の二重実装問題が散見され、このまま実装に進むとCSSの競合・ビジュアルの不統一が発生するリスクがある。修正は限定的だが、優先度の高い対応が3点ある。

---

## 重大な問題点（ビジュアルとの不整合・実装上の問題）

### 問題1: グリッチ強度クラス名の不整合（命名衝突）

**深刻度: 高**

`direction_script.md` §1-2 では `glitch` 命令の `intensity` パラメータとして以下を定義している。

```
"intensity": "low" / "medium" / "high"
```

これに対応するCSSクラスとして `§3-2` で以下を定義している。

```css
.glitch-low    { animation: glitchLow   ... }
.glitch-medium { animation: glitchMedium ... }
.glitch-high   { animation: glitchHigh  ... }
```

一方、`visual_spec.md` §2-3 では強度クラス名として以下を定義している。

```css
.mystery-glitch.mild    { animation: glitch-text-shift ... }
.mystery-glitch.medium  { animation: glitch-text-shift, glitch-scanline ... }
.mystery-glitch.severe  { animation: glitch-block, glitch-scanline ... }
```

**問題点:**
- 強度の段階数が異なる（direction: 3段階 `low/medium/high` vs visual_spec: 3段階 `mild/medium/severe`）
- `medium` はどちらにも存在するが、アニメーション定義が別物（`glitchMedium` vs `glitch-text-shift + glitch-scanline`）
- `high` と `severe`、`low` と `mild` が別クラスとして独立定義されており、同一要素に両方が付与された場合に競合する
- visual_spec では `.mystery-glitch` を基底クラスとして使う設計だが、direction_script の `directionGlitch()` 実装は `glitch-${intensity}` クラスのみを付与し `.mystery-glitch` を付与しない

**修正方針:**
`direction_script.md` の `intensity` パラメータを `mild/medium/severe` に統一し、`directionGlitch()` 実装を以下に修正する。
```javascript
target.classList.add('mystery-glitch', `${d.intensity || 'medium'}`);
setTimeout(() => target.classList.remove('mystery-glitch', d.intensity || 'medium'), d.durationMs || 600);
```
既存スクリプト内の `intensity: 'low'` 記述を `intensity: 'mild'` に、`intensity: 'high'` を `intensity: 'severe'` に全置換すること。

---

### 問題2: ミステリーフェーズ制御の二重実装（body クラス vs data 属性）

**深刻度: 高**

`direction_script.md` §3-2 では `applyMysteryPhase()` が `body` の **クラス** を操作している。

```javascript
document.body.classList.remove('mystery-0', 'mystery-1', 'mystery-2', 'mystery-3');
document.body.classList.add(`mystery-${phase}`);
```

そのCSSセレクタも `body.mystery-1 .protagBubble` 等、クラス依存で記述されている。

一方、`visual_spec.md` §1-4 では **データ属性** を使う設計を採用している。

```javascript
document.body.dataset.mystery = Math.min(GS.mysteryClues.length, 3).toString();
```

そのCSSセレクタは `body[data-mystery="1"]` 等、属性セレクタ依存で記述されている。

**問題点:**
- 同じ状態を2種類の方法で表現しているため、両方のCSSがHTML上で競合する
- `body.mystery-3` のスタイルと `body[data-mystery="3"]` のスタイルが並存すると、一部の演出（例: `.desktop` の `filter` 設定）が二重適用される可能性がある
- `visual_spec.md` の `.protagBubble` 関連スタイルは `body[data-mystery]` セレクタを使っておらず、`direction_script.md` 側が独自に `body.mystery-N .protagBubble` を定義している。後者は前者と重複しうる

**修正方針:**
`direction_script.md` 側の `applyMysteryPhase()` を `visual_spec.md` の設計に合わせ、データ属性方式に統一する。

```javascript
function applyMysteryPhase() {
  const count = GS.mysteryClues ? GS.mysteryClues.length : 0;
  const phase = count >= 3 ? 3 : count;
  document.body.dataset.mystery = phase.toString();
  // ... 以降のフェーズ上昇コールバックは維持
}
```

§3-2 のCSSもすべて `body.mystery-N` → `body[data-mystery="N"]` に書き直すこと。

---

### 問題3: `overlay_text` の背景色が visual_spec のカラーパレットと乖離

**深刻度: 中**

`direction_script.md` §3-2 で定義している `direction-overlay-revelation` の背景色:

```css
.direction-overlay-revelation {
  background: rgba(5, 0, 20, 0.88);
  color: #c4a0ff;
}
```

この `color: #c4a0ff` は visual_spec.md には定義されていない色である。

`visual_spec.md` §1-2 ではミステリー系のアクセント色として `rgba(160, 107, 255, ...)` が多用されており、`#c4a0ff` はやや明るく青みが強い。また `visual_spec.md` §4-1（花蓮クライマックス）ではルートアクセント `#c87890`（ダークローズ）が支配色であるため、クライマックスのオーバーレイに紫寄りの色が使われると花蓮ルートのカラーテーマとの統一感が薄れる。

同様に `direction-overlay-memory` の `color: #a0c8ff` も `visual_spec.md` には登場しない色である。

**修正方針:**
`revelation` スタイルはミステリー系紫 (`rgba(160, 107, 255, 1.0)` = `#a06bff`) を基調としつつ、花蓮ルートのコンテキストで表示される場合はルート変数 `var(--route-accent)` を使うよう検討する。
最低限、`direction-overlay-memory` の青白 `#a0c8ff` を `visual_spec.md §4-2` の収束シーンで使用している色調（`rgba(240, 208, 128, ...)` 系の温色）に揃えることを推奨する。

---

## 改善推奨

### 推奨1: `flash` 命令のカラーに visual_spec の花蓮クライマックス用カラーを反映

`direction_script.md` §2-4 の `k_memo` めくり時に `flash` 命令で使用している色が `#1a0020`（暗紫）であるが、この色は `visual_spec.md` に明示的な定義がない。花蓮ルートの支配色 `#c87890`（ダークローズ）系か、ミステリー系の `rgba(160, 107, 255)` 系のどちらかで統一することが望ましい。

また `#1a0020` は視覚的には非常に暗く、白フラッシュと組み合わせると急激なコントラスト差が生じる。`opacity: 0.7` という設定値と合わせて、プレイ時に過度に攻撃的な視覚体験を与えないかのプロトタイプ検証を推奨する。

### 推奨2: `silence-kidoku` の二重定義を整理

`direction_script.md` §3-2 と §5-3 に `#chatChoices.silence-kidoku` の CSS が2箇所定義されており、値が異なる。

- §3-2: `opacity: 0.35`、`filter` なし
- §5-3: `opacity: 0.2`、`filter: blur(1px)`

実装時にどちらが `main.css` に追記されるかによって見た目が変わる。後者（§5-3）の方が「送信不能」の表現として視覚的に強く、`blur(1px)` による操作不能の示唆も意図と合っているため、§5-3 の定義に統一することを推奨する。§3-2 の重複定義は削除すること。

### 推奨3: `flash-active` クラスによる `desktop` フィルター適用の競合確認

`direction_script.md` §4-3 では `body.flashback-active .desktop { filter: saturate(0.4) brightness(0.85) sepia(0.15); }` を定義している。

一方 `visual_spec.md` §1-4 の Phase 3 では `body[data-mystery="3"] .game-panel, .chat-panel { filter: hue-rotate(20deg) contrast(1.10); }` が定義されており、Phase 3 + フラッシュバック同時発生時に `.desktop` 子孫の `.game-panel` および `.chat-panel` に対して2つの `filter` が親子で重なる。

CSS では子要素のフィルターが親要素のフィルターにネストして適用されるため（完全合成）、意図しない色調になる可能性がある。花蓮ルート Phase 3 でフラッシュバック Phase 3 が発動するシナリオが存在するため、コントラストが非常に強くなるリスクが高い。検証と必要に応じてフラッシュバック中は mystery フィルターを一時停止する制御を追加することを推奨する。

### 推奨4: `glitchHigh` アニメーションの `invert(0.1)` は過剰

`direction_script.md` §3-2 の `@keyframes glitchHigh` に `filter: invert(0.1)` が含まれているが、ダークテーマのゲームでわずかな色反転が入ると背景が予期しない色に見える。`visual_spec.md` の既存グリッチアニメーション（`glitch-block`, `glitch-scanline`）には `invert()` は使用されておらず、一貫性の観点から除去が望ましい。

### 推奨5: `protagBubble.flashback` の CSS が既存スタイルと重複定義の可能性

`direction_script.md` §4-3 で `.protagBubble.flashback` を新規定義しているが、`visual_spec.md` には `.protag-bubble.flashback` という表記（ハイフン区切り）が §2-4 の適用タイミング表に登場する。どちらが実際のクラス名かを統一する必要がある。実装時には `protagBubble`（キャメルケース）か `protag-bubble`（ケバブケース）かを既存HTMLで確認し、不一致があれば修正すること。

---

## 良かった点

### 1. 命令セットのパラメータ設計が詳細で実装しやすい

各命令の JSON スキーマが一貫しており、デフォルト値も明記されているため、実装者がパラメータ意味を推測する必要がない。特に `bgm_change` の `fadeMs` デフォルト値や `flash` の `opacity` デフォルトは的確な値設定である。

### 2. `processDirections()` の逐次実行設計が明確

コールバックチェーンによる逐次実行パターンが明示されており、演出のタイミング制御が透明である。非同期処理が絡む `bgm_change` をノンブロッキングにしつつ、他の命令はブロッキングにする設計判断も適切。

### 3. ルート別の演出強弱のメリハリが秀逸

みどりルートは演出ゼロ・朔は軽量・誠司は中程度・花蓮はフルスペックという段階が設計書から明確に読み取れる。特に「みどりルートは `direction` を追加しない」という明示的な判断は、チュートリアルとしての難易度設計との整合性が取れていて良い。

### 4. 「既読無音」演出（§5）のUI設計が精巧

`kidokuOverlay` の表示/非表示をトランジションで行い、`showUnsentMessage()` で「書いて消す」演出まで定義しているのは、ゲームの核心的な感情体験を細部まで丁寧に設計している証拠。CSS での `.kidoku-cursor-blink` のブリンク実装も既存 `blink` アニメーションを流用しており、コードの一貫性を保っている。

### 5. `mystery_update` 命令の明示的挿入タイミングが適切

ストーリー上の重要な瞬間（DM通知・看板発見）に `mystery_update` を明示挿入することで、UIフェーズの遅延なし更新を保証する設計は正しい。JSの非同期処理タイミングに依存せずに演出が確実に発動する。

### 6. `face` 命令のスタブ実装が適切に整理されている

現時点で立ち絵が実装されていない事実を「スタブ（ログ出力のみ）」として明示し、拡張フックとして残している判断は保守性が高い。将来の立ち絵追加時に `face` 命令のパラメータを変更せずに実装だけ追加できる。

---

*本レビューは `docs/visual_spec.md` v1.0 との整合性を中心に評価した。シナリオの整合性・音響設計の詳細は他担当レビュアーの評価を参照されたい。*
