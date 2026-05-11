# モバイルレイアウト レビュー（コード品質視点）

## 総合評価: C

全体的な方針（`body.mobile-mode` によるクラス付与、CSS specificity の積み上げ）は正しい。
ただし `--taskbar-height` の更新漏れによるレイアウト崩壊リスク、JS ドラッグの未ガード問題、`!important` の過剰使用など、**対処が必要な問題が複数存在する**。

---

## 重大な問題点

### 1. `--taskbar-height` が 48px のまま更新されていない（レイアウト崩壊リスク）

`:root` での定義は `--taskbar-height: 48px`（`main.css` line 22）。  
モバイルモード時にタスクバー実高さを 56px へ変更しているにもかかわらず、CSS 変数は上書きされていない。

これにより以下の計算がすべて 48px を参照し続ける（実際の 56px タブバーと 8px ずれる）:

```css
/* line 37: body の padding-bottom */
padding-bottom: var(--taskbar-height);           /* → 48px（実際は 56px）*/

/* line 1139: chat-window の高さ */
height: calc(100vh - var(--taskbar-height) - 16px);  /* ずれる */

/* line 2837: protagonistWidget の bottom */
bottom: calc(var(--taskbar-height) + 16px);     /* → 64px（実際は 72px 必要）*/
```

モバイルセクション内でも `inset` と `height` には `var(--taskbar-height, 48px)` のフォールバック付きで参照しているが、変数本体は 48px のまま。
さらに `body.mobile-mode .note-window.active` (line 4727) は `56px` をハードコードしており、他の箇所と不整合。

**修正案**: `body.mobile-mode` ブロック冒頭に以下を追加する。

```css
body.mobile-mode {
  --taskbar-height: 56px;  /* タブバー実高さに合わせる */
  overflow: hidden;
}
```

これで `calc(100vh - var(--taskbar-height))` を使う全既存コードが自動的に正しい値を参照する。
`56px` ハードコードも `var(--taskbar-height)` に統一できる。

---

### 2. JS ドラッグリスナーがモバイルで未ガード（意図しない z-index 変化）

`window-manager.js` line 80:

```js
if (el) el.addEventListener('mousedown', () => bringToFront(el));
```

このリスナーはモバイル判定なしで全ウィンドウに付いている。
iOS/Android では `mousedown` はタッチ操作でも発火する（Pointer Events の合成）。  
タブ切り替えのタッチごとに `bringToFront(el)` が呼ばれ `_zTop` が増加する。  
特に z-index が意図しない順序になるとウィンドウが視覚的に重なる可能性がある（モバイルでは全画面表示なので通常は隠れるが、ウィンドウ切り替えアニメーション中などに表面化する）。

また `makeDraggable` 内の `titlebar.addEventListener('mousedown', ...)` も同様にモバイル判定がない。  
CSS で `cursor: default` と `touch-action: pan-x` を付与しても、**JS の `mousedown` ハンドラは止まらない**。  
`e.preventDefault()` が titlebar の mousedown 内で呼ばれるため、スクロールが意図せず防がれるケースがある。

**修正案**: `window-manager.js` の `bringToFront` 呼び出しと `makeDraggable` の mousedown ハンドラに以下のガードを追加する。

```js
// bringToFront listener
if (el) el.addEventListener('mousedown', () => {
  bringToFront(el);
});

// makeDraggable の mousedown 冒頭
titlebar.addEventListener('mousedown', (e) => {
  if (document.body.classList.contains('mobile-mode')) return; // ← 追加
  ...
});
```

---

## 改善推奨

### 3. `!important` の過剰使用と削減可能な箇所

モバイルセクションの `!important` 使用箇所（lines 4597〜4732 の範囲）:

- `position: fixed !important` — 必要。inline style でスナップ/ドラッグが `position` を上書きしているため。
- `inset / width / height / max-* / border-radius !important` — inline style の上書きが目的なら必要だが、**最大化状態 (`.maximized`) との重複**が気になる。`.maximized` は specificity `0,2,0` で同じ宣言群を持ち、モバイルの `body.mobile-mode .app-window.active` は `0,3,0` のため正しく上書きされる。競合自体は問題ないが、`body.mobile-mode .app-window.maximized.active` という状態が起きると最大化クラスの `z-index: 50` が残る（mobile では z-index 管理が不要なので実害は少ない）。
- `display: none !important`（snap-btn-wrap, resize-handle 等）— 競合する既存ルールが `display: flex` などを持つため `!important` は妥当。
- `left: 0 !important; top: 0 !important`（line 4604-4605）— `inset: 0 0 ... 0 !important` で既に指定済みのため**冗長**。`inset` の shorthand が `top/right/bottom/left` をすべてカバーするので削除可能。

