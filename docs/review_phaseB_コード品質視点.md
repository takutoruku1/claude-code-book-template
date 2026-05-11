# レビュー: Phase B 追記箇所 — コード品質視点

**レビュアー:** コード品質・保守性・既存コードとの整合性担当  
**レビュー日:** 2026-05-11  
**対象フック:** body.dataset.route / applyMysteryPhase() / body.dataset.flashbackPhase / セーブ・ロード復元

---

## 総合評価: B

既存コードのスタイルと大きく外れた箇所はなく、即座にゲームを壊すバグは確認されなかった。ただし、`applyMysteryPhase` の引数設計に一貫性の問題があり、`save-manager.js` への追記は責任分離の観点から疑問が残る。以下に詳細を示す。

---

## 重大な問題点

### 1. `applyMysteryPhase()` の引数が呼び出し元によって非一貫 (game-logic.js / chat-engine.js)

**`game-logic.js` 59行目（handleCardClick 内）:**
```js
if (typeof applyMysteryPhase === 'function') applyMysteryPhase(GS.mysteryClues.length);
```

**`chat-engine.js` 356行目（executeDirectionCmd / mystery_update 命令）:**
```js
if (typeof applyMysteryPhase === 'function') applyMysteryPhase();
// → 引数なし。内部で count を自力計算する
```

**`save-manager.js` 294行目（loadFromSlot 末尾）:**
```js
if (typeof applyMysteryPhase === 'function') applyMysteryPhase(GS.mysteryClues ? GS.mysteryClues.length : 0);
```

`applyMysteryPhase` の内部実装（`chat-engine.js` 617〜632行目）は `phase` 引数が `undefined` のとき `GS.mysteryClues.length` を自動参照するフォールバックを持っている。そのため「引数あり版」と「引数なし版」が混在しても動作はするが、**呼び出し規約が統一されていない**。

具体的な問題: `game-logic.js` では `GS.mysteryClues.push(m.mysteryFlag)` の直後なので `length` はすでに更新済み。引数で渡しても内部フォールバックと同じ値になる。一方で `mystery_update` 命令は引数なしで呼ぶ。呼び出し側ごとに異なる形式を使う理由が不明であり、将来の変更時に混乱を招く。

**推奨:** 引数なし形式 `applyMysteryPhase()` に統一し、内部で常に `GS.mysteryClues.length` を参照させる。引数を使う必要があるなら全呼び出し箇所で統一して使う。

---

### 2. `save-manager.js` への追記は責任範囲が適切でない可能性

`loadFromSlot()` の末尾（291〜294行目）に以下が追記されている:

```js
// Phase B: mystery フェーズ連動 — ロード後にデータセット属性を復元
document.body.dataset.route = GS.route;
document.body.dataset.flashbackPhase = GS.flashbackPhase || 0;
if (typeof applyMysteryPhase === 'function') applyMysteryPhase(GS.mysteryClues ? GS.mysteryClues.length : 0);
```

`save-manager.js` の責任は「セーブデータの入出力」であり、DOM（`body.dataset`）を直接操作することはこのファイルの本来の役割ではない。`resetGame()` が `initGS()` 直後に `body.dataset.route` を設定するように、**ロード後の状態復元も `ui.js` の `loadFromSlot` 呼び出し元、または `resetGame` と対になる専用の復元ヘルパーで行うのが設計上の一貫性として自然**である。

現状は `save-manager.js` が `typeof applyMysteryPhase === 'function'` でガードしているとはいえ、UI層の関数（`applyMysteryPhase`、`refreshDesktopNotifs`）への依存が既に存在しており、今回の追記はその依存をさらに増やす形となっている。即座の破壊はないが保守性の低下につながる。

---

## 改善推奨

### 3. `typeof applyMysteryPhase === 'function'` ガードの評価

既存コードでの他モジュール参照ガードの実例:
- `chat-engine.js` 162行目: `if (typeof _showPendingChoicesInWidget === 'function')`
- `chat-engine.js` 165行目: `if (typeof showProtagMsg === 'function')`
- `game-logic.js` 279行目: `if (typeof setDesktopNotif === 'function')`
- `game-logic.js` 381行目: `if (typeof bringToFront === 'function')`

