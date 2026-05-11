# レビュー: Phase B フック実装 — 機能視点

**レビュー対象:** Phase B で追加された4つのフック（body.dataset.route / applyMysteryPhase() / body.dataset.flashbackPhase / セーブ・ロード）
**レビュー担当視点:** 機能・動作の正確さ
**レビュー日:** 2026-05-11

---

## 総合評価: B

実装の方向性は正しく、主要経路では意図どおり動作する。ただし「フック①の resetGame を通らないロード経路」「フック②の mystery フェーズ呼び出し引数の不整合」「フック③のカードめくり経由フラッシュバックでの dataset 更新漏れ」の3点に動作上の懸念がある。バグ化するかどうかはシナリオデータの使い方次第だが、今後のシナリオ拡張で踏む可能性が高い。

---

## 重大な問題点

### 問題1: フック② — `applyMysteryPhase` に渡す引数と本体ロジックの不整合

**場所:** `js/game-logic.js` 57〜59行 / `js/chat-engine.js` 617〜632行

`handleCardClick` 側の呼び出し:
```js
GS.mysteryClues.push(m.mysteryFlag);
applyMysteryPhase(GS.mysteryClues.length); // push 後なので 1, 2, 3 が渡る
```

`applyMysteryPhase` 本体の resolvedPhase 計算:
```js
const count = GS && GS.mysteryClues ? GS.mysteryClues.length : 0;
const resolvedPhase = phase !== undefined ? phase : (count >= 3 ? 3 : count);
```

引数 `phase` が渡された場合は `phase` をそのまま `resolvedPhase` に使う。  
push 後の length を渡しているので count=1 → phase=1、count=2 → phase=2、count=3 → phase=3 となり、**現状のシナリオでは 1:1 で一致している。**

しかし `mystery_update` direction からの呼び出し:
```js
applyMysteryPhase(); // 引数なし → count で計算
```
こちらは引数なしで呼ぶため、count ベースのフォールバック `(count >= 3 ? 3 : count)` が使われる。  
**count >= 3 の場合に phase 3 に固定されるため count=4 の将来拡張に対応できない。**  
今すぐ壊れるわけではないが、`mysteryFlag` の種類が4つ以上に増えた場合にフェーズが正しく進まなくなる。

**推奨修正:** `resolvedPhase` の計算を `Math.min(count, 3)` に統一し、引数 `phase` は廃止するか明示的な上書き用途に限定する。

---

### 問題2: フック③ — カードめくりトリガーのフラッシュバックで `dataset.flashbackPhase` が更新されない

**場所:** `js/game-logic.js` 61〜63行 / `js/chat-engine.js` 248〜250行

`handleCardClick` 内:
```js
if (m.flashback3Trigger) {
  setTimeout(() => triggerFlashback(3, null), 2500);
}
```

`triggerFlashback` の先頭:
```js
GS.flashbackPhase = Math.max(GS.flashbackPhase, phase);
document.body.dataset.flashbackPhase = GS.flashbackPhase; // フック③
```

**`triggerFlashback` を通る経路では dataset は正しく更新される。**  
ただし `GS.flashbackPhase` を直接書き換える他のコードパスが将来追加された場合、フック③が漏れる。現時点では `GS.flashbackPhase` を書き換えている箇所は `initGS`（リセット）と `triggerFlashback` のみで安全だが、以下を確認した：

- `handleTrigger` の `flashback2` / `flashback3` アクション → `triggerFlashback` 経由 → 問題なし
- `handleCardClick` の `flashback3Trigger` → `triggerFlashback` 経由 → 問題なし
- `loadFromSlot` → 直接 `document.body.dataset.flashbackPhase = GS.flashbackPhase` → 問題なし

**現状はすべての経路で `triggerFlashback` を経由するか、ロード時に明示的に復元しているため漏れはない。**  
ただし `GS.flashbackPhase` の直接代入で dataset を更新しないコードパスは 0 箇所であることを確認した（`app-core.js` の `initGS` は 0 にリセットするだけで dataset 更新不要）。

---

### 問題3: フック① — `loadFromSlot` は `resetGame` を通らないが、dataset.route は正しく設定されているか

**場所:** `js/save-manager.js` 291〜294行

```js
// Phase B: mystery フェーズ連動 — ロード後にデータセット属性を復元
document.body.dataset.route = GS.route;
document.body.dataset.flashbackPhase = GS.flashbackPhase || 0;
if (typeof applyMysteryPhase === 'function') applyMysteryPhase(GS.mysteryClues ? GS.mysteryClues.length : 0);
```