### 4. `active-tab::after` の `position: relative` 宣言の分散

`body.mobile-mode .taskbar-icon` に `position: relative` を付ける規則が **2 箇所に分散している**（lines 4654-4659 と 4673-4675）。前のブロックに `position: relative` をまとめるか、単一ブロックに統合すべき。

```css
/* 現在: 2つのセレクタブロックに分かれている */
body.mobile-mode .taskbar-icon {        /* line 4654 */
  width: 64px; height: 56px; ...
}
body.mobile-mode .taskbar-icon {        /* line 4673 */
  position: relative;
}
```

なお `taskbar-icon` には既存で `position: relative` が定義済み（line 2177）のため、**モバイル側の追加宣言は実質的に不要**（重複している）。

### 5. JS スタイルの不統一（`var` vs `const/let`）

`_mobileActivateTab` 関数（lines 1051-1075）は `var` を使用している。
同ファイル内の他の関数はすべて `const` / `let` で記述されており（lines 645 以降の大半）、追加コードだけ `var` になっている。

```js
// 追加コード（lines 1054-1072）で var を使用
var win = document.getElementById(id);
var tabMap = { ... };
var icon = document.getElementById(iconId);
var activeIconId = tabMap[activeId];
var activeIcon = document.getElementById(activeIconId);
```

機能上の問題はないが、コードベースの一貫性のために `const` / `let` へ揃えることを推奨する。

### 6. iOS Safari の `-webkit-overflow-scrolling: touch` が非推奨

lines 4683, 4689, 4704 に記述されている `-webkit-overflow-scrolling: touch` は iOS 13 以降で非推奨となっており、将来的に削除される可能性がある。現在は `overflow: auto` に `overscroll-behavior: contain` を組み合わせるのが推奨パターン。

```css
/* 現在 */
-webkit-overflow-scrolling: touch;

/* 推奨 */
overscroll-behavior: contain;
/* overflow: auto は親要素側で設定済みであれば不要 */
```

### 7. `body.mobile-mode .note-window.active` に `--taskbar-height` 変数を未使用

lines 4727-4730 では `56px` をハードコードしている。問題点 1 で `--taskbar-height: 56px` を変数として統一すれば、この箇所も `var(--taskbar-height)` に変更できる。

```css
/* 現在 */
body.mobile-mode .note-window.active {
  inset: 0 0 56px 0 !important;
  height: calc(100vh - 56px) !important;
}

/* 変数統一後 */
body.mobile-mode .note-window.active {
  inset: 0 0 var(--taskbar-height) 0 !important;
  height: calc(100vh - var(--taskbar-height)) !important;
}
```

---

## 良かった点

- **specificity 設計の基本方針は正しい**: `body.mobile-mode .app-window.active` (0,3,0) は `.app-window.active` (0,2,0) および `.maximized` ルール (0,2,0) を適切に上書きする。inline style を除けば競合は想定内に収まっている。
- **`touch-action` の使い分けが適切**: titlebar に `pan-x`、チャット欄に `pan-y`、投稿オプションに `pan-x pan-y` と場所ごとに意図が明示されており、ジェスチャー制御の設計思想が読みやすい。
- **`_mobileActivateTab` の実装が簡潔**: forEach + tabMap パターンで他ウィンドウを非アクティブ化する処理は可読性が高く、ウィンドウ追加時の拡張も容易な構造になっている。
- **resize イベントでの `_updateMobileMode` 再評価**: リサイズ時に `mobile-mode` クラスを付け外しする設計は、デスクトップでの開発ツール使用時や向き変更時にも対応でき堅牢。
- **不要 UI の非表示化が網羅的**: snap ボタン、最大化ボタン、ゲームアイコン、トレイ等のモバイル不要要素が漏れなく `display: none` されており、デスクトップ用 UI がモバイルに漏れ出すリスクが低い。
