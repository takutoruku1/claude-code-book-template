// ===== 素材IDを取得するヘルパー =====
function getSelectedCardIds() {
  if (typeof GS === 'undefined' || !GS.route) return [];
  return GS.selectedCards.map(i => MATERIALS[GS.route]?.[i]?.id || '');
}

// ===== キャラクター×文体×素材別テキスト =====
const POST_TEXTS = {
  midori: {
    0: (cards) => cards.includes('m_plant')
      ? '今朝のゼラニウム🌿 少しぼけてるけど、この光の朝が好き。'
      : '今朝のゼラニウム🌿 去年より元気そう。',
    1: (cards) => cards.includes('m_line')
      ? '植物って正直だなって思う🌱 ちゃんと水をあげた日は元気に咲いてくれる。お母さんに見せたくて撮った。'
      : '植物って正直だなって思う🌱 ちゃんと水をあげた日は元気に咲いてくれる。私もそうありたい。',
    2: () => '【100日チャレンジ✨】毎日植物の写真投稿します！フォローよろしく！',
    3: (cards) => cards.includes('m_food')
      ? 'また料理失敗した😅 でも食べたら美味しかった。今日も元気に咲いてたから良し🌿'
      : 'また写真ぶれた😅 でも今日も元気に咲いてたから良し🌿',
  },
  saku: {
    0: (cards) => cards.includes('s_desk')
      ? '作業台、今日も静かです。工具が並んでいる。🔧'
      : '作業台、今日も静かです。🔧',
    1: (cards) => cards.includes('s_memo')
      ? '237時間かけてきた模型。まだ屋根が合わない。\nでも今日も向き合いたいと思う。それだけです。'
      : '一人で作り続けてきた。誰かに見てもらいたいと思ったのは、最近のことです。',
    2: () => '【制作記録🔥】237時間の超大作ジオラマ、完成まで毎日投稿します！',
    3: (cards) => cards.includes('s_light')
      ? '意図せず光がぼけた。でもなんか、これが一番好きかもしれない📷'
      : '今日もうまくいかなかった。でも、続けている😅',
  },
  seiji: {
    0: (cards) => cards.includes('sj_menu')
      ? '今日のおすすめ、気分次第。☕ 字が歪んでも、それがうちらしいので。'
      : '今日のおすすめ、気分次第。☕',
    1: (cards) => cards.includes('sj_sign')
      ? '古い商店街の、古い喫茶店。\n「喫茶 ゆきわりそう」の看板、今日も変わらずそこにある。'
      : '古い商店街の、古い喫茶店。\n字の歪んだメニューを、今日も書き直した。これが、うちです。',
    2: () => '【映えない喫茶店が話題🔥】あえてレトロにこだわる老舗カフェのリアルを毎日投稿！',
    3: (cards) => cards.includes('sj_memo')
      ? '今日の失敗：豆を入れすぎた。苦いけど嫌いじゃない。\n今日のおすすめは、気分次第のままです。☕'
      : '今日もうまくいかないことがあった。\nでもそれがうちっぽいので、良しとする。☕',
  },
  karen: {
    0: (cards) => cards.includes('k_flower')
      ? '今日の生け花、白と淡紅。姉に見せたくて活けた。🌸'
      : '今日の生け花、白と淡紅。🌸',
    1: (cards) => cards.includes('k_line')
      ? '花を活けながら、届けたい人のことを考えた。\n言葉にはできないけれど、見ていてほしい。🌸'
      : '花を活けながら、誰かに届けたいと思った。\nうまく言葉にはできないけれど、見ていてほしい人がいる。🌸',
    2: () => '【生け花を毎日投稿🌸】日本の伝統美を発信中！フォローお待ちしています！',
    3: (cards) => cards.includes('k_flower')
      ? '今日は少し斜めになってしまった。\n不完全なほうがかえって自然に見える気がして。🌸'
      : 'うまくいかない日もある。\nでも、花はちゃんと咲いていた。🌸',
  },
};

