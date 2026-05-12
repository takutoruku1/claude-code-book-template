# UI刷新レビュー — 実装品質・整合性視点

評価日: 2026-05-12
レビュアー: 実装品質担当

## 総合評価: B

全体の構造は壊れておらず、ゲームアイコンのSVG描画・バッジ配置・`font-size: 0` によるテキスト抑制など基本的な実装方針は正しい。ただし **`.y-desktop-icon-letter` ルールの二重定義** という明確な実装バグが存在し、意図しない上書きが発生している。その他のハードコード色は設計上意図的と判断できるが、後の変更時に混乱しやすいため記録する。

---

## 評価軸別チェック

1. **CSS変数波及**: 軽微（意図的なハードコードが混在しており一貫性がない）
2. **SVG構造妥当性**: 問題なし
3. **通知バッジ位置**: 問題なし
4. **サイズ整合性**: 問題なし（`font-size: 0` による上書きも正しく機能している）
5. **Yアイコン整合**: 要修正（ルールの二重定義により意図した54×54pxスタイルが無効化されている）
6. **!important多用**: 軽微（構造的問題は起きていないが、根本原因を解消すれば不要）

---

## 発見した問題（具体的に）

### 問題1（重大）: `.y-desktop-icon-letter` が2箇所に定義されており後のルールが優先される

`css/main.css` の **行3236〜3250** に `!important` を多用した「ゲームアイコン風」スタイル（54×54px、`border-radius: 14px`、濃紺グラデーション背景）が定義されている。しかし **行3258〜3264** にほぼ同じセレクター `.y-desktop-icon-letter` がもう一度定義されており、こちらはカスケードで後勝ちになる。

後のルール（行3258）は `width: 32px; height: 32px; font-size: 26px; font-family: 'Georgia', serif` を `!important` なしで指定している。CSSの優先順位ルールにより、同セレクターで後に書かれた宣言が先のものを上書きする。`!important` は同一優先度の通常宣言を上書きするが、**後のルールにも非 `!important` の `width/height/font-size` が存在するため、`!important` の効果が相殺**される。

結果として `.y-desktop-icon-letter` は `width: 32px; height: 32px; font-size: 26px; font-family: 'Georgia', serif` が適用される（32px、Georgiaフォント）。他の `game-icon` が54×54pxなのに対してYアイコンだけが32×32pxになり、縦方向の揃いが崩れる。

なお `background` や `border-radius` など行3258のルールに含まれない宣言は行3236の `!important` が有効に残るが、サイズとフォントは行3258に負ける。これは意図した結果ではなく、行3258が古いルールの残骸であり削除されていないことが原因と推定される。

### 問題2（軽微）: タイトル画面コンポーネントの色が `--accent` 変数を使わずハードコード

`--accent` は `:root` で `#ff2d6a` に変更されたが、タイトル画面の以下の要素は旧色 `#ff5fa2` をハードコードしたままである：

- `.ts-eyebrow` (行198): `color: #ff5fa2`
- `.ts-caret` (行225): `background: #ff5fa2`
- `.ts-tl-stats .ts-hot` (行158): `color: #ff5fa2`
- `.ts-title-text` (行206〜208): グラデーション内で `#ff5fa2` を3回使用
- `.ts-action:hover` / `.ts-primary` / `.ts-slider` などのホバー・アクセント色: 多数が `#ff5fa2` ハードコード

これらは意図的にタイトル画面だけ明るい Pink（`#ff5fa2`）を維持する設計方針である可能性が高い（タイトル画面は青系背景なので、より明るいピンクの方が映える）。ただし変数と生の色値が混在することで、将来の色変更時に見落としが生じやすい。意図的であれば `--accent-title: #ff5fa2` のような専用変数を設けることを推奨する。

### 問題3（情報）: ゴミ箱アイコンのSVG path

`game-icon-trash` のSVG（buzzutter_v2.html 行72〜80）はすべて `<line>` と `<path>` で構成されており、閉じていないパスは存在しない。`<path>` の `d` 属性は `M10 11 L11 29 Q11.5 32 14 32 H22 Q24.5 32 25 29 L26 11` で終わっているが、`stroke` で描画しており `fill="none"` なのでオープンパスでも問題ない（意図通り）。バグなし。

---

## 修正推奨箇所（ファイル名:行番号形式で）

### 必須修正

**css/main.css:3258〜3264** — `.y-desktop-icon-letter` の二重定義のうち後ろのルールを削除する。

```css
/* 削除対象（行3258〜3264） */
/* desktop icon letter */
.y-desktop-icon-letter {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 900; color: #e7e9ea;
  font-family: 'Georgia', serif;
  line-height: 1;
}
```

このルールを削除すると、行3236〜3250の `!important` ルールが全面的に有効になり、54×54px・`border-radius: 14px`・濃紺背景・`font-size: 20px` が適用される。その後 `!important` も不要になるため、将来的には `!important` を外した形に整理することを推奨。

### 推奨修正（任意）

**css/main.css:158, 198, 206, 225** — タイトル画面のアクセントカラーを変数化する。`:root` に `--accent-title: #ff5fa2` を追加し、該当箇所を `var(--accent-title)` に置換することで意図が明確になり保守性が向上する。

---

## その他の確認結果

- **通知バッジ（.desktop-notif）の位置（css/main.css:88〜97）**: `position: absolute; top: 10px; right: 6px` はアイコンが emoji から SVG に変わっても `.desktop-icon` の `position: relative` を基準とした絶対配置であり、アイコン内の要素変更に影響されない。問題なし。
- **`.icon-img { font-size: 32px }` と `.icon-img.game-icon { font-size: 0 }` の共存（css/main.css:86, 3219）**: セレクタ詳細度は `.icon-img.game-icon`（クラス2つ）が `.desktop-icon .icon-img`（子孫結合子）より高く、`font-size: 0` が正しく勝つ。SVGアイコンへの悪影響なし。
- **`.desktop-icon` の `width: 72px` と `.game-icon` の `width: 54px` の収まり**: `game-icon` は `display: flex; align-items: center; justify-content: center` でアイコンを中央配置している。`padding: 8px 6px 6px` を含む72px幅のアイコンセルに54pxのアイコンが収まる（左右に各9px余白が生じる）。視覚的に問題なし。
