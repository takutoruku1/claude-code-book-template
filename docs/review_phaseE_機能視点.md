# Phase E レビュー（機能・演出視点）

## 総合評価: B

軽微〜中程度の問題が複数あるが、致命的な動作不全はない。
エンディング分岐の基本フロー・zange/chinmoku 専用演出の骨格は正しく実装されている。
ただし BGM 呼び出しの引数型ミス、noReplyEffect のターゲット選択ミス、chinmoku の `senderRevealed` アニメーション未実装など、
いくつかの問題は実プレイで体験品質に影響する。

---

## 重大な問題点

### 1. `directionBgmChange` の呼び出し引数が不一致（C 相当）

`showEnding()` 内（game-logic.js:517）での呼び出し:
```js
directionBgmChange(E.bgmTrack, E.fadeDuration || 0);
```

しかし `directionBgmChange`（chat-engine.js:384）は**オブジェクト形式 `d` を受け取る**設計:
```js
function directionBgmChange(d) {
  const track  = d.track  || 'silence';
  const fadeMs = d.fadeMs !== undefined ? d.fadeMs : 800;
  ...
}
```

`showEnding` から呼ぶとき、第1引数に文字列 `'ending_piano'` が渡されるため `d.track` は `undefined` になり、
track は常に `'silence'`（=BGMが流れない）になる。エンディング BGM が全エンドで無音になるバグ。

**修正案:**
```js
directionBgmChange({ track: E.bgmTrack, fadeMs: (E.fadeDuration || 0) * 1000 });
```

また ENDINGS の `fadeDuration` は「秒」だが、`directionBgmChange` 内の `fadeMs` は「ミリ秒」の変数名になっている。単位変換（× 1000）も必要。

---

### 2. `noReplyEffect` のターゲット要素が不正（C 相当）

game-logic.js:566-569:
```js
var chatInput = document.getElementById('chatInput') ||
                document.querySelector('.chat-input');
if (chatInput) {
  chatInput.classList.add('disabled');
}
```

buzzutter_v2.html の実際の構造では `chatInput` / `.chat-input` ID・クラスを持つ要素は存在しない。
実装上の入力エリアは `id="chatChoices"` の `div.chat-choices`（buzzutter_v2.html:369）であり、
`chatInput` は見つからないため**演出が無音で失敗する**。

さらに `disabled` クラスに対応する CSS ルールが main.css に存在しない（`.explorer-nav-btn.disabled` のみ定義されており汎用ではない）。
入力欄のグレーアウト演出は jiritu / toutatu / saihan / jizoku で機能しない。

**修正案:**
- セレクタを `document.getElementById('chatChoices')` に変更する。
- `.chat-choices.disabled { opacity: 0.4; pointer-events: none; }` を CSS に追加する。

---

## 改善推奨

### 3. chinmoku の `senderRevealed` 逆再生アニメーションが未実装（B 相当）

ENDINGS データ（endings.js:302-303）:
```js
mysteryMessage: {
  sender: '──────',
  senderRevealed: '——カ',  // 開いた時に右端から1文字ずつ消えて '——カ' だけ残る逆再生アニメ
  text: '翻訳、ありがとうございました。'
}
```

game-logic.js の `_showChinmokuEffect`（line 733-737）は `mysteryMessage.sender` と `.text` のみ表示し、
`senderRevealed` の逆再生アニメーションを一切実装していない。差出人が `'──────'` 固定で表示されるだけになる。
ENDINGS コメントに仕様が明記されているにも関わらず実装が抜けている。

---

### 4. chinmoku の `retryButtonDelay` タイミング設計上の注意（B 相当）

ENDINGS データ（endings.js:296）:
```
// silenceDuration と retryButtonDelay は同値にすること
// 無音が終わった瞬間にボタンが出る = プレイヤーを暗闇に10秒置く
```

`retryButtonDelay: 10000`（ms）は `showEnding()` の起点（関数呼び出し時点）から計測される。
一方 `_showChinmokuEffect` が起動されるのは `blackoutDuration`（4秒）+ モノローグ全行表示後であり、
`silenceDuration`（10秒）はさらにその後から計測される。

実際には `retryButton` は函数呼び出しから 10秒で表示されるが、
`mysteryMessage` が表示されるのは 4秒（blackout）+ モノローグ時間（約26秒：13行 × 2000ms）+ 10秒後になる。
つまりボタンは **mysteryMessage より約 30秒以上早く出現する**可能性があり、
「無音が終わった瞬間にボタンが出る」という設計意図と大きくズレる。

`retryButtonDelay` は `blackoutMs + afterMonologue + silenceDuration` に相当する値に変更するか、
ボタン表示タイミングを `_showChinmokuEffect` 内部から制御するべき。