これらと比較すると、`typeof applyMysteryPhase === 'function'` ガードは**既存スタイルに完全に則っており適切**。`applyMysteryPhase` は `chat-engine.js` で定義され `game-logic.js` と `save-manager.js` の両方から参照されるため、ガードは必要かつ正当である。問題はガードの有無ではなく、前述の引数の非一貫性にある。

### 4. dataset 更新タイミングと副作用

**`ui.js` の `resetGame()` 671行目:**
```js
initGS(route);
document.body.dataset.route = route; // Phase B: mystery フェーズ連動
buildFlowMap(route);
```

`initGS(route)` の直後という挿入位置は適切。`buildFlowMap` の前に `dataset.route` を設定しても `buildFlowMap` はこの属性を参照しないため副作用はない。また、`resetGame` はゲーム初期化の中心であり、CSS の `[data-route="midori"] { ... }` 等のセレクタが即座に適用されるタイミングとしても問題ない。レンダリングへの悪影響はなし。

**`chat-engine.js` の `triggerFlashback()` 250行目:**
```js
GS.flashbackPhase = Math.max(GS.flashbackPhase, phase);
document.body.dataset.flashbackPhase = GS.flashbackPhase; // Phase B: mystery フェーズ連動
```

`GS.flashbackPhase` 更新の直後に dataset を同期する形は一貫しており、適切な位置。ただし `GS.flashbackPhase` が `0` の初期値を持つかどうかは `initGS` の実装に依存する。もし `undefined` の場合、`Math.max(undefined, phase)` は `NaN` になる。既存の `initGS` で `flashbackPhase: 0` が初期化されているかを確認することを推奨する（今回レビュー範囲外のため未確認）。

### 5. コメント文体の整合性

追記コメントは以下の形式:
```js
// Phase B: mystery フェーズ連動
// Phase B: mystery フェーズ連動 — ロード後にデータセット属性を復元
```

既存コードのインラインコメント例:
```js
// _allPostedContents はルートをまたいで保持するためリセットしない
// グローバルメモに依頼者情報付きで保存（ルートをまたいで保持）
// チャトルのトーク画面を開いている間だけ主人公の返信を送信（保留）
```

既存コードは「何をするか」「なぜそうするか」を日本語で簡潔に説明するスタイル。Phase B のコメントは `Phase B:` というプレフィックスでフェーズ識別子を付けている点が若干異なるが、**「フェーズ管理のため意図的に付与した識別子」として許容範囲内**。ただし実装が安定したら `Phase B:` プレフィックスは削除し、意図の説明だけを残すのが望ましい。

`save-manager.js` の `// Phase B: mystery フェーズ連動 — ロード後にデータセット属性を復元` は、他の3箇所と比べて説明が最も詳細であり、唯一ロードという文脈を明示している。この差異は許容範囲内。

---

## 良かった点

1. **インデントと命名規則の整合性が高い。** 4ファイルすべてで既存のスペース2インデント、`camelCase` 関数名、`dataset.xxx` の小文字キャメル形式が正しく踏襲されている。

2. **`typeof` ガードが既存パターンに揃っている。** `game-logic.js`・`save-manager.js` での `applyMysteryPhase` 参照は、プロジェクト全体で採用されているクロスモジュール参照の書き方と一致している。

3. **`triggerFlashback` の挿入位置が論理的に正しい。** `GS.flashbackPhase` の更新直後に `dataset` を同期することで、状態と DOM 属性のズレが生じない設計になっている。

4. **`loadFromSlot` 末尾への3行追記は最小限。** 既存の巨大な復元ロジックを壊さず、末尾にまとめて追記している点は変更の局所性として評価できる。

---

## アクションサマリー

| 優先度 | 箇所 | 対処内容 |
|---|---|---|
| 高 | `game-logic.js` 59行目 / `save-manager.js` 294行目 | `applyMysteryPhase()` の引数を引数なし形式に統一（または全箇所で引数あり形式に統一） |
| 中 | `save-manager.js` 292〜294行目 | `body.dataset` 操作と `applyMysteryPhase` 呼び出しを `ui.js` 側（ロード呼び出し元）に移動することを検討 |
| 低 | 全4箇所のコメント | 実装が安定後、`Phase B:` プレフィックスを除去し目的説明だけを残す |
| 確認 | `initGS` | `flashbackPhase: 0` の初期化が存在するかを確認 |
