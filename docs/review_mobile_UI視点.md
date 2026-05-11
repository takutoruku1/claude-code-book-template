# モバイルレイアウト レビュー（UI・UX視点）

## 総合評価: C

概ね動作する設計だが、いくつかの箇所で対処が必要な問題がある。特に「ゲーム開始フロー」「最小化とタブ表示の不整合」「`--taskbar-height` 変数の不一致」の3点は実際のプレイ体験に影響する。

---

## 重大な問題点

### 1. `--taskbar-height` 変数がモバイル時に上書きされていない（C級）

**根拠:**
- `:root` では `--taskbar-height: 48px` と定義されている（`css/main.css` line 22）
- `body.mobile-mode .taskbar` の実際の高さは `height: 56px` に設定されている（line 4641）
- しかし `body.mobile-mode` セレクター内で `--taskbar-height` を `56px` に上書きするルールが存在しない

**影響:**
- `inset: 0 0 var(--taskbar-height, 48px) 0` は `48px` のフォールバックを持つが、`:root` が優先されるため常に `48px` が使われる
- 結果としてウィンドウの下端とタスクバーの上端の間に **8px の隙間** が生じる
- `#protagonistWidget` の `bottom: calc(var(--taskbar-height, 56px) + 16px)` はフォールバック値 `56px` を使っているが、実際の変数は `48px` のため不整合がある
- `.note-window.active` のハードコード `inset: 0 0 56px 0` と `.app-window.active` の `var(--taskbar-height, 48px)` が食い違い、Memo ウィンドウだけ高さが正しく、App/Chat ウィンドウは 8px 低い位置に表示される

**修正案:**
```css
body.mobile-mode {
  --taskbar-height: 56px; /* 追加 */
  overflow: hidden;
}
```

---

### 2. ゲーム開始フロー（`openApp` / `startRoute`）で `_mobileActivateTab` が呼ばれない（C級）

**根拠:**
- タイトル画面ボタン（`onclick="openApp(false)"`）から `openApp()` → `startMainModeAutoRoute()` → `resetGame()` という経路を辿る
- `openApp()` の中で `appWindow` に `active` クラスは付与されるが `_mobileActivateTab('appWindow')` は呼ばれない
- `startRoute()` も同様（line 81–88）

**影響:**
- モバイル初回起動時、`taskbarIconApp` に `active-tab` クラスが付かずタブバーのハイライトが空白のまま
- 既に他のタブが表示されていた状態からゲームを再起動した場合、前のウィンドウが残ったまま `appWindow` が前面に来ない

**修正案:**
`openApp()` の `updateTaskbarIndicators()` 呼び出し直後（line 69）と `startRoute()` の末尾に `_mobileActivateTab('appWindow')` を追加する。

---

### 3. タブ切り替え時に「最小化中」ウィンドウが残る可能性（C級）

**根拠:**
`_mobileActivateTab` は他ウィンドウの `active` クラスを除去するが（line 1054–1058）、`minimizeWin()` は `active` クラスを 160ms 遅延で除去する（line 850–852）。

```js
function minimizeWin(el) {
  el.classList.add('minimizing');
  setTimeout(() => { el.classList.remove('active', 'minimizing'); ... }, 160);
}
```

- `taskbarToggleChat()` → `minimizeWin(chatWin)` が走ると同時に `_mobileActivateTab('chatWindow')` が呼ばれた場合、`chatWin` はまだ `active` のまま `_mobileActivateTab` が走る
- この場合 `chatWindow` が自分自身なので除去対象外となり問題にはならないが、逆に **別ウィンドウを閉じようとして `minimizeWin` を呼んだ直後に別タブへ切り替えると**、160ms 以内に次の `_mobileActivateTab` が走り `active` 除去が二重に走る可能性がある

実際の影響は軽微だが、以下のケースで視覚的な一瞬のチラつきが起き得る。
- App タブ表示中 → Chat タブをタップ → Chat で `minimizeWin` のパスに入らずとも App を `classList.remove('active')` するので通常は問題ない
- 懸念はデスクトップモードから縮小してモバイルモードに切り替わった直後

---

## 改善推奨

### 4. タブ切り替え時に最小化ウィンドウ状態フラグがリセットされない（B級）

**根拠:**
`_mobileActivateTab` は `classList.remove('active')` を行うが、`window.chatMinimized` / `window.appMinimized` フラグは変更しない。

