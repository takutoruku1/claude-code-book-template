# レビュー: showEnding 実装 - UI・演出・WF視点

評価: C

---

## 重大な問題点

### C-1. chinmoku エンドの btn-retry 出現タイミングがモノローグ完了前になっている

**場所:** `js/game-logic.js` L574–580

`retryButtonDelay: 10000`（10秒）は `showEnding()` 呼び出し直後から計測される。
一方、chinmoku のモノローグ（13行、interval=2000ms）の完了は約**26,400ms** 後になる。

実際のタイムライン（計算結果）:
- 400ms: 「返信しなかった。」表示開始
- 8,400ms: 「今もわからない。」表示
- **10,000ms: btn-retry が出現** ← モノローグ第4ライン完了時点
- 12,400ms〜24,400ms: 残り5行のモノローグが続く
- 26,400ms: `mysteryMessage` 表示

結果として、プレイヤーはモノローグの中盤（「今もわからない。」の直後）に「次の依頼へ」ボタンを目視する。UI設計書 §4-7 が意図する「10秒間の暗闇待機の後にボタンが出現する」という体験にならない。`mysteryMessage` も monologue 完了後（26.4s）に表示されるため、`retryButtonDelay` と `mysteryMessage` 出現タイミングの整合性が取れていない。

**修正案:** `retryButtonDelay` を `afterMonoDelay + 10000`（モノローグ完了後10秒）に変更するか、または chinmoku のモノローグ行数・interval を減らして `afterMonoDelay <= 10000` になるよう調整する。

---

### C-2. mystery-sender の「逆再生アニメーション」が未実装

**場所:** `css/main.css` L2016–2018、`js/game-logic.js` L592–596

UI設計書 §4-7（沈黙エンドの項）には以下の記述がある：

> クリックまたはホバーで差出人が `'——カ'` に変化し、**逆再生アニメーションで1文字ずつ消える**。

しかし実装では、クリック時に単純に `senderEl.textContent = E.mysteryMessage.senderRevealed` で `'——カ'` にテキストを置換するだけになっている。CSSの `.mystery-sender.revealed` には `color: var(--accent2); letter-spacing: .1em` のトランジションのみが定義されており、「1文字ずつ消える逆再生アニメーション」は実装されていない。設計書が明記している演出が欠落しているため重大な問題点とする。

---

## 改善推奨

### B-1. #screen-ending に overflow 対応がない

モノローグ行数が多いエンディング（chinmoku: 9行、zange: 13行）では、画面要素（絵文字72px + タイトル + スコア + btn-retry + モノローグ）が `justify-content: center` のフレックスコンテナ内で縦に積まれる。画面高さが小さいデバイスや、ウィンドウ幅が狭い場合にコンテンツがビューポート外にはみ出す恐れがある。`overflow-y: auto` または `overflow-y: scroll` の追加を推奨。

### B-2. zure エンドの no-blackout 時の monologue 可視性

`#screen-ending.no-blackout` は `background: transparent` かつ `pointer-events: none` に設定されており、フィード画面（`reactionArea`）がそのまま見える状態でモノローグがオーバーレイ表示される。しかし `.ending-mono-line` の文字色は `color: var(--text-dim)` (`#888899`) であり、フィード画面の白い背景色やカードと重なった場合にコントラストが低下する恐れがある。モノローグテキストに `text-shadow` や背景のセミトランスペアレントバンドを追加することを推奨。

### B-3. .ending-karen-bubble のスタイルと UI設計書 §5-1 クライアントバブルとの差異

| 項目 | ending-karen-bubble | msg-bubble.client（§5-1） |
|------|--------------------|-----------------------------|
| background | `var(--surface)` (`#16161f`) | `var(--chat-other)` (`#1e2a1e`) |
| border | `var(--border)` (`#2a2a40`) | `rgba(6,199,85,.15)` (ラインカラー) |
| border-radius | `10px 10px 10px 2px` | `16px` (top-left: 4px) |
| padding | `10px 14px` | `8px 12px` |

