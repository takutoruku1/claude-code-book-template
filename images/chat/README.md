# チャット用画像フォルダ

このフォルダにはチャトル（チャットアプリ）のやり取りで表示する画像を配置します。

## 画像の使い方

`js/scenario.js` の `CHAT_FLOWS` でメッセージステップに `image` フィールドを追加するだけです。

```js
{
  id: 'midori_plant_detail',
  from: 'client',
  text: 'ゼラニウムが多いですね。あとハーブとか。',
  image: 'images/chat/midori_geranium.png',  // ← これを追加
  clippable: true,
  keyword: '毎朝見るのが好き'
},
```

## 現在使われているファイル名（みどりルート）

| ファイル名 | 使われる場面 |
|---|---|
| `midori_geranium.png` | ゼラニウムの話をするとき（窓際の植物写真） |
| `midori_morning.png` | 素材を送るとき（朝の写真） |

## 推奨サイズ

- **幅**: 400〜800px 程度
- **形式**: PNG / JPG / WebP
- **注意**: チャット吹き出し内では最大幅 240px で表示されます。クリックすると拡大表示（ライトボックス）されます。