例: ユーザーが Chat を最小化（`chatMinimized = true`）→ App タブをタップ → `_mobileActivateTab('appWindow')` が `chatWindow` の `active` を除去 → 次に Chat タブをタップすると `chatMinimized === true` なので復元パスに入る。これ自体は動作するが、モバイルではウィンドウ概念をタブに置き換えているため「最小化」の概念が不自然になる。

**改善案:** `_mobileActivateTab` 内で、除去するウィンドウの minimized フラグを `false` にリセットする。

### 5. 初期表示時にアクティブタブが誰もない（B級）

**根拠:**
- ゲーム開始前（タイトル画面表示時）は全ウィンドウが非表示のため、タブバーに `active-tab` が付いていないのは意図通り
- ただしタイトル画面には `.taskbar` 自体が表示されているため、タブアイコンが3つ並んで全て非アクティブの状態がユーザーから見える

タイトル画面中はタスクバー全体を `display:none` にするか、アイコンを半透明で表示して「ゲーム未開始」を示す UX が望ましい。

### 6. `.chatapp-messages` セレクターはHTMLに存在しない（B級）

**根拠:**
CSS line 4681: `body.mobile-mode .chatapp-messages { touch-action: pan-y; }` と定義されているが、`buzzutter_v2.html` には `.chatapp-messages` クラスを持つ要素が存在しない。チャットメッセージ要素のクラスは `chat-messages`（`id="chatMessages"`）である。

`#chatMessages` セレクター（line 4680）が既に正しく機能するため実害はないが、`.chatapp-messages` は不要なデッドコードとなっている。

### 7. スタートメニューのモバイル表示（B級）

**根拠:**
`.start-menu` は `transform: translateX(-50%)` で中央配置されているが（line 2513）、モバイルの `body.mobile-mode .start-menu { left: 0 !important; }` で `left: 0` を強制する（line 4719）。しかし `transform: translateX(-50%)` は上書きされていないため、`left:0` に対して `-50%` 移動され **画面左に半分はみ出す** 表示になる。

**修正案:**
```css
body.mobile-mode .start-menu {
  width: 100vw;
  left: 0 !important;
  transform: none; /* translateX(-50%) を無効化 */
  border-radius: 16px 16px 0 0;
  bottom: 56px;
}
```

### 8. `showWindowFromNotif` / `openMemoApp` でも `_mobileActivateTab` が未呼び出し（B級）

**根拠:**
- `showWindowFromNotif('memo')` → `openMemoApp()` (line 376) → `_mobileActivateTab` 未呼び出し
- `showWindowFromNotif('chat')` は `window.chatMinimized = false` 後 `updateTaskbarIndicators()` を呼ぶだけで `_mobileActivateTab` 未呼び出し（line 366–378）
- トースト通知クリックでウィンドウが開いた際にタブハイライトがずれる

---

## 良かった点

1. **モバイルタブの基本構造は適切**: 既存のデスクトップ用タスクバーをそのままタブバーとして再利用する設計は、HTML 構造を変えずに済むためコード量を抑えられており合理的。

2. **アクティブタブインジケーターのデザイン**: `::after` 疑似要素で下線インジケーターを実装しており、`position: relative` の設定も正しく行われている。視覚的にも SNS アプリ的で世界観に合っている。

3. **`_mobileActivateTab` の排他制御ロジック**: `forEach` で他ウィンドウを閉じてからアクティブウィンドウのタブをハイライトする処理は明快で、デスクトップモード時は早期 return で副作用なし。

4. **タイトルバー無効化の配慮**: ドラッグ防止 `touch-action: pan-x`、最大化ボタン・スナップボタン・リサイズハンドルの非表示処理が網羅されており、モバイルで誤操作が起きにくい。

5. **`resize` イベントの負荷は問題なし**: `_updateMobileMode` は `classList.add/remove` の DOM 操作のみで、レイアウト計算を強制する処理は含まない。ブレークポイント変化のたびにしか影響が出ないため debounce は不要な設計として妥当。

6. **`touch-action: pan-y` の適用範囲**: `#chatMessages`・`.material-grid`・`.game-panel` の3要素にスクロール方向を明示しており、横スクロールを抑えながら縦スクロールを許可する UX が適切。`.post-options` の横スクロール `pan-x pan-y` も実装されている。

7. **ウィンドウアニメーション無効化**: モバイルで `animation: none !important` を指定し、ウィンドウオープン時のアニメーションを抑制しているのは、タブ切り替え的な操作感に合っており適切。
