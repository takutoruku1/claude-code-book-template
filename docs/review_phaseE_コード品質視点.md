# Phase E レビュー（コード品質視点）

## 総合評価: C

CSS整合性は概ね適切だが、タイマー設計に重大なバグ（retryButtonDelay）があり、プレイヤー体験を根本から壊す可能性がある。DOM クリーンアップの欠落も対処必須。

---

## 重大な問題点

### 1. `retryButtonDelay` のタイマー基点ミス（chinmoku / zange 共通）

**重篤度: 致命的**

`retryButtonDelay` のタイマーは `showEnding()` 呼び出し時点（= 絶対時間ゼロ）から計測されるが、エンディング演出（blackout + monologue + chinmokuEffect/zangeTyping）はその後 数十秒かけて展開される。

#### chinmoku の場合

| イベント | 絶対時刻 |
|---|---|
| showEnding() 呼び出し | 0ms |
| blackout 終了 | 4,000ms |
| monologue 最終行表示 (13行×2000ms) | 30,000ms |
| `_showChinmokuEffect()` 開始 | 30,000ms |
| `mysteryMessage` 表示 (silenceDuration=10000ms) | 40,000ms |
| **`btn-retry` 表示 (retryButtonDelay=10000ms)** | **10,000ms** ← バグ |

ボタンが mysteryMessage より **30秒早く** 出現する。プレイヤーが演出途中でゲームをリセットできてしまう。

#### zange の場合

| イベント | 絶対時刻 |
|---|---|
| zangeTyping 開始 | 33,600ms |
| `btn-retry` 表示 (retryButtonDelay=5000ms) | 5,000ms ← バグ |

タイピング演出の開始より **28.6秒早く** ボタンが出る。

#### 修正方法

`retryButtonDelay` のタイマーを `blackoutMs` の中（モノローグの後処理ブロック）に移動し、`afterMonologue` を基点として計算する。

```js
// 修正後（blackoutMs setTimeout の内側、afterMonologue 定義後に置く）
var retryDelay = E.retryButtonDelay != null ? E.retryButtonDelay : 5000;
setTimeout(function() {
  var btn = screenEnding.querySelector('.btn-retry');
  if (btn) btn.style.display = '';
}, afterMonologue + retryDelay);
```

また `ends.js` の `chinmoku.retryButtonDelay` は `silenceDuration` に合わせて `10000` のままとする（基点が変わるため相対値として意味を持つ）。コメントの「retryButtonDelay と同値にすること」は基点が揃ったうえで成立する。

---

### 2. 動的 DOM 要素のクリーンアップ欠落

**重篤度: 高**

`_showZangeTyping()` が生成する `.zange-area > .zange-typing-wrap` と、`_showChinmokuEffect()` が生成する `.ending-mystery-msg` は、`screenEnding.className = ''` では削除されず `endSub.innerHTML = ''` の対象外でもない。

- `retryGame()` は `classList.remove('active')` のみ実行し innerHTML をリセットしない
- `showEnding()` の先頭に `screenEnding.className = ''` はあるが DOM の中身は消えない

**影響範囲:** デバッグモードで同一エンドを2回呼ぶと `.zange-typing-wrap` が2重に生成される。`.ending-mystery-msg` はガードなしで毎回 append されるため複数個残留する。

#### 修正方法

`showEnding()` の `screenEnding.className = ''` の直後に動的要素のクリーンアップを追加する。

```js
// 追加
var oldZange = screenEnding.querySelector('.zange-area');
if (oldZange) oldZange.parentNode.removeChild(oldZange);
var oldMystery = screenEnding.querySelector('.ending-mystery-msg');
if (oldMystery) oldMystery.parentNode.removeChild(oldMystery);
```

---

### 3. `screenEnding` の null チェック欠落

**重篤度: 中**

```js
const screenEnding = document.getElementById('screen-ending');
screenEnding.className = '';  // screenEnding が null の場合 TypeError
```

`screen-ending` は静的 HTML に存在するため通常は問題ないが、防衛的コーディングとして null チェックを追加すべき。

```js
const screenEnding = document.getElementById('screen-ending');
if (!screenEnding) return;
```

---

## 改善推奨

### 4. `noReplyEffect` 対象要素が DOM に存在しない

