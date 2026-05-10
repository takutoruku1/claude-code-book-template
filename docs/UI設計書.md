# バズったー UI設計書

> バージョン: 1.1  
> 対象ファイル: `buzzutter_v2.html` / `css/main.css`  
> 作成日: 2026-05-10  
> 更新日: 2026-05-10（v1.1: クロスレビュー指摘反映）

---

## 目次

1. [デザインコンセプト](#1-デザインコンセプト)
2. [デザイントークン](#2-デザイントークン)
3. [画面一覧](#3-画面一覧)
4. [各画面の詳細設計](#4-各画面の詳細設計)
5. [コンポーネント設計](#5-コンポーネント設計)
6. [キャラクター別スタイル](#6-キャラクター別スタイル)
7. [レスポンシブ設計](#7-レスポンシブ設計)
8. [アクセシビリティ](#8-アクセシビリティ)
9. [今後のUI改善案](#9-今後のui改善案)

---

## 1. デザインコンセプト

### ビジュアルテーマ・世界観

「バズったー」はSNSコンサルタントの日常をテーマにしたナラティブゲームである。UIの世界観は **「現代のデジタル作業環境」** をメタフィクション的に再現することで実現されている。プレイヤーはフローティングウィンドウが並ぶ仮想デスクトップ上でゲームを進める。この演出により「ゲームをプレイしている」という感覚ではなく「主人公の仕事場に入り込んだ」という没入感を与える。

背景には深い宇宙のような **ダークブルー** のグラデーションを採用し、SNSの情報が流れ続けるタイムライン演出と組み合わせることで、夜の孤独な作業デスクという雰囲気を醸し出している。

Windows 11 ライクなウィンドウシステム・タスクバー・スタートメニュー・通知センター・カレンダーポップアップを実装することで、ゲーム内でも「仕事用PC」という文脈を保ちつつ、プレイヤーが直感的に操作できるUIを実現している。

### デザイン原則

| 原則 | 内容 |
|------|------|
| ダーク&イマーシブ | 全体的に暗いダークテーマ。強い光源を使わず、柔らかいグラデーションと半透明のglassomorphismで奥行きを表現する |
| 文字の読みやすさ優先 | チャットや投稿テキストは `font-size: 13px / line-height: 1.6〜1.7` を基準とし、長文でも疲れにくい設計 |
| アニメーションは控えめに | 不必要なアニメーションは避け、存在感のある演出（ウィンドウ開閉・カードフリップ・スコアバー）に絞る |
| キャラクター性の色分け | 各依頼者にテーマカラーを割り当て、チャットバブルや素材カードに一貫して反映する |
| ゲーム的コンテキストを隠さない | ステップバー・スコアバー・選択肢ボタンなど、ゲームのUI要素をUIに組み込みながらも世界観を崩さない |

### ターゲットユーザーとの関係性

ターゲットは **20〜35歳の社会人** であり、SNSに日常的に触れているユーザー層である。このため以下を意識している：

- Twitter/X・LINEに似たUIパターンを意図的に採用し、操作学習コストをゼロに近づける
- 「バズ」「エンゲージメント」「投稿スケジュール」など業界用語を自然に配置し、共感や既視感を演出する
- 深夜の作業感・孤独感を演出するダークUIで、社会人が感じる「仕事の重さ」を追体験させる

---

## 2. デザイントークン

### 2-1. カラーパレット

すべての変数は `css/main.css` の `:root` ブロックで定義されている。

#### 基盤カラー

| 変数名 | Hex値 | 用途 |
|--------|-------|------|
| `--bg` | `#0d0d14` | ページ背景・チャットパネル背景 |
| `--surface` | `#16161f` | ウィンドウ表面・カードベース |
| `--surface2` | `#1e1e2e` | 入力フィールド・選択肢ボタン背景 |
| `--border` | `#2a2a40` | 汎用ボーダー |
| `--win-border` | `#2e2e42` | ウィンドウ枠線 |
| `--win-header` | `#202030` | ウィンドウヘッダー背景 |
| `--win-titlebar` | `#141420` | タイトルバー背景 |

#### テキストカラー

| 変数名 | Hex値 | 用途 |
|--------|-------|------|
| `--text` | `#e8e8f0` | メインテキスト |
| `--text-dim` | `#888899` | サブテキスト・タイムスタンプ・ヒント |

#### アクセントカラー

| 変数名 | Hex値 | 用途 |
|--------|-------|------|
| `--accent` | `#ff6b9d` | ピンク系アクセント（バズスコア・重要UI） |
| `--accent2` | `#7c6af7` | パープル系アクセント（プレイヤー選択・accent2UI） |
| `--accent3` | `#00d4aa` | グリーン系アクセント（selfスコア・素材選択） |

#### 機能カラー

| 変数名 | Hex値 | 用途 |
|--------|-------|------|
| `--chat-self` | `#2a1f4a` | プレイヤー（自分）のチャットバブル背景 |
| `--chat-other` | `#1e2a1e` | クライアントのチャットバブル背景 |
| `--line-green` | `#06c755` | チャトルアプリのブランドカラー（LINE風） |
| `--buzz-blue` | `#1d9bf0` | Yアプリ（Twitter/X風）のブランドカラー |
| `--heart` | `#f91880` | いいねハートカラー |
| `--win11-close-hover` | `#c42b1c` | ウィンドウ閉じるボタンホバー |

#### タスクバー

| 変数名 | 値 | 用途 |
|--------|-----|------|
| `--taskbar-bg` | `rgba(22,22,34,0.92)` | タスクバー背景（半透明ブラー） |
| `--taskbar-height` | `48px` | タスクバー高さ（全画面レイアウトの基準値） |

#### デスクトップ背景グラデーション

```css
.desktop {
  background:
    radial-gradient(ellipse at 50% 110%, rgba(0,100,200,.30) 0%, transparent 55%),
    radial-gradient(ellipse at 15% 60%, rgba(0,60,140,.18) 0%, transparent 45%),
    radial-gradient(ellipse at 85% 20%, rgba(20,80,180,.12) 0%, transparent 40%),
    linear-gradient(175deg, #0a1628 0%, #0e1f40 45%, #091428 100%);
}
```

### 2-2. タイポグラフィ

#### フォントファミリー

```css
/* Google Fonts から読み込み */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=DotGothic16&display=swap');

body { font-family: 'Noto Sans JP', sans-serif; }
```

| フォント | 用途 |
|---------|------|
| `Noto Sans JP` | 本文・UIテキスト全般（ウェイト: 300/400/500/700/900） |
| `DotGothic16` | タイトルロゴ・スコア数値・エンドロール |

#### フォントサイズ体系

| 用途 | サイズ |
|------|--------|
| タイトルロゴ（新デザイン） | `clamp(52px, 9vw, 86px)` |
| タイトルロゴ（旧デザイン） | `64px` |
| セクション見出し | `18px` |
| ウィンドウ本文 | `13〜14px` |
| チャットバブル | `13px` |
| 選択肢ボタン | `12〜14px` |
| ステップバー | `10px` |
| タグ・ラベル | `9〜11px` |
| タスクバー時刻 | `12px` |
| タスクバー日付 | `11px` |

### 2-3. スペーシング・ボーダー・角丸

#### 角丸（border-radius）一覧

| コンポーネント | 値 |
|--------------|-----|
| メインウィンドウ | `12px` |
| ノートウィンドウ | `18px` |
| Explorerウィンドウ | `10px` |
| 素材カード | `14px` |
| チャットバブル | `16px` |
| 選択肢ボタン | `8px` |
| スタートメニュー | `14px` |
| 通知センター | `14px` |
| カレンダーポップアップ | `14px` |
| トースト通知 | `10px` |
| キャラクターカード（タイトル） | `6px` |
| スタートピンアイコン | `10px` |
| スタートボタン | `50px`（pill型） |

#### 主要パディング

| エリア | 値 |
|-------|-----|
| ウィンドウタイトルバー高さ | `32px` |
| ステップバー高さ | `36px` |
| チャットパネル幅 | `340px` |
| チャトルウィンドウ幅 | `360px` |
| タスクバー高さ | `48px`（`--taskbar-height`） |
| 主要コンテンツパディング | `16px` |

### 2-4. アニメーション・トランジション設定

#### キーアニメーション一覧

| アニメーション名 | 定義内容 | 使用箇所 |
|----------------|---------|---------|
| `windowOpen` | `opacity 0→1, scale .94→1, translateY 10px→0` / `duration: 0.3s cubic-bezier(.34,1.4,.64,1)` | ウィンドウ開閉 |
| `winMinimize` | `opacity 1→0, scale 1→.88, translateY 0→28px` / `duration: 0.16s` | ウィンドウ最小化 |
| `fadeIn` | `opacity 0→1, translateY 8px→0` | 画面遷移・各種表示 |
| `slideUp` | `opacity 0→1, translateY 20px→0` | チャットメッセージ・リプライ |
| `pop` | `scale .8→1.1→1, opacity 0→1` | エンディング絵文字・画像ビューア |
| `blink` | `opacity 1→.3→1 / 50%` | タイピングドット・テキストカーソル |
| `heartFloat` | `translateY 0→-60px, scale 1→1.5, opacity 1→0` | いいねハートエフェクト |
| `tagPop` | `scale 0→1, opacity 0→1 / cubic-bezier(.34,1.56,.64,1)` | 素材カードタグ出現 |
| `protagFloat` | `translateY 0→-5px→0` / `3.6s infinite` | 主人公ウィジェット浮遊 |
| `protagMoving` | `scale 1→1.08, rotate -4deg→4deg` | ドラッグ中の主人公 |
| `protagDragWobble` | `translateY 0→-4px, rotate -4deg→4deg` | ウィンドウドラッグ時 |
| `notifPulse` | `scale 1→1.2, box-shadow 0→4px transparent` / `1.8s infinite` | デスクトップ通知点 |
| `calPopIn` | `opacity 0→1, translateY 10px→0, scale .97→1` | カレンダー・通知センター |
| `toastIn` | `opacity 0→1, translateX 110%→0` | トースト通知 |
| `toastOut` | `opacity 1→0, translateX 0→60%` | トースト消去 |
| `tsTlFloat` | `translateY 0→-110vh, opacity 0→.82→0` | タイトル浮遊カード |
| `winIn` | `opacity 0→1, translateY 8px→0, scale .99→1` | タイトル画面ウィンドウ |
| `endroll-scroll` | `translateY 0→-100%` / `30s linear` | エンドロールスクロール |
| `bootFadeIn` | `opacity 0→1, scale .94→1` | ブートロゴ |
| `bootDot` | `opacity .2→1, scale .55→1` | ブートドット |
| `protagChoiceIn` | `opacity 0→1, translateY 4px→0` | 選択肢ボタン出現 |

#### トランジション基準値

```css
/* ホバー系（軽い） */
transition: background .12s, color .12s;

/* ボタン系 */
transition: all .2s;
transition: all .18s;

/* スコアバー */
transition: width .5s cubic-bezier(.34,1.56,.64,1);

/* カードフリップ */
transition: transform .5s cubic-bezier(.4,0,.2,1);

/* 主人公ウィジェット追従 */
transition: left 3s cubic-bezier(0.33, 1, 0.68, 1),
            bottom 3s cubic-bezier(0.33, 1, 0.68, 1);
```

---

## 3. 画面一覧

| 画面ID / クラス | 画面名 | 役割 | z-index |
|----------------|--------|------|---------|
| `#screen-title` | タイトル画面 | ゲーム開始・コンティニュー・設定 | `200` |
| `#screen-charselect` | キャラクター選択画面 | デバッグモード時のルート選択 | `200` |
| `#boot-overlay` | ブートオーバーレイ | ゲーム起動時のWindows風ローディング | `9999` |
| `#appWindow` (.app-window) | メインゲームウィンドウ | ステップバー・チャット・ゲームパネル | `100〜` |
| `#chatWindow` (.chat-window) | チャトルウィンドウ | LINEライクなメッセージアプリ | `100〜` |
| `#memoAppWindow` (.note-window) | メモ帳ウィンドウ | ゲーム中に収集したキーワードメモ | `100〜` |
| `#gamesWindow` (.explorer-window) | ゲームランチャー | ミニゲーム一覧（Explorer風） | `100〜` |
| `#trashWindow` (.explorer-window) | ゴミ箱ウィンドウ | Explorer風ゴミ箱（演出用） | `100〜` |
| `#yWindow` (.y-window) | Yアプリウィンドウ | Twitter/X風SNSビュワー | `200` |
| `#minesweeperWindow` | マインスイーパー | ゲーム内ミニゲーム（Win95風） | `100〜` |
| `#invadersWindow` | スペースインベーダー | ゲーム内ミニゲーム（レトロ風） | `100〜` |
| `#solitaireWindow` | ソリティア | ゲーム内ミニゲーム | `100〜` |
| `#screen-ending` | エンディング画面 | 8種のエンド演出 | `300` |
| `#screen-endroll` | エンドロール画面 | 全ルートクリア後のスタッフロール | `9999` |

---

## 4. 各画面の詳細設計

### 4-1. タイトル画面

**ID:** `#screen-title`  
**CSS:** `.ts-*` プレフィックスのクラス群

#### レイアウト構造

```
#screen-title (position: fixed; inset: 0; z-index: 200)
├── .ts-timeline (背景：浮遊SNSカード群)
└── .ts-stage (position: relative; width: min(660px, 92vw))
    └── .ts-window (glassmorphism ウィンドウ)
        ├── .ts-titlebar (32px, border-bottom)
        └── .ts-body (padding: 36px 52px 28px)
            ├── .ts-eyebrow (キャッチコピー上部ラベル)
            ├── .ts-title-text (DotGothic16, グラデーション文字)
            ├── .ts-tagline
            ├── .ts-typer (タイピングアニメーション)
            ├── .ts-divider
            ├── .ts-actions (ボタン群)
            │   ├── .ts-action.ts-primary (ゲームスタート)
            │   ├── .ts-action.ts-continue (コンティニュー)
            │   ├── .ts-action.ts-subtle (オプション)
            │   └── .ts-drawer (オプションドロワー)
            └── .ts-meta (フッター：バージョン・クレジット)
```

#### デザイン切り替え

`data-design="new"` / `data-design="old"` 属性でデザインを切り替え。設定は `localStorage.getItem('titleDesign')` で永続化。

- **新デザイン（new）**: ウィンドウ型UI + 浮遊タイムラインカード + タイパーアニメーション
- **旧デザイン（old）**: シンプルなロゴ中央配置型

#### 主要コンポーネント

**タイトルロゴ（新デザイン）:**

```css
.ts-title-text {
  font-family: 'DotGothic16', monospace;
  font-size: clamp(52px, 9vw, 86px);
  background: linear-gradient(180deg, #fff 0%, #ffd4e6 55%, #ff5fa2 100%);
  -webkit-background-clip: text;
  filter: drop-shadow(0 0 18px rgba(255,95,162,.35));
}
```

**タイトル眉ラベル（eyebrow）:**

```css
.ts-eyebrow {
  font-size: 11px; letter-spacing: .45em; color: #ff5fa2;
  text-shadow: 0 0 12px rgba(255,95,162,.5);
}
```

**浮遊カード（タイムライン演出）:**

```css
.ts-tl-card {
  position: absolute; bottom: -130px; width: 210px;
  background: rgba(255,255,255,.042);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px;
  backdrop-filter: blur(6px);
  animation: tsTlFloat linear infinite;
}
```

動的にJSで生成（`_startTsTimeline()`）。`_TS_POSTS` 配列からランダムにSNS投稿風カードを6枚同時表示し、`setInterval` で2.6秒ごとに追加。各カードは24〜38秒かけて浮上。

**タイパーアニメーション:**

`_startTsTyper()` で `_TS_TYPER_LINES` 配列のテキストをタイプライター風に表示・消去を繰り返す。表示速度は44〜82ms/文字（ランダム）、消去速度は18ms/文字。

#### ボタンバリエーション

```css
.ts-action          /* 基本ボタン */
.ts-action.ts-primary   /* グラデーション（gradient: #a06bff→#ff5fa2） */
.ts-action.ts-continue  /* パープルボーダー */
.ts-action.ts-subtle    /* 透明背景 */
.ts-action.ts-danger    /* 赤ボーダー（セーブ削除） */
```

#### インタラクション

- BGMボリューム: `<input type="range">` + `onBgmVolumeChange()` → `localStorage('bgmVolume')`
- デザイン切り替え: `toggleTitleDesign()` → `localStorage('titleDesign')`
- オプションドロワー: `toggleTsOptions()` → `.ts-drawer.open` で `max-height: 160px`

---

### 4-2. チャット画面（メインゲームウィンドウ内）

**構成:** `#appWindow` 内の `.chat-panel`（左カラム340px）

#### レイアウト構造

```
#appWindow (.app-window)
├── .titlebar (32px)
├── .step-bar (36px; ステップ進行バー)
└── .main-layout (flex; 残り高さ)
    ├── .chat-panel (width: 340px; 左カラム)
    │   ├── .chat-panel-header (アバター・名前・状態)
    │   ├── .chat-messages (flex: 1; scroll)
    │   │   ├── .msg-row (クライアントメッセージ)
    │   │   ├── .msg-row.self (プレイヤーメッセージ)
    │   │   ├── .typing-indicator (タイピング中表示)
    │   │   └── .sys-msg (システムメッセージ)
    │   └── .chat-choices (sticky bottom; 選択肢)
    └── .game-panel (flex: 1; 右カラム)
        ├── .game-placeholder (デフォルト表示)
        ├── .material-area (素材確認フェーズ)
        ├── .post-area (投稿ビルダーフェーズ)
        └── .reaction-area (反響フェーズ)
```

#### 主要コンポーネント詳細

**チャットパネルヘッダー:**

```css
.chat-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2a4a2a, #1a3a1a);
  border: 2px solid var(--line-green); /* #06c755 */
}
```

**メッセージバブル:**

```css
/* クライアント */
.msg-bubble.client {
  background: var(--chat-other); /* #1e2a1e */
  border: 1px solid rgba(6,199,85,.15);
  border-top-left-radius: 4px; /* 吹き出し角 */
}

/* プレイヤー（自分） */
.msg-bubble.self {
  background: var(--chat-self); /* #2a1f4a */
  border: 1px solid rgba(124,106,247,.2);
  border-top-right-radius: 4px;
}
```

**タイピングインジケーター:**

3つのドットが順番に点滅（`animation-delay: 0s / .2s / .4s`）

**選択肢ボタン:**

```css
.choice-btn {
  padding: 8px 12px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  transition: all .2s;
}
.choice-btn:hover {
  border-color: var(--accent2);
  background: rgba(124,106,247,.1);
  transform: translateX(3px); /* 右方向スライド */
}
```

#### ステップバー

```css
.step-bar { height: 36px; background: var(--win-header); }
.step-item { font-size: 10px; color: var(--text-dim); }
.step-item.active { color: var(--accent); background: rgba(255,107,157,.12); }
.step-item.done   { color: var(--accent3); }
```

ステップ: `チャット → 素材確認 → 投稿 → 反響`

---

### 4-3. クイズ画面

**位置:** ゲームパネル（`.game-panel`）内の表示エリアとして実装。

クイズはチャット会話中に選択肢（`.choice-btn`）で進行するインラインクイズ形式。専用の画面ではなくチャット画面の選択肢UIを活用。

---

### 4-4. 素材確認画面

**クラス:** `.material-area`

#### レイアウト構造

```
.material-area (.active で display: flex)
├── .material-area-header
│   ├── .material-area-title
│   └── .card-limit-badge (選択上限バッジ)
├── .material-grid (grid: repeat(2, 1fr); gap: 12px)
│   └── .card-flip-wrapper (height: 170px) × n枚
│       ├── .card-face (表面：アイコン・タイトル・ヒント)
│       └── .card-back (裏面：タイプ・説明文・タグ)
└── .material-proceed-btn (次へ進むボタン)
```

#### カードフリップ

```css
.card-flip-wrapper {
  perspective: 800px;
  height: 170px;
}
.card-flip-inner {
  transform-style: preserve-3d;
  transition: transform .5s cubic-bezier(.4,0,.2,1);
}
.card-flip-wrapper.flipped .card-flip-inner {
  transform: rotateY(180deg);
}
```

状態管理:
- `.card-flip-wrapper.locked`: 未解放状態（`opacity: .45; pointer-events: none`）
- `.card-flip-wrapper.flipped`: カードめくり済み
- `.card-flip-wrapper.selected`: 選択済み（**裏面**（`.card-back`）のボーダーと背景が変化する。表面ではなく裏面にスタイルが適用される）

```css
/* 選択状態は card-back（裏面）に適用される */
.card-flip-wrapper.selected .card-back {
  border-color: var(--accent3); /* #00d4aa */
  background: rgba(0,212,170,.08);
}
```

**選択ヒントテキスト（`.card-select-hint`）:**

めくり済みかつ未選択のカードに「タップして選択」ヒントを表示する。

```css
.card-select-hint {
  font-size: 10px; color: var(--accent2);
  text-align: center; padding: 3px 0 0;
  opacity: 0; transition: opacity .3s;
}
.card-flip-wrapper.flipped:not(.selected) .card-select-hint { opacity: 1; }
```

**選択チェックマーク（`.card-check`）:**

```css
.card-check {
  position: absolute; top: 8px; right: 8px;
  width: 22px; height: 22px;
  background: var(--accent3); /* #00d4aa */
  border-radius: 50%;
  opacity: 0; transform: scale(0);
  transition: all .2s cubic-bezier(.34,1.56,.64,1);
  z-index: 10;
}
.card-flip-wrapper.selected .card-check { opacity: 1; transform: scale(1); }
```

---

### 4-5. 投稿ビルダー画面

**クラス:** `.post-area`

#### レイアウト構造

```
.post-area (.active で display: flex)
├── [文体選択セクション] .section-label + .post-options
│   └── .post-opt (選択ボタン群)
├── [素材選択セクション] .section-label + .post-options
│   └── .post-opt (解放済み素材ボタン)
├── [ハッシュタグセクション] .section-label + .post-options
│   └── .post-opt (ハッシュタグ選択)
├── [投稿プレビュー] .post-preview-box
│   └── .preview-inner
│       ├── .preview-text (生成テキスト)
│       └── .preview-hash (ハッシュタグ；color: var(--buzz-blue))
├── [スコアバー] .score-row
│   ├── .score-box (バズスコア; .score-fill.buzz)
│   └── .score-box (自己スコア; .score-fill.self)
├── [時間選択] .time-options
│   └── .time-opt × 3 (朝・昼・夜)
└── .btn-post (投稿ボタン)
```

**投稿オプションボタン:**

```css
.post-opt {
  padding: 7px 13px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px; font-size: 12px;
}
.post-opt.selected { background: rgba(124,106,247,.2); border-color: var(--accent2); }
.post-opt.buzz-risk { border-color: rgba(255,107,157,.25); }
.post-opt.buzz-risk.selected { background: rgba(255,107,157,.15); }
```

**スコアバー:**

```css
.score-fill {
  height: 100%; border-radius: 3px;
  transition: width .5s cubic-bezier(.34,1.56,.64,1);
}
.score-fill.buzz { background: var(--accent); }  /* ピンク */
.score-fill.self { background: var(--accent3); } /* グリーン */
```

**egoScore（第3スコア軸）のUI表現方針:**

`GS.egoScore` は花蓮ルート固有のスコア軸（+1/-1 で変動する「業スコア」）であり、贖罪エンド（egoScore > 0）と沈黙エンド（egoScore <= 0）の分岐条件として機能する。

- **花蓮ルート時のUI方針: 非表示**。投稿ビルダー画面のスコアバーには `buzz`（ピンク）と `self`（グリーン）の2本のみ表示し、egoScore は専用バーとして画面に表示しない。
- egoScore はプレイヤーに意識させないことが演出上の意図であり、値はゲーム内部状態（`GS.egoScore`）でのみ管理される。
- egoScore の最終値はエンディング画面のスコア表示にも含まれず、エンドルートの分岐のみに使用される。
- egoScore が加算されるタイミング: 既読エンド（`kidoku`）の `lastChoice` で「「……よかった」とだけ送る」を選択した場合（`egoPlus: true`）、および謎収束選択肢（`karen_mystery_choice`）で告白を選択した場合。

---

### 4-6. 反響フェーズ画面

**クラス:** `.reaction-area`

#### レイアウト構造

```
.reaction-area (.active で display: flex)
├── .feed-card (自分の投稿カード)
│   ├── .feed-top (アバター・名前・ハンドル)
│   ├── .feed-text (投稿テキスト)
│   ├── .feed-tags (ハッシュタグ; color: var(--buzz-blue))
│   ├── .feed-actions (いいね・RT・コメント)
│   └── .reply-list
│       └── .reply-item × n (リプライ一覧)
├── .stats-row (エンゲージメント統計)
│   └── .stat-chip × 3 (いいね数・RT数・バズスコア)
└── .btn-next-phase (次のフェーズへ)
```

**フィードカード:**

```css
.feed-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
}
.feed-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  border: 2px solid var(--line-green);
}
```

**アクションボタン:**

```css
.feed-action.liked { color: var(--heart); /* #f91880 */ }
.feed-action.rtd   { color: var(--accent3); /* #00d4aa */ }
```

**統計チップ:**

```css
.stat-num {
  font-size: 20px; font-weight: 900;
  font-family: 'DotGothic16', monospace;
}
.stat-num.pos      { color: var(--accent3); }
.stat-num.neg      { color: var(--accent); }
.stat-num.buzz-col { color: var(--accent); }
```

---

### 4-7. エンディング画面

**ID:** `#screen-ending`

#### レイアウト構造

```
#screen-ending (position: fixed; z-index: 300)
├── .ending-emoji (font-size: 72px; animation: pop)
├── .ending-title (font-size: 28px; font-weight: 900)
├── .ending-sub (font-size: 14px; max-width: 380px)
├── .ending-scores
│   ├── .ending-score (バズスコア; DotGothic16 36px)
│   └── .ending-score (自己スコア)
└── .btn-retry
```

**背景:**

```css
#screen-ending {
  background: radial-gradient(ellipse at center, #1a0a2e 0%, #0d0d14 70%);
}
```

#### エンディング種別（8種）

| エンド名 | 条件 |
|---------|------|
| 自立エンド | みどり / selfScore ≥ 65 |
| 継続エンド | みどり / デフォルトフォールバック |
| ズレエンド | buzzScore ≥ 65（全キャラ共通） |
| 到達エンド | 朔 / selfScore ≥ 60 + kShinonoya=true |
| 再訪エンド | 誠司 / バランス型 |
| 既読エンド | 花蓮 / selfScore ≥ 65 + flashbackPhase=3 |
| 贖罪エンド | 花蓮 / egoScore 正 |
| 沈黙エンド | 花蓮 / egoScore 負 |

#### 8種エンディングのUI差分詳細

各エンディングには共通レイアウト（`.ending-emoji` / `.ending-title` / `.ending-sub` / `.ending-scores`）に加え、固有の演出フローが存在する。以下はJS制御の演出フィールドと対応するUI動作を定義する。

**ズレエンド（`zure`）:**
- `noBlackout: true` — 暗転処理をスキップし、フィード画面（反響フェーズ）を明るいまま保持する。`#screen-ending` は通常の暗転背景（`radial-gradient(ellipse at center, #1a0a2e 0%, #0d0d14 70%)`）を表示せず、フィードの上にモノローグテキストをオーバーレイする演出に切り替える。
- BGMなし（`bgmTrack: null`）。`stopBGM()` が呼ばれ、音声は即時停止する。

**既読エンド（`kidoku`）:**
- `fadeDuration: 12` — 全エンド最長の12秒フェードアウト。
- `bgmDelay: 3000` — 暗転開始から3秒後にピアノ単音が1つだけ鳴る。
- `lastChoice` の2択選択肢UI: 通常の `.choice-btn` でチャットパネル底部に表示される。
  - 選択肢1:「「……よかった」とだけ送る」（`egoPlus: true`）
  - 選択肢2:「（画面を閉じる）」

**贖罪エンド（`zange`）:**（`kidoku` の `lastChoice` 経由でのみ到達）
- `typingText` 演出: チャットスレッドの入力欄（またはエンディング画面内の入力欄風UI）に `'篠宮さん。3年前、記事を書いたのは私です。'` がタイピングされる。
- `typingRetry: true` — 一度入力テキストを消去してから再入力するアニメーションが走る（「書きかけて消す→再入力」の演出）。
- `karenTypingLoops: 3` — 花蓮のタイピングインジケーター（3つのドット）が3回出ては消える（約12秒）。
- 花蓮のレスポンスは2行（「知っていました。」→8秒ポーズ→「だから、頼みました。」）がチャットバブルとして表示される。

**沈黙エンド（`chinmoku`）:**（`kidoku` の `lastChoice` 経由でのみ到達）
- `appIconFade: true` — デスクトップ左上の「ばずったー.app」アイコン（`.desktop-icon`）がゆっくりフェードアウトする演出。
- `silenceDuration: 10000` — エンディング画面開始から10秒間、BGM・SE・UIアクションを含む完全無音状態を維持する。
- `retryButtonDelay: 10000` — 「もう一度」（`.btn-retry`）ボタンが10秒後にフェードインで出現する。プレイヤーは暗闇の中10秒間待機を強いられる。
- `mysteryMessage` — 差出人不明（`sender: '──────'`）のメッセージオブジェクトを表示するUI。クリックまたはホバーで差出人が `'——カ'` に変化し、逆再生アニメーションで1文字ずつ消える。メッセージ本文: 「翻訳、ありがとうございました。」

**到達エンド（`toutatu`）:**
- `noReplyEffect: true` — 花蓮のメッセージ表示後、プレイヤーの返信選択肢UIが「出かけて消える」演出（選択肢ボタンが一瞬表示されて `.choice-btn` がフェードアウトする）。選択肢は選択できない状態で消去される。

---

### 4-8. ゲーム内ゲーム画面（ウィンドウシステム）

#### マインスイーパー（`#minesweeperWindow`）

**スタイル:** Windows 95風クラシックUI

```css
#minesweeperWindow {
  background: #c0c0c0;
  border-top: 3px solid #fff; border-left: 3px solid #fff;
  border-right: 3px solid #808080; border-bottom: 3px solid #808080;
}
.ms-titlebar { background: #000080; color: #fff; }
.ms-lcd {
  background: #000; color: #f00;
  font-family: 'Courier New', monospace;
  font-size: 22px;
}
.ms-cell {
  width: 38px; height: 38px;
  border-top: 2px solid #fff; border-left: 2px solid #fff;
  border-right: 2px solid #808080; border-bottom: 2px solid #808080;
  background: #c0c0c0;
}
.ms-cell.mine-hit { background: #f00; }
```

グリッドサイズ: `5×5`（`grid-template-columns: repeat(5, 38px)`）

#### スペースインベーダー（`#invadersWindow`）

**スタイル:** レトロアーケード風

```css
#invadersWindow {
  background: #000;
  border-top: 3px solid #fff; border-left: 3px solid #fff;
  border-right: 3px solid #404040; border-bottom: 3px solid #404040;
}
.inv-titlebar { background: #000080; }
```

Canvas要素（`#invCanvas`）でゲームを描画。タッチ操作用ボタン群（`.inv-touch-btns`）を下部に配置。

#### Yアプリウィンドウ（`#yWindow`）

Twitter/X を模したSNSビュワー。SNSコンサルタントの仕事画面として機能する。

```css
.y-window {
  background: #000;
  border: 1px solid #2f3336;
  width: 900px; height: 620px;
}
```

3カラム構成:
- **左サイドバー** (200px): ナビゲーション + プロフィール
- **メインフィード** (flex:1): タブ（おすすめ/フォロー中） + 投稿一覧
- **右サイドバー** (280px): 検索・トレンド・おすすめユーザー

**注:** Yアプリの `.y-window` は `border-radius: 8px`（L2983）。タイトルバーは `--win-titlebar` ではなく `background: #000` で上書きされる（例外適用）。

---

### 4-9. チャトルウィンドウ（`#chatWindow`）内部構造

LINEライクなメッセージアプリウィンドウ。`.chat-window.active { display: flex }` で表示。

#### レイアウト構造

```
#chatWindow (.chat-window)
├── .titlebar (32px; 共通ウィンドウChrome)
├── .chatapp-content (flex: 1; position: relative; overflow: hidden)
│   ├── #chatScreenFriends (.chatapp-screen)   ← 友達画面
│   │   ├── .chatapp-my-profile (マイプロフィール上部; border-bottom)
│   │   ├── .chatapp-list-scroll (flex: 1; overflow-y: auto)
│   │   │   ├── .chatapp-section-label (「友達」ラベル)
│   │   │   └── .chatapp-friend-item × n (友達リスト行)
│   │   │       ├── .chatapp-contact-ava (38px; border-radius: 50%; green border)
│   │   │       └── .chatapp-contact-info
│   │   │           ├── .chatapp-contact-name (13px; font-weight: 700)
│   │   │           └── .chatapp-contact-sub  (10px; color: #06c755)
│   │   └── [.chatapp-nav (下部ナビバー 54px)]
│   ├── #chatScreenTalk (.chatapp-screen)       ← トーク一覧画面
│   │   ├── .chatapp-list-header (「トーク」ヘッダー)
│   │   ├── .chatapp-list-scroll
│   │   │   └── .chatapp-talk-item × n (トーク一覧行)
│   │   │       ├── .chatapp-talk-ava (42px; border-radius: 50%; green border)
│   │   │       ├── .chatapp-talk-body
│   │   │       │   ├── .chatapp-talk-top
│   │   │       │   │   ├── .chatapp-talk-name (13px)
│   │   │       │   │   └── .chatapp-talk-time (9px)
│   │   │       │   └── .chatapp-talk-preview (11px; 1行省略)
│   │   │       └── .chatapp-talk-badge (未読数; background: #06c755)
│   │   └── [.chatapp-nav (下部ナビバー 54px)]
│   └── #chatScreenThread (.chatapp-screen)    ← スレッド（メッセージ）画面
│       ├── .chatapp-thread-header (8px 12px; border-bottom)
│       │   └── .chatapp-back-btn (color: #06c755; ← 戻るボタン)
│       ├── .chat-messages (flex: 1; scroll; padding-bottom: 140px)
│       └── [.chatapp-nav (下部ナビバー 54px)]
└── .chatapp-nav (下部ナビバー; 高さ 54px; border-top)
    └── .chatapp-nav-btn × 4 (タブボタン; 各 flex: 1)
        ├── .chatapp-nav-icon-wrap (relative)
        │   ├── .chatapp-nav-icon (20px)
        │   └── .chatapp-nav-badge (未読バッジ; top: -4px; right: -8px; min-width: 14px)
        └── .chatapp-nav-label (9px)
```

**3画面切り替えロジック:** `.chatapp-screen.active { display: flex }` で表示制御。友達画面・トーク一覧・スレッドの3画面を `.active` クラスの付け替えで切り替える。

**下部ナビバーのスタイル:**

```css
.chatapp-nav {
  height: 54px;
  border-top: 1px solid var(--win-border);
  background: var(--surface);
}
.chatapp-nav-btn.active { color: #06c755; }
```

**戻るボタンのスタイル:**

```css
.chatapp-back-btn {
  color: var(--line-green); /* #06c755 */
  font-size: 18px;
  padding: 2px 6px;
  border-radius: 4px;
}
```

---

### 4-10. セーブスロットモーダル（`#saveSlotModal`）

セーブ・ロード・削除を行う独立モーダルUI。`z-index: 15000` でゲームUIより手前に表示される。

#### レイアウト構造

```
#saveSlotModal (position: fixed; inset: 0; z-index: 15000; opacity: 0→1)
└── .slot-modal-box (background: #1e1e2e; border-radius: 16px; padding: 28px 32px; min-width: 360px; max-width: 420px)
    ├── .slot-modal-title (15px; font-weight: 700; letter-spacing: 1px; text-align: center)
    ├── .slot-modal-slots
    │   └── .slot-item × 3 (各セーブスロット; padding: 14px 16px; border-radius: 10px)
    │       ├── .slot-num (11px; color: var(--accent); min-width: 52px)  ← 「SLOT 1」等
    │       ├── .slot-info
    │       │   ├── .slot-name (13px; font-weight: 600)
    │       │   └── .slot-detail (11px; color: var(--text-dim))
    │       ├── .slot-empty (12px; color: rgba(255,255,255,.25))   ← 空スロット表示
    │       ├── .slot-overwrite (上書き警告ラベル; color: rgba(255,107,157,.6))
    │       └── .slot-delete-icon (削除アイコン; 14px)
    ├── .slot-modal-cancel (キャンセルボタン; border: rgba(255,255,255,.1); border-radius: 8px)
    └── .slot-modal-quit (ゲーム終了ボタン; border: rgba(255,80,80,.25); color: #ff8080; font-size: 12px)
```

**表示切り替え:** `#saveSlotModal.visible { opacity: 1 }` でフェードイン（`transition: opacity .2s`）。

**スロット状態バリエーション:**
- `.slot-item`: 通常スロット（クリックでセーブ/ロード）
- `.slot-item.slot-disabled`: 無効スロット（`opacity: .35; pointer-events: none`）
- `.slot-item-delete:hover`: 削除ホバー時（`background: rgba(255,80,80,.08)`）
- `.slot-overwrite`: 上書き警告バッジ（`border: 1px solid rgba(255,107,157,.3); border-radius: 4px; padding: 2px 6px`）

---

## 5. コンポーネント設計

### 5-1. チャットバブル

#### クライアントバブル（`.msg-bubble.client`）

```css
background: var(--chat-other); /* #1e2a1e */
border: 1px solid rgba(6,199,85,.15);
border-radius: 16px;
border-top-left-radius: 4px; /* 吹き出し感 */
max-width: 78%;
padding: 8px 12px;
font-size: 13px; line-height: 1.6;
```

アバター (`.msg-ava.client`): `background: linear-gradient(135deg, #2a4a2a, #1a3a1a); border: 1px solid var(--line-green)`

#### プレイヤーバブル（`.msg-bubble.self`）

```css
background: var(--chat-self); /* #2a1f4a */
border: 1px solid rgba(124,106,247,.2);
border-radius: 16px;
border-top-right-radius: 4px;
```

アバター (`.msg-ava.self`): `background: linear-gradient(135deg, #2a1f4a, #1a0f3a); border: 1px solid var(--accent2)`

#### システムメッセージ（`.sys-msg`）

```css
text-align: center;
font-size: 10px;
color: var(--accent3); /* #00d4aa */
padding: 6px;
animation: fadeIn .3s ease;
```

#### クリッパブルバブル（`.msg-bubble.clippable`）

会話中に素材として切り取れるキーワードのあるバブル。

```css
.msg-bubble.clippable { cursor: pointer; border-style: dashed; }
.msg-bubble.clippable:hover { border-color: var(--accent3); background: rgba(0,212,170,.06); }
.msg-bubble.clipped  { border-style: solid !important; border-color: var(--accent3) !important; }
```

#### フラッシュバックバブル

主人公のフラッシュバック演出時のバブル。

```css
.protag-bubble.flashback {
  letter-spacing: 2.5px;
  color: rgba(200,195,230,.75);
  border-color: rgba(124,106,247,.15);
  background: rgba(12,8,24,.96);
}
```

### 5-2. 選択肢ボタン

チャットパネル底部に表示される選択肢。

```css
.choice-btn {
  padding: 8px 12px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  transition: all .2s;
}
.choice-btn:hover {
  border-color: var(--accent2);
  background: rgba(124,106,247,.1);
  transform: translateX(3px);
}
```

### 5-3. 素材カード

#### カード表面（`.card-face`）

```css
.card-face {
  background: linear-gradient(135deg, var(--surface2), #161624);
  border-radius: 14px;
  backface-visibility: hidden;
  padding: 14px;
  gap: 8px;
}
.card-face-icon  { font-size: 32px; }
.card-face-title { font-size: 13px; font-weight: 700; }
.card-face-hint  { font-size: 10px; color: var(--text-dim); }
```

#### カード裏面（`.card-back`）

```css
.card-back {
  transform: rotateY(180deg); /* 反転配置 */
  align-items: flex-start; text-align: left;
}
.card-back-type  { font-size: 9px; letter-spacing: 2px; color: var(--accent); }
.card-back-title { font-size: 12px; font-weight: 700; }
.card-back-desc  { font-size: 11px; color: var(--text-dim); line-height: 1.5; }
```

#### カードタグ（`.card-tag`）

```css
.card-tag {
  padding: 2px 7px; border-radius: 10px;
  font-size: 9px;
  background: rgba(255,107,157,.12);
  border: 1px solid rgba(255,107,157,.2);
  color: var(--accent);
  animation: tagPop .3s cubic-bezier(.34,1.56,.64,1);
}
```

### 5-4. 投稿プレビュー

```css
.post-preview-box {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
}
.preview-inner {
  background: var(--surface);
  border-radius: 10px; padding: 12px;
}
.preview-text { font-size: 13px; line-height: 1.7; }
.preview-hash { font-size: 12px; color: var(--buzz-blue); /* #1d9bf0 */ }
```

### 5-5. 反響フィード（SNSタイムライン風）

投稿後のSNS反応シミュレーション。

```css
.feed-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px; padding: 14px;
}
.reply-item {
  display: flex; gap: 8px;
  padding: 8px 10px;
  background: var(--surface2);
  border-radius: 8px;
  animation: slideUp .3s ease both;
}
```

### 5-6. スコアバー

バズスコア（ピンク）と自己スコア（グリーン）の2本。

```css
.score-track { height: 5px; background: var(--border); border-radius: 3px; }
.score-fill {
  height: 100%; border-radius: 3px;
  transition: width .5s cubic-bezier(.34,1.56,.64,1);
}
.score-fill.buzz { background: var(--accent); }  /* #ff6b9d */
.score-fill.self { background: var(--accent3); } /* #00d4aa */
```

### 5-7. フラッシュバック演出

主人公ウィジェットの `protag-bubble` を使用。チャット画面に `cf-sys.flash` クラスのシステムメッセージとして表示される。フラッシュバックは3段階で発動：

| 段階 | トリガー | 内容 |
|------|---------|------|
| 段階1 | みどりルートの「お母さん」発言 | 過去の炎上記事への言及 |
| 段階2 | 朔ルートの「残したい」発言 | 「言葉はキャッシュに残る」 |
| 段階3 | 花蓮の「依頼の理由メモ」カードめくり | 全伏線の収束 |

### 5-8. ウィンドウ（ウィンドウマネージャー）

#### ウィンドウChrome（`.titlebar`）

```css
.titlebar {
  background: var(--win-titlebar); /* #141420 */
  border-bottom: 1px solid var(--win-border);
  height: 32px;
  cursor: grab;
}
.titlebar-title { font-size: 12px; color: var(--text-dim); }
.titlebar-winbtn { width: 46px; height: 32px; font-size: 11px; }
.titlebar-winbtn:hover { background: rgba(255,255,255,.10); }
.titlebar-winbtn.close:hover { background: var(--win11-close-hover); /* #c42b1c */ }
```

#### スナップ機能

3ゾーン対応:

| ゾーン | トリガー条件 | 結果 |
|-------|------------|------|
| `left` | ドラッグ中 x ≤ 14px | 左半分にスナップ |
| `right` | ドラッグ中 x ≥ 画面幅-14px | 右半分にスナップ |
| `full` | ドラッグ中 y ≤ 2px | 最大化 |

スナッププレビュー:

```css
#snapPreview {
  background: rgba(0, 120, 215, 0.20);
  border: 2px solid rgba(0, 120, 215, 0.55);
  border-radius: 8px;
  transition: left .1s, top .1s, width .1s, height .1s;
}
```

**スナップレイアウトポップアップ（`.snap-layouts`）:**

最大化ボタン（`.snap-btn-wrap`）をホバーした際に表示されるポップアップUI。左半分・全画面・右半分の3つのスナップレイアウトをクリックで選択できる。

```
.snap-btn-wrap (最大化ボタンラッパー)
└── .snap-layouts (hover時 display: flex; position: absolute; top: 100%; left: 50%)
    ├── .snap-layouts-label (10px; color: var(--text-dim); 「レイアウト」等ラベル)
    └── .snap-layouts-row
        ├── .snap-layout-cell.snapleft  (左半分インジケーター)
        ├── .snap-layout-cell.snapfull  (全画面インジケーター)
        └── .snap-layout-cell.snapright (右半分インジケーター)
```

```css
.snap-layouts {
  background: rgba(30, 30, 34, 0.96);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 8px;
  min-width: 116px;
  z-index: 10000;
  box-shadow: 0 8px 32px rgba(0,0,0,.6);
}
.snap-layout-cell {
  width: 30px; height: 22px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 3px; background: rgba(255,255,255,.06);
}
.snap-layout-cell:hover {
  background: rgba(0, 120, 215, 0.45);
  border-color: rgb(0, 120, 215);
}
/* インジケーター（スナップ先を示す白いブロック） */
.snap-layout-cell.snapleft  .snap-ind { left: 2px; width: 44%; }
.snap-layout-cell.snapfull  .snap-ind { left: 2px; right: 2px; }
.snap-layout-cell.snapright .snap-ind { right: 2px; width: 44%; }
```

**現在のスナップ状態:** `.snap-btn-wrap[data-snap="left/right/full"]` でアクティブセルをハイライト（`background: rgba(0,120,215,0.55)`）。

#### ウィンドウ最大化

```css
.app-window.maximized {
  position: fixed !important;
  inset: 0 0 var(--taskbar-height) 0 !important;
  width: 100vw !important;
  height: calc(100vh - var(--taskbar-height)) !important;
  border-radius: 0 !important;
}
```

#### リサイズハンドル

8方向対応 (`.rh-n`, `.rh-s`, `.rh-e`, `.rh-w`, `.rh-nw`, `.rh-ne`, `.rh-sw`, `.rh-se`)。最小サイズ: `280×200px`。

#### 主人公ウィジェット（`#protagonistWidget`）

ウィンドウフォーカス時にウィンドウ右下付近に追従する浮遊ウィジェット。

```css
.protag-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #1e1630, #110c24);
  border: 2px solid var(--accent2);
  animation: protagFloat 3.6s ease-in-out infinite;
}
.protag-bubble {
  background: rgba(18,14,30,.93);
  border: 1px solid rgba(124,106,247,.35);
  border-radius: 14px; max-width: 220px;
  font-size: 12px;
}
```

### 5-9. デスクトップアイコン（`.desktop-icon`）

Windows 11 ライクなデスクトップ左上に縦並びで配置されるアイコン群。ゲームアプリへのエントリポイントとして機能する。

```
.desktop-icons (position: absolute; top: 40px; left: 12px; flex-direction: column; gap: 4px; z-index: 1)
└── .desktop-icon × n (width: 72px; flex-direction: column; align-items: center; padding: 8px 6px 6px)
    ├── .icon-img (font-size: 32px)
    ├── .icon-label (font-size: 11px; color: rgba(255,255,255,.88); text-shadow: 0 1px 4px rgba(0,0,0,.8))
    └── .desktop-notif (通知ドット; position: absolute; top: 10px; right: 6px; width: 10px; height: 10px)
```

```css
.desktop-icon { width: 72px; border-radius: 4px; transition: background .12s; }
.desktop-icon:hover {
  background: rgba(255,255,255,.10);
  outline: 1px solid rgba(255,255,255,.18);
}
.desktop-notif { border-radius: 50%; background: #fff; border: 2px solid var(--bg); display: none; }
.desktop-notif.on {
  display: block;
  animation: notifPulse 1.8s ease-in-out infinite;
}
```

**通知ドット（`.desktop-notif.on`）:** `notifPulse` アニメーションで点滅。`scale 1→1.2, box-shadow 0→4px transparent`。沈黙エンドの `appIconFade: true` 時には「ばずったー.app」アイコン全体がフェードアウトする。

### 5-10. 画像ビューア・ライトボックス（`.chat-image-viewer`）

チャット内の写真素材画像をクリックした際にフルスクリーン展開するライトボックスUI。ゲームの性質上（SNS投稿用の写真素材を扱う）、重要度の高いコンポーネント。

```
.chat-image-viewer (position: fixed; inset: 0; z-index: 20000; cursor: zoom-out)
├── img (max-width: 90vw; max-height: 85vh; border-radius: 8px; animation: pop .3s ease)
└── .chat-image-viewer-close (position: absolute; top: 16px; right: 20px; width: 36px; height: 36px; border-radius: 50%)
```

```css
.chat-image-viewer {
  background: rgba(0,0,0,.85);
  backdrop-filter: blur(6px);
  animation: fadeIn .2s ease;
}
.chat-image-viewer-close {
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.2);
  color: #fff; font-size: 18px;
}
.chat-image-viewer-close:hover { background: rgba(255,255,255,.25); }
```

画像は `pop` アニメーション（`scale .8→1.1→1, opacity 0→1`）で出現。背景クリックでも閉じる（`cursor: zoom-out`）。

---

## 6. キャラクター別スタイル

### 6-1. みどり（田中 みどり）

| 項目 | 値 |
|------|-----|
| テーマカラー | `#06c755`（`--line-green`） |
| アバター | 🌿 |
| ルートID | `midori` |

**チャットスタイル:**
- アバター背景: `linear-gradient(135deg, #2a4a2a, #1a3a1a)`
- アバターボーダー: `border: 2px solid #06c755`
- バブル背景: `var(--chat-other)` = `#1e2a1e`
- バブルボーダー: `rgba(6,199,85,.15)`

**タイトル浮遊カード（`_TS_POSTS`）内の代表テキスト:** 「今日もゼラニウム咲いた / なんか元気もらえる」 (♥ 142)

### 6-2. 朔（水無月 朔）

| 項目 | 値 |
|------|-----|
| テーマカラー | `#c084fc`（パープル） |
| アバター | 🌙 |
| ルートID | `saku` |

マスター仕様書内CSS変数: `var(--saku)` = `#c084fc`

**チャットスタイル:**

朔のテーマカラーはパープル（`#c084fc`）だが、チャトルウィンドウ内のアバター（`.chatapp-contact-ava` / `.chatapp-talk-ava`）は現在CSSの共通スタイルが適用されている。

- アバター背景: `linear-gradient(135deg, #2a4a2a, #1a3a1a)` ← **現在の実装は緑グラデーション（共通）。テーマカラーのパープル（`#c084fc`）は反映されていない**
- アバターボーダー: `border: 2px solid var(--line-green)` （共通）
- バブル背景: `var(--chat-other)` = `#1e2a1e`（共通）
- バブルボーダー: `rgba(6,199,85,.15)`（共通）

**補足:** 朔のテーマカラー `#c084fc` はキャラクターセレクト画面・キャラクターカードタグ等のデコレーション要素に使用するが、現時点でチャットバブルやアバター背景への個別適用は実装されていない。今後のUI改善課題として記録する。

### 6-3. 誠司（天羽 誠司）

| 項目 | 値 |
|------|-----|
| テーマカラー | `#fb923c`（オレンジ） |
| アバター | ☕ |
| ルートID | `seiji` |

マスター仕様書内CSS変数: `var(--seiji)` = `#fb923c`

**チャットスタイル:**

- アバター背景: `linear-gradient(135deg, #2a4a2a, #1a3a1a)` （共通）
- アバターボーダー: `border: 2px solid var(--line-green)` （共通）
- バブル背景: `var(--chat-other)` = `#1e2a1e`（共通）
- バブルボーダー: `rgba(6,199,85,.15)`（共通）

**補足:** 誠司の素材カードは3枚（他のキャラクターは4枚）。素材グリッドは2列固定（`grid: repeat(2, 1fr)`）を維持し、3枚目のカードは1列目のみに配置される。4枚目のスロットはロックカードやグリッドの空欄で補完しない。

### 6-4. 花蓮（篠宮 花蓮）

| 項目 | 値 |
|------|-----|
| テーマカラー | `#f9a8d4`（ライトピンク） |
| アバター | 🌸 |
| ルートID | `karen` |

マスター仕様書内CSS変数: `var(--karen)` = `#f9a8d4`

**チャットスタイル:**

- アバター背景: `linear-gradient(135deg, #2a4a2a, #1a3a1a)` （共通）
- アバターボーダー: `border: 2px solid var(--line-green)` （共通）
- バブル背景: `var(--chat-other)` = `#1e2a1e`（共通）
- バブルボーダー: `rgba(6,199,85,.15)`（共通）

**特記事項:**
- 花蓮カードのキャラクターカードボーダー: `border-color: rgba(249,168,212,.2)`
- 最後にプレイするキャラクター（デバッグモードでは注意書きあり）
- 花蓮ルートでは egoScore（第3スコア軸）が機能する（詳細は4-5節参照）
- 花蓮ルートでは `mysteryClues` 蓄積によって謎収束選択肢が出現する（詳細は後述の「mysteryClues 蓄積のUI反映」参照）

**キャラクター名表記の注意:** `app-core.js` の `CHARACTERS` オブジェクトでは「倉田 朔」「松本 誠司」、マスター仕様書では「水無月 朔」「天羽 誠司」と名前が異なる。本設計書ではマスター仕様書の表記を採用しているが、この不一致は未解決の課題である。

### チャトルアプリ内のキャラクター表示

**トーク一覧バッジ（未読数）:**

```css
.chatapp-talk-badge {
  background: #06c755; color: #000;
  border-radius: 9px; font-size: 9px; font-weight: 700;
}
```

**キャラクターセレクトカード（`.char-card`）:**

```css
.char-card:hover {
  border-color: var(--accent2);
  background: rgba(124,106,247,.08);
  transform: translateY(-2px);
}
.char-card-tag {
  background: rgba(255,107,157,.12);
  border: 1px solid rgba(255,107,157,.2);
  color: var(--accent);
}
```

### mysteryClues 蓄積状態のUI反映

`GS.mysteryClues` は花蓮ルート専用の謎手がかり配列。素材カードをめくった際に `mysteryFlag` フィールドが設定されているカードで自動的に蓄積される。

**蓄積される値:**
- `'karen'` — 朔ルートの特定カードをめくった際に追加（花蓮への伏線）
- `'yukiwarisou'` — 花蓮ルートの複数カードで追加

**メモ帳ウィンドウ（`#memoAppWindow`）への表示:**

`mysteryClues` の各値はメモ帳ウィンドウの `.note-list` 内に `.note-item` として表示される。クライアント別に `.note-client-header`（アバター付きセクションヘッダー）でグループ化され、キーワードは `.note-item-keyword`（`color: var(--accent2); font-weight: 700`）でハイライト表示される。メモが未蓄積の場合は `.note-empty`（`background: rgba(124,106,247,.08); border: 1px dashed rgba(124,106,247,.24)`）が表示される。

**クルー蓄積時のUI通知:**

現在の実装では、`mysteryClues` 蓄積時に専用のトースト通知やデスクトップアイコンバッジは発火しない。クルーの蓄積はカードフリップ（`game-logic.js` の `handleCardClick()`）と同時に静かに行われる。プレイヤーはメモ帳ウィンドウを開いて確認する必要がある。

**謎収束選択肢（`mysteryClues.length >= 2`）の出現:**

花蓮ルートの特定チャットステップ（`karen_mystery_choice`）にて、`mysteryClues.length >= 2` の条件を満たした場合のみ以下の2択選択肢が `.choice-btn` として表示される:

- 「あなたのお姉さんに…記事を書いたのは私です」（贖罪エンド方向; `egoPlus: true`）
- 「（何も言わない）」（沈黙エンド方向）

条件を満たさない場合、この選択肢は表示されず該当ステップがスキップされる（`condition: 'mysteryClues.length >= 2'` の評価が `false` のため）。

---

## 7. レスポンシブ設計

### ブレークポイント

| ブレークポイント | 対象 | 変更内容 |
|---------------|------|---------|
| `max-width: 720px` | タイトル画面 | `.ts-body` のパディング縮小（`36px 52px` → `28px 24px`）、浮遊タイムライン非表示（`display: none`） |
| `max-width: 700px` | Yアプリ | 右サイドバー非表示（`.y-right-col { display: none }`）、サイドバーのテキストラベル非表示 |

### モバイル対応方針

現状の実装はデスクトップ（PC）環境を主眼に設計されており、モバイル対応は最小限である。主な制約：

1. **ウィンドウシステム**: ドラッグ&ドロップ前提のため、タッチ操作では一部機能が動作しない
2. **メインレイアウト**: `main-layout` の2カラム（340px + flex:1）はモバイルでは横幅が不足する
3. **スペースインベーダー**: タッチボタン（`.inv-touch-btns`）が用意されており、最低限のモバイル操作に対応
4. **body設定**: `overflow: hidden` で縦スクロールを抑止しているため、スマートフォンでの表示は意図していない

**実際の対応範囲:**

```css
/* タイトル画面のみ720px以下で調整 */
@media (max-width: 720px) {
  .ts-body { padding: 28px 24px 22px; }
  .ts-timeline { display: none; }
}
```

---

## 8. アクセシビリティ

### コントラスト比

主要な文字色と背景色の組み合わせ：

| 前景色 | 背景色 | 用途 | 推定コントラスト比 |
|--------|--------|------|-----------------|
| `#e8e8f0`（--text） | `#16161f`（--surface） | メインテキスト | 約13:1（AA・AAA合格） |
| `#888899`（--text-dim） | `#16161f`（--surface） | サブテキスト | 約4.5:1（AA合格） |
| `#e8e8f0`（--text） | `#0d0d14`（--bg） | チャットエリア | 約14:1（AA・AAA合格） |
| `#ff6b9d`（--accent） | `#0d0d14`（--bg） | アクセントテキスト | 約6:1（AA合格） |
| `#ffffff` | `#c42b1c`（--win11-close-hover） | 閉じるボタン | 約5:1（AA合格） |

### フォーカス管理

現状の実装ではカスタムフォーカスリングは定義されておらず、ブラウザデフォルトのアウトラインに依存している。キーボード操作（Tab移動）については：

- `cursor: pointer` の付いたインタラクティブ要素は多数あるが、`tabindex` の明示的な設定は確認されていない
- ウィンドウのフォーカス管理は `bringToFront()` でz-indexを操作することで実現している（キーボードフォーカスとは別）
- `user-select: none` がタイトルバー・デスクトップアイコン等に付与されており、誤選択を防止している

### 改善余地

- `<button>` 要素への `aria-label` 付与（特にウィンドウ操作ボタン）
- カスタムフォーカスリングの実装（`:focus-visible` 対応）
- 選択肢ボタンへのキーボードナビゲーション対応（`Enter`/`Space` での選択）

---

## 9. 今後のUI改善案

### 優先度：高

1. **モバイルレイアウト対応**
   - チャットパネルとゲームパネルをタブ切り替えに変更、またはスライド式に
   - ウィンドウシステムをモバイルでは固定レイアウトにフォールバック
   - `touch-action` の適切な設定でドラッグ誤操作を防止

2. **フォーカス・キーボード操作改善**
   - `:focus-visible` スタイルの追加
   - 選択肢ボタンへの `aria-label`・`role="button"` の付与
   - `Tab`キーで選択肢を順番に選べるよう `tabindex` の整理

3. **素材カードのアクセシビリティ**
   - ロック中カード（`.card-flip-wrapper.locked`）に `aria-disabled="true"` の付与
   - カードフリップのアニメーションを `prefers-reduced-motion` に対応

### 優先度：中

4. **通知システムの改善**
   - `aria-live="polite"` をトースト通知コンテナに追加
   - 複数通知が重なった際のスタック表示改善

5. **チャットメッセージの読み上げ対応**
   - 新着メッセージを `aria-live` で読み上げ
   - タイピングインジケーター消去時に適切なアナウンス

6. **Yアプリの充実**
   - クライアントのSNS投稿が投稿フェーズ後に自動追加されるリアルタイム感の強化
   - DM機能UIの追加（現在はチャトルのみ）

### 優先度：低

7. **アニメーション設定の拡張**
   - `prefers-reduced-motion` メディアクエリ対応（現在は未対応）
   - BGM以外のSEボリューム設定の追加

8. **タイトル画面のv3デザイン**
   - 現在の「新デザイン（ウィンドウ型）」「旧デザイン（ロゴ型）」に加え、キャラクタービジュアル前面配置型を追加

9. **エンディング演出の強化**
   - エンディング別の背景グラデーションカラー差別化（現在は全エンド共通の `#1a0a2e`）
   - エンドごとのBGMフェードイン/アウト

10. **コンポーネントライブラリ化**
    - 再利用頻度の高いコンポーネント（`.choice-btn`・`.card-tag`・`.stat-chip`）をCSS変数ベースで抽象化し、キャラクター別テーマの適用を容易にする