// ===== 文体オプション =====
const styleOptions = [
  {
    id: 0, label: '短くシンプルに',
    textFn: () => POST_TEXTS[GS.route]?.[0]?.(getSelectedCardIds()) ?? '今日の一枚🌿',
    buzz: 30, self: 80
  },
  {
    id: 1, label: '丁寧に感情を込めて',
    textFn: () => POST_TEXTS[GS.route]?.[1]?.(getSelectedCardIds()) ?? '今日も、続けています。',
    buzz: 50, self: 70
  },
  {
    id: 2, label: 'バズを狙って大胆に 🔥',
    textFn: () => POST_TEXTS[GS.route]?.[2]?.(getSelectedCardIds()) ?? '【毎日投稿✨】フォローよろしく！',
    buzz: 85, self: 15, isBuzz: true
  },
  {
    id: 3, label: '失敗も含めてリアルに',
    textFn: () => POST_TEXTS[GS.route]?.[3]?.(getSelectedCardIds()) ?? '今日も、うまくいかなかった😅',
    buzz: 45, self: 90
  }
];

// ===== ハッシュタグオプション（キャラクター別） =====
// hashUnlock のインデックス対応は維持しつつ、ラベル・値をキャラ別に変える
const HASH_OPTIONS_BY_ROUTE = {
  midori: [
    { id:0, label:'#植物のある暮らし',           val:'#植物のある暮らし',           buzz:30,  self:15 },
    { id:1, label:'#今日の一枚',                 val:'#今日の一枚',                 buzz:20,  self:20 },
    { id:2, label:'#バズれ #フォロワー増やしたい', val:'#バズれ #フォロワー増やしたい', buzz:40,  self:-30, isBuzz:true },
    { id:3, label:'#ゆるく記録する',              val:'#ゆるく記録する',              buzz:15,  self:35 },
    { id:4, label:'タグなし',                    val:'',                            buzz:-10, self:5 },
  ],
  saku: [
    { id:0, label:'#ジオラマ #模型制作',          val:'#ジオラマ #模型制作',          buzz:30,  self:15 },
    { id:1, label:'#今日の一枚',                 val:'#今日の一枚',                 buzz:20,  self:20 },
    { id:2, label:'#バズれ #フォロワー増やしたい', val:'#バズれ #フォロワー増やしたい', buzz:40,  self:-30, isBuzz:true },
    { id:3, label:'#ゆるく記録する',              val:'#ゆるく記録する',              buzz:15,  self:35 },
    { id:4, label:'タグなし',                    val:'',                            buzz:-10, self:5 },
  ],
  seiji: [
    { id:0, label:'#喫茶店 #純喫茶',             val:'#喫茶店 #純喫茶',             buzz:30,  self:15 },
    { id:1, label:'#今日の一枚',                 val:'#今日の一枚',                 buzz:20,  self:20 },
    { id:2, label:'#バズれ #フォロワー増やしたい', val:'#バズれ #フォロワー増やしたい', buzz:40,  self:-30, isBuzz:true },
    { id:3, label:'#ゆるく記録する',              val:'#ゆるく記録する',              buzz:15,  self:35 },
    { id:4, label:'タグなし',                    val:'',                            buzz:-10, self:5 },
  ],
  karen: [
    { id:0, label:'#生け花 #いけばな',            val:'#生け花 #いけばな',            buzz:30,  self:15 },
    { id:1, label:'#今日の一枚',                 val:'#今日の一枚',                 buzz:20,  self:20 },
    { id:2, label:'#バズれ #フォロワー増やしたい', val:'#バズれ #フォロワー増やしたい', buzz:40,  self:-30, isBuzz:true },
    { id:3, label:'#ゆるく記録する',              val:'#ゆるく記録する',              buzz:15,  self:35 },
    { id:4, label:'タグなし',                    val:'',                            buzz:-10, self:5 },
  ],
};

// goToPost() から参照するエントリポイント
function getHashOptions(route) {
  return HASH_OPTIONS_BY_ROUTE[route] ?? HASH_OPTIONS_BY_ROUTE.midori;
}

// 後方互換のため旧変数名も残す（直接参照している箇所があれば安全に動く）
const hashOptions = HASH_OPTIONS_BY_ROUTE.midori;