`chatInput` / `.chat-input` を探す処理（line 566-570）だが、`buzzutter_v2.html` にはその ID もクラスも存在しない。null チェック（`if (chatInput)`）で握りつぶしているため実行時エラーにはならないが、演出が無音で失敗する。対象要素の ID を実際の DOM に合わせて修正するか、`noReplyEffect` が機能していないことを設計書に明記すること。

### 5. `senderRevealed` が未実装

`endings.js` line 302 に `senderRevealed: '——カ'` と逆再生アニメーションの仕様が記載されているが、`_showChinmokuEffect()` ではまったく参照されていない。設計書の仕様がコードに反映されておらず、機能として欠落している。対処が不要なら `endings.js` からフィールドを削除しデータの整合を取ること。

### 6. `const` / `var` の混在スタイル

`showEnding()` の冒頭で `const E`, `const karenEnds`, `const screenEnding` を使いながら、直後の DOM 取得から `var` に切り替わる。既存コードで `const` が多数使われており（59件 vs var 36件）、スタイルとして統一が望ましい。ただし setTimeout クロージャ内では `var` の IIFE パターンを意図的に使っているケースもあるため、一括置換より個別判断が適切。

### 7. `deleteChars` の削除速度計算

```js
setTimeout(del, 200 / Math.max(typingText.length, 1));
```

`typingText` が21文字の場合、1文字あたり約9.5ms で削除。`200 / 21 ≈ 9.5ms` はブラウザのタイマー最小精度（4〜15ms）に近く、期待通りの速度にならない可能性がある。`200 / length` ではなく固定値（例: `30ms`）の方が挙動が安定する。

### 8. `karenTypingLoops` の重複表示（軽微）

ループで生成するインジケーターは 0ms/1600ms/3200ms に出現し各 1600ms 後に削除される（最後は 4800ms に削除）。`karenResponse` は `loopDelay(4800) + 1000 = 5800ms` から開始するため重複はない。ただしループ数が 4 以上に設定された場合はインジケーター追加の DOM 操作が重なりうる。現状 `karenTypingLoops: 3` 固定なので問題なし。変更時は注意。

---

## 良かった点

1. **CSS 特異度の設計が正確**: `.ending-chinmoku .ending-text`（特異度 0,2,0）が `.ending-text`（0,1,0）より高いため、chinmoku 専用アニメーション（`chinmoku-text-float`）が正しく適用される。後者が前者より後に定義されていても特異度で勝る設計が適切。

2. **`@keyframes ending-line-fadein` の重複なし**: CSS 全体を通じて同名の keyframe 定義は1箇所のみ（line 4432）。`.karen-reply-line` も同 keyframe を共有しており、コードの重複を避けている。

3. **`#screen-ending .ending-sub` のスコープ指定**: 既存の `.ending-sub`（line 1883）の全体スタイルを壊さず、エンディング画面内でのみ flex レイアウトに変える ID セレクター戦略が適切（特異度 1,1,0 で安全に上書き）。

4. **モノローグの null/undefined ガード**: `E.monologue || []`、`E.monologueInterval || 1500` など、欠損フィールドへの防衛的フォールバックが一貫して実装されている。

5. **IIFE によるクロージャの適切な使用**: forEach 内で `setTimeout` をスケジュールする際の変数捕捉を IIFE で正しく処理しており、遅延実行時に最終値が使われるバグを回避している。

6. **`endSub` の null チェック**: モノローグ表示の setTimeout 内で `if (!endSub) return` を実施しており、DOM が存在しない状態での実行を防いでいる。

7. **`XSS リスク最小**: `mysteryMessage.text` が `innerHTML` に挿入されるが、このデータは `endings.js` のハードコード値であり、ユーザー入力は一切経由しない。実質的な XSS リスクはない。

---

## サマリー

| 分類 | 件数 |
|---|---|
| 重大な問題点（対処必須） | 3件（タイマーバグ / DOM残留 / null チェック） |
| 改善推奨 | 5件 |
| 良かった点 | 7件 |

最優先で対処すべきは **retryButtonDelay のタイマー基点ミス**（chinmoku/zange 両方に影響）。次点で **動的 DOM 要素のクリーンアップ欠落**。
