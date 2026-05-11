# レビュー: showEnding 実装 - 機能・スコア・フロー視点

評価: B

## 重大な問題点

なし（動作を根本から壊すバグは発見されなかった）

---

## 改善推奨

### 1. chinmoku: retryButtonDelay の基点が「モノローグ開始」に固定されており意図と乖離する可能性がある

`showEnding()` の chinmoku 固有演出（game-logic.js 574–581行）は、`E.retryButtonDelay` を `afterMonoDelay` ではなく **`showEnding()` 呼び出し直後** から `setTimeout` で計測している。

```javascript
// 現実装
setTimeout(() => {
  if (retryBtn) {
    retryBtn.style.display = '';
    retryBtn.style.animation = 'fadeIn .6s ease both';
  }
}, E.retryButtonDelay || 10000);  // ← モノローグ開始（delay=400ms）からではなくここで即計測
```

chinmoku のモノローグは計13行（空行4つ含む）で、`monologueInterval = 2000ms` の場合の表示完了は約 `400 + 13 * 2000 = 26400ms` 以上になる。`retryButtonDelay = 10000ms` はモノローグ途中でボタンが出現してしまう。

**設計書 §8** では「プレイヤーを暗闇に10秒置く」とあり、これは「モノローグ完了後10秒」と解釈するのが自然である。現状では「showEnding 開始から10秒」で動作しているため、モノローグを再生中にリトライボタンが出現するという矛盾が生じる。

**推奨修正**: `retryButtonDelay` の setTimeout を `afterMonoDelay + E.retryButtonDelay` に変更するか、または `afterMonoDelay` 後に `E.retryButtonDelay` の setTimeout をネストする。

---

### 2. chinmoku: mysteryMessage 表示タイミングが `afterMonoDelay` に固定されているが、silenceDuration との関係が未定義

mysteryMessage は `afterMonoDelay` に表示される（game-logic.js 583–598行）。一方 `silenceDuration: 10000` は設計書上「完全無音を保つ時間」とされているが、`showEnding()` 内でこの値は **使用されていない**（BGM 無音は `bgmTrack: null` で担保されているため実害は少ないが、フィールドが完全に未処理）。

`silenceDuration` を活用して mysteryMessage の表示タイミングを `afterMonoDelay + silenceDuration` にする設計もあり得るため、現状の意図を設計書コメントで明記するか、実装と合わせて整合させることを推奨する。

---

### 3. zange: karenTypingLoops のループ1回あたりの時間が設計書と若干異なる

設計書 §8 では「タイピングインジケーターが3回出ては消える（約12秒）」とある。実装（game-logic.js 652–668行）では1ループあたり `ind.remove()` までの時間が `1200ms` + 次のループ開始までの待機が `800ms` で合計 `2000ms/ループ`。3ループで `6000ms` となり、設計書記載の「約12秒」と半分の差がある。設計意図が「各ループ約2秒」ではなく「約4秒」だった場合は実装値を修正する必要がある。レビュー指示には「各ループ約2秒」と記されており、現実装（2000ms/ループ）はこれと一致するが、設計書の「約12秒」とは矛盾する。どちらが正か確認・統一を推奨。

---

### 4. chinmoku: .btn-retry の初期非表示制御が `endKey === 'chinmoku'` の文字列比較で行われており脆弱

game-logic.js 500–505行の処理は `endKey` 文字列の直接比較でボタン表示を制御しており、将来エンドキー名称変更時に追従漏れが生じやすい。`E.retryButtonDelay` が存在する（非null）かどうかで判断するロジックの方が ENDINGS データとの結合度が低くなり保守性が向上する。

---

### 5. jiritu / toutatu / saihan の retryButtonDelay が 5000ms になっているが、これらのエンドでは実際にボタンを非表示にする処理が走らない

game-logic.js 500–505行のコードは `endKey === 'chinmoku'` の場合のみ非表示にし、他は `retryBtn.style.display = ''` で強制表示にする。`jiritu` 等の `retryButtonDelay: 5000` は `showEnding()` 内では読み取られない（使用されない）フィールドになっており、ドキュメントと実装の間に死角が生まれている。将来実装する際に誤解を招く恐れがあるため、未使用フィールドは `null` に揃えるか、実装でも利用するか、コメントで明示することを推奨する。