`loadFromSlot` は `resetGame` を呼ばない独立した経路だが、**3つのデータセット属性をすべて末尾で明示的に設定しており、GS 復元後に dataset を更新している。**  
処理順序も `GS = data.GS` の代入（166行）より後に dataset 更新（292〜294行）が行われており、**GS 復元後の更新順序は正しい。**

軽微な注意点として `applyMysteryPhase` に渡す引数は `GS.mysteryClues.length`（0〜N の整数）であり、問題1と同様に count>=3 の場合に `mystery-3` に固定される。  
現時点のシナリオデータに mysteryFlag が3種類以下であれば問題ない。

---

## 改善推奨

### 推奨1: `resetGame` 内に `applyMysteryPhase(0)` 呼び出しを追加する

`resetGame` では `initGS(route)` の直後に `dataset.route` を更新しているが、`applyMysteryPhase(0)` が呼ばれていない。  
これにより、前のルートで `mystery-N` クラスが body に残ったまま新ルートが開始される可能性がある。  
`_lastMysteryPhase` が 0 にリセットされないため、新ルートで `_onMysteryPhaseUp` が誤発火するリスクもある。

```js
initGS(route);
document.body.dataset.route = route;
window._lastMysteryPhase = 0;         // 追加推奨
document.body.classList.remove('mystery-0','mystery-1','mystery-2','mystery-3');
document.body.classList.add('mystery-0'); // 追加推奨
```

または `applyMysteryPhase(0)` を1行呼ぶだけで同効果を得られる。

### 推奨2: `mystery_update` direction での `applyMysteryPhase()` 呼び出しは引数を渡す形に統一

`chat-engine.js` 356行:
```js
case 'mystery_update':
  if (typeof applyMysteryPhase === 'function') applyMysteryPhase(); // 引数なし
```

引数なしでも count ベースで動くが、`handleCardClick` 側が length を明示的に渡している一方でこちらは渡していないため、将来的な混乱を招く。  
`applyMysteryPhase(GS.mysteryClues ? GS.mysteryClues.length : 0)` に統一することを推奨する。

### 推奨3: スクリプト読み込み順の確認（グローバル参照リスク）

読み込み順（buzzutter_v2.html 982〜1005行）:
```
982: js/scenario.js
983: js/postOptions.js
984: js/endings.js
985: js/app-core.js
986: js/chat-engine.js   ← applyMysteryPhase を定義
...
996: js/game-logic.js    ← applyMysteryPhase を呼び出す
...
1001: js/ui.js           ← resetGame（dataset.route 更新）を定義
1005: js/save-manager.js ← loadFromSlot（applyMysteryPhase を呼び出す）
```

`applyMysteryPhase` は `chat-engine.js`（986行）で定義され、呼び出し元の `game-logic.js`（996行）・`save-manager.js`（1005行）より先に読み込まれている。  
`typeof applyMysteryPhase === 'function'` のガードも各呼び出し箇所で施されているため、**undefined エラーは発生しない。現状の読み込み順は安全。**

---

## 良かった点

1. **フック② の `typeof applyMysteryPhase === 'function'` ガード** — 読み込み順に依存しない安全な参照になっており、将来的にファイル順を変えても壊れない設計。

2. **フック③ の `Math.max` 単調増加保証** — `GS.flashbackPhase = Math.max(GS.flashbackPhase, phase)` により、フラッシュバックフェーズが後退しない。セーブ・ロード後もこの値が GS に保持されており、ロード時に正しく復元される。

3. **ロード処理の dataset 更新位置** — `loadFromSlot` で GS 復元後の末尾（291〜294行）にまとめて dataset 更新・`applyMysteryPhase` 呼び出しを置いており、復元順序が明確で追跡しやすい。

4. **`mysteryClues.push` の単一箇所管理** — `GS.mysteryClues.push` は `handleCardClick` 内の1箇所のみに存在することを全 JS ファイルで確認した。シナリオデータ（`scenario.js`）が `mysteryFlag` プロパティをカード素材に持つ設計により、フックの漏れが構造的に起きにくい。

5. **`resetGame` の経路網羅性** — ルート開始の全経路（初回: `startMainModeAutoRoute` → `resetGame`、デバッグモード選択: `startRoute` → `resetGame`、リスタート: `retryGame` → `resetGame`）が `resetGame` を通ることを確認した。ロードのみが独立経路だが、上記のとおり個別に対処済み。
