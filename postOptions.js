// ===== 文体オプション =====
// textFn: 絵文字を文中に埋め込んだ投稿テキストを返す関数
// isBuzz: trueの場合 buzz-risk スタイルを適用
const styleOptions = [
  {
    id: 0, label: '短くシンプルに',
    textFn: () => '今朝のゼラニウム🌿 去年より元気そう。',
    buzz: 30, self: 80
  },
  {
    id: 1, label: '丁寧に感情を込めて',
    textFn: () => '植物って正直だなって思う🌱 ちゃんと水をあげた日は元気に咲いてくれる。私もそうありたい。',
    buzz: 50, self: 70
  },
  {
    id: 2, label: 'バズを狙って大胆に 🔥',
    textFn: () => '【100日チャレンジ✨】毎日植物の写真投稿します！フォローよろしく！',
    buzz: 85, self: 15, isBuzz: true
  },
  {
    id: 3, label: '失敗も含めてリアルに',
    textFn: () => 'また写真ぶれた😅 でも今日も元気に咲いてたから良し🌿',
    buzz: 45, self: 90
  }
];

// ===== ハッシュタグオプション =====
const hashOptions = [
  { id:0, label:'#植物のある暮らし',        val:'#植物のある暮らし',        buzz:30,  self:15 },
  { id:1, label:'#今日の一枚',              val:'#今日の一枚',              buzz:20,  self:20 },
  { id:2, label:'#バズれ #フォロワー増やしたい', val:'#バズれ #フォロワー増やしたい', buzz:40,  self:-30, isBuzz:true },
  { id:3, label:'#ゆるく記録する',           val:'#ゆるく記録する',           buzz:15,  self:35 },
  { id:4, label:'タグなし',                val:'',                        buzz:-10, self:5 }
];