エンディング文脈では別UIとして意図されている可能性があるが、花蓮（チャトルアプリのクライアント）の返信バブルとして表示されるにもかかわらず、チャット画面のバブルスタイルとは明確に異なる。プレイヤーが「これは花蓮からのメッセージだ」と認識するには、チャトルの `.msg-bubble.client` と近いスタイルに寄せることを推奨する。

### B-4. typingArea の display 切り替えが `''` (空文字) のみ

`js/game-logic.js` L605: `typingArea.style.display = ''` でインラインスタイルを削除しているが、HTML側で `style="display:none"` が静的に設定されているため、デフォルト（CSS定義）に戻る。`ending-typing-area` の CSS には `display: flex` が定義されているため実質的には正しく動作するが、明示性のために `typingArea.style.display = 'flex'` と記述することを推奨する。同様に `mysteryEl.style.display = ''` についても `'flex'` または `'block'` を明示する。

### B-5. chinmoku: retryBtn と mysteryMessage の出現順序

前述のタイミング問題に関連して、`mysteryMessage` は `afterMonoDelay`（約26.4s）後に表示されるが、`btn-retry` は 10s 時点で既に表示されている。プレイヤーが `btn-retry` を押してエンドを終了した場合、`mysteryMessage`（「翻訳、ありがとうございました。」）を見ることなくゲームが終了する。chinmoku の核心的な演出要素を見逃すことになる。

---

## 良かった点

### G-1. fadeIn アニメーションの整合性

`.ending-mono-line { animation: fadeIn .6s ease both }` は UI設計書 §2-4 の `fadeIn: opacity 0→1, translateY 8px→0` と完全に一致しており、モノローグの逐次フェードイン演出として適切に機能している。

### G-2. #screen-ending の HTML 構造が UI設計書 §4-7 と整合

`#endMono` / `#endTypingArea` / `#endMysteryMsg` の3エリアが `#screen-ending` 内に適切に配置されており、既存の `.ending-emoji` / `.ending-title` / `.ending-sub` との構造的な役割分担が明確。`endSub` はモノローグ外の補助テキスト用、`endMono` が逐次モノローグ用という分離も適切。

### G-3. no-blackout CSS の設計が適切

`#screen-ending.no-blackout { background: transparent; pointer-events: none; }` と `* { pointer-events: auto; }` の組み合わせにより、ズレエンドでフィード画面を透過しながらも、モノローグテキストや btn-retry はクリック可能な状態が維持されている。設計意図（フィード画面が明るいまま終わる）に合致した実装。

### G-4. zange タイピング演出のロジックが設計書通り

`typingRetry: true` による「半分まで打って削除→全文再入力」のアニメーション、`karenTypingLoops: 3` による3回のタイピングインジケーター、`pauseAfter: 8000` で8秒ポーズ後に2行目バブル表示の一連の流れが、UI設計書 §4-7 の贖罪エンド仕様と整合している。

### G-5. ending-mystery の CSS 設計が chinmoku 演出に適合

`border: 1px dashed rgba(255,255,255,.2)` のダッシュボーダー、クリック可能なコンポーネントとしての `cursor: pointer`、`.mystery-sender` の `letter-spacing: .2em` による差出人不明感の演出は、「差出人不明メッセージ」のUI要件を適切に表現している。`.ending-mystery:hover { border-color: rgba(255,255,255,.4) }` によるホバーフィードバックも適切。

### G-6. monologueInterval が各エンドごとに適切に機能

`const interval = E.monologueInterval || 1800` で各エンドの設定値（saihan:1500ms、zure:1600ms、zange:2200ms、chinmoku:2000ms、kidoku:2500ms）が正しく参照され、エンドごとの重さ・テンポの差異が演出に反映されている。