---

### 5. `zure` エンドで `karenEnds` から除外されているが `resolveKarenEnding` から到達可能（B 相当）

`resolveKarenEnding()`（game-logic.js:467-470）:
```js
function resolveKarenEnding() {
  if (GS.buzz >= 65 && GS.self < 50) return 'zure';
  return 'kidoku';
}
```

花蓮ルートで `buzz >= 65 && self < 50` を満たすと `showEnding('zure')` が呼ばれる。
`zure` は `karenEnds` に含まれないため `body` に `karen-resolve` クラスが付かず、
karen 暴走フィルタが残ったまま zure エンドが表示される可能性がある（karen クライマックス CSS が適用されたまま）。

ENDINGS 仕様上 `zure` はどのルートからも到達可能なため `karen-resolve` を付与すべきかは設計判断だが、
少なくとも `body.karen-climax` の除去は行うべき。

---

### 6. `saku` ルートの `resolveEnding` フォールスルーが `zure` に固定（B 相当）

game-logic.js:455-459:
```js
if (GS.route === 'saku') {
  if (GS.buzz >= 65 && GS.self < 50)           return 'zure';
  if (GS.self >= 60 && GS.flags.kShinonoya)    return 'toutatu';
  return 'zure';  // ← 条件を満たさない場合も zure
}
```

ENDINGS の `toutatu` 条件（endings.js:72）は `selfScore >= 60 かつ kShinonoya=true`。
`kShinonoya` が false かつ buzz 低い場合のフォールスルーが `zure`（ズレエンド）になっているが、
`saihan`（再訪エンド）が適切な可能性がある。設計書との突合が必要。

---

### 7. `karenTypingLoops` インジケーターの表示位置が `zange-area` 直下（B 相当）

`_showZangeTyping` 内（game-logic.js:674-685）でインジケーターを `.zange-area` に `appendChild` している。
一方、タイピングラップ（`.zange-typing-wrap`）も同じ `.zange-area` 直下にあるため、
インジケーターがタイピング表示と同じ層に並んで表示される。
設計意図（「…」が別行として出ては消える）は実現できるが、DOM 構造がやや散漫。
インジケーターが `.zange-typing-wrap` の後続兄弟として追加される点は一貫しているため実害は小さいが、
インジケーター除去後に次のインジケーターが追加されるタイミング計算で、
`loopDelay` の計算が `1600ms × i` の固定加算のためループ表示が正しく重ならない懸念がある（最初のループが消える前に次が追加される可能性）。

---

## 良かった点

1. **エンド分岐の基本構造が正確**: `karenEnds = ['zange', 'kidoku', 'chinmoku']` の管理が明確で、非 karen エンド（jiritu, toutatu, saihan, jizoku, zure）には `karen-resolve` クラスが付かないことが正しく保証されている。

2. **`showKidokuLastChoice` → `showEnding('zange'|'chinmoku')` のチェーンが正しい**: chat-engine.js:231-237 で `egoScore > 0` なら `'zange'`、そうでなければ `'chinmoku'` に分岐しており、ENDINGS データの `condition` と一致している。`requires: 'kidoku'` の意図通り、kidoku の lastChoice 経由でのみ到達する。

3. **`typingRetry` 演出が完全実装されている**: 1回入力 → `deleteChars` で全削除 → 500ms 待機 → 2回目入力、という ENDINGS データ仕様（`typingRetry: true`）通りの実装になっている。

4. **`karenResponse` の `pauseAfter` フィールドが活用されている**: `rDelay += (r.pauseAfter || 0)` により、各返答行の間隔が ENDINGS データで制御可能になっている。

5. **`chinmoku` の `lastNonEmptyIdx` 検出が正しい**: モノローグ末尾の非空行を後ろから走査して `ending-final-char` クラスを付与する実装は、ENDINGS の chinmoku モノローグ構造（末尾 `'明日も、仕事がある。'`）に対して正しく機能する。

6. **`appIconFade` の実装が堅牢**: アイコン要素が見つからない場合に `console.warn` でフォールバックし、クラッシュしない設計になっている。

7. **Phase E CSS セクションの `.ending-text` アニメーションが既存の chinmoku 専用 CSS と正しく分離されている**: `.ending-chinmoku .ending-text` が `chinmoku-text-float` を使い、`.ending-text`（汎用）が `ending-line-fadein` を使う二層構造になっており、意図通りに chinmoku だけ演出が上書きされる。

8. **`retryButtonDelay` のデフォルト値が全エンドで `5000ms`（一貫）**: ENDINGS データで全非 karen エンドが `retryButtonDelay: 5000` を明示しており、実装側のフォールバック `|| 5000` と一致している。