---

### 6. zange の `_showKarenResponses` で pauseAfter === 0 の場合に次のバブルが永遠に表示されない（意図的か要確認）

game-logic.js 686–691行：

```javascript
if (r.pauseAfter > 0) {
  setTimeout(next, r.pauseAfter);
} else {
  // pauseAfter === 0 は「ここで止まる」
}
```

コメントに「ここで止まる」とあり ENDINGS データの設計とも一致する（`{ text: 'だから、頼みました。', pauseAfter: 0 }` が最終行）。意図的な停止であれば問題なし。ただし pauseAfter を `null` 等の明示的な「終端値」で区別した方がコードの意図がより明確になる（0 は「即表示」の意味として使われる場合と混同しやすい）。

---

### 7. resolveEnding() の saku ルートで「ズレエンド以外かつ kShinonoya false」の場合もズレエンドになる

game-logic.js 449–454行：

```javascript
if (GS.route === 'saku') {
  if (GS.buzz >= 65 && GS.self < 50)           return 'zure';
  if (GS.self >= 60 && GS.flags.kShinonoya)    return 'toutatu';
  return 'zure';  // ← kShinonoya が false の場合もズレエンド
}
```

設計書 §5-2 では「到達エンド以外はズレエンドに吸収される（設計上の意図）」と注記されているが、プレイヤー視点では「buzz も self も普通なのにズレエンド」という体験になりえる。設計意図を明示するコメントの追記を推奨（機能バグではなく設計上の課題として §11 に既出）。

---

## 良かった点

### 1. ENDINGS データを忠実に参照している

`showEnding()` は `E.monologue`, `E.monologueInterval`, `E.noReplyEffect`, `E.noBlackout`, `E.bgmTrack`, `E.bgmDelay`, `E.appIconFade`, `E.mysteryMessage`, `E.typingText`, `E.typingRetry`, `E.karenTypingLoops`, `E.karenResponse` をすべて処理しており、ENDINGS データと showEnding() 実装の網羅性は高い。

### 2. モノローグの空文字 spacer 処理が正しく実装されている

`E.monologue` の各行を逐次 `setTimeout` で処理しており、`line === ''` のときは `delay += interval` のみ行い DOM 要素を生成しない（game-logic.js 554–567行）。設計書の「空文字=spacer（monologueInterval分の追加間隔）」と完全に一致している。

### 3. resolveKarenEnding() → showKidokuLastChoice() → zange/chinmoku の 2 段階フロー

`chat-engine.js` の `onChatEnd()` → `resolveKarenEnding()` → `E.lastChoice` の存在チェック → `showKidokuLastChoice()` → `egoScore > 0 ? 'zange' : 'chinmoku'` という流れが設計書 §6 の仕様通りに実装されている。kidoku を経由しない直接到達パスが存在しないことも確認できた。

### 4. egoScore 判定の境界値が正しい

`showKidokuLastChoice()` 内（chat-engine.js 227行）：
```javascript
const finalKey = GS.egoScore > 0 ? 'zange' : 'chinmoku';
```
設計書 §6 「`egoScore > 0` が zange、`egoScore <= 0` が chinmoku」と完全一致。0 が chinmoku（沈黙）に倒れる境界値も正しい。

### 5. noBlackout・bgmTrack null・appIconFade の各エンド別演出が適切に処理されている

ズレエンドの `noBlackout: true` による `.no-blackout` クラス付与、BGM なし時のタイトル BGM 停止、chinmoku の `.desktop-icon` フェードアウトがいずれも実装されており、ENDINGS データとの整合性が取れている。

### 6. typingRetry（zange）の「半分まで打って削除→最初から打ち直す」演出が正しく実装されている

game-logic.js 623–643行で、`fullText.slice(0, halfway)` までタイプ → インターバルで1文字ずつ削除 → 全文を再タイプ → `_startKarenTyping()` という流れが設計通りに実装されている。

### 7. mysteryMessage クリックで差出人を revealed に変える実装が正しい

game-logic.js 592–597行でクリックイベントを設定し、`senderEl.classList.contains('revealed')` で二重発火を防止しながら `senderEl.textContent = E.mysteryMessage.senderRevealed` に書き換える処理が正しく実装されている。
