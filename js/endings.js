// ===== エンディングデータ全文 v2.0 =====
//
// 【フィールド共通仕様】全エンドで同じフィールドセットを持つ。使わない場合は null。
//
// bgmTrack        : 'ending_piano' | 'ending_strings' | null（nullは完全無音）
// fadeDuration    : BGMフェードアウト秒数（nullはフェードなし・即停止）
// blackoutDuration: 暗転秒数（0は暗転なし）
// noBlackout      : true の場合は暗転せず画面をそのまま保持（ズレエンドのみ）
// monologueInterval: モノローグ1行あたりの表示間隔ms（エンドごとに個別設定）
// bgmNote         : BGMの特別な再生指示。文字列 | null
// bgmDelay        : BGM再生開始までの遅延ms（null は即再生）
// clientMessage   : 依頼者からの最後のメッセージ。\n で改行。null の場合は表示しない
// noReplyEffect   : true の場合、主人公の返信選択肢が出かけて消える演出を入れる
// lastChoice      : エンド内で最後に提示する選択肢の配列 | null
// monologue       : 表示テキストの配列。'' は spacer（monologueInterval 分の追加間隔）
//
// 【zange / chinmoku 専用フィールド】
// typingText      : タイピング演出で入力欄に打ち込むテキスト
// typingRetry     : true の場合、一度消して打ち直す演出を入れる
// karenResponse   : 花蓮の返答行の配列。各行に pauseAfter(ms) を持てる
// karenTypingLoops: タイピングインジケーターが出ては消える回数
// appIconFade     : true の場合、ばずったー.app アイコンがフェードアウト
// silenceDuration : 完全無音を保つ時間ms（retryButtonDelayと同値にすること）
// retryButtonDelay: 「もう一度」ボタンが出現するまでの遅延ms
// mysteryMessage  : 差出人不明のメッセージオブジェクト | null
//
// 【エンド間の依存関係】
// zange / chinmoku は kidoku のエンドフロー内 lastChoice を経由して到達する
// kidoku を通らずに zange / chinmoku に到達するパスは存在しない

const ENDINGS = {

  // ----------------------------------------------------------------
  jiritu: {
    emoji: '🌿', name: '自立エンド',
    condition: 'みどりルート / selfScore >= 65',
    requires: null,

    bgmTrack: 'ending_piano',
    fadeDuration: 6,         // saihan(4) < jiritu(6) < toutatu(8) の順。中程度の余韻
    blackoutDuration: 4,
    noBlackout: false,
    monologueInterval: 1800,
    bgmNote: null,
    bgmDelay: null,

    clientMessage: '昨日、自分で投稿してみました。うまくは書けてないけど、私の言葉で。\nお母さんから電話が来ました。「読んだよ」って。それだけ言って切れて。\nそれだけで、十分でした。ありがとうございました🌿',
    noReplyEffect: true, // 入力欄グレーアウト演出。翻訳者の仕事が終わったことを示す
    lastChoice: null,
    typingText: null, typingRetry: false,
    karenResponse: null, karenTypingLoops: 0,
    appIconFade: false,
    silenceDuration: null, retryButtonDelay: 5000,
    mysteryMessage: null,

    monologue: [
      '翻訳、というのは本当は',
      '消えることだと思う。',
      '',
      '言葉が届いたなら、',
      '翻訳者はもういらない。',
      '',
      'それで、いい——のかもしれない。', // 修正：「それで、いい。」→ 不確かさを残す
      '…………',
      'たぶん、それで——'  // ← ここで止まる
    ]
  },

  // ----------------------------------------------------------------
  toutatu: {
    emoji: '🌙', name: '到達エンド',
    condition: '朔ルート / selfScore >= 60 かつ kShinonoya=true',
    requires: null,

    bgmTrack: 'ending_strings',
    fadeDuration: 8,         // 弦楽器の単音が減衰。止まらず遠くなる
    blackoutDuration: 3,
    noBlackout: false,
    monologueInterval: 2000, // 1行ごとに間を長く取る
    bgmNote: '弦楽器の単音が減衰していく構成。止まらず、ただ遠くなるように再生すること。',
    bgmDelay: null,

    clientMessage: '昨日のDM、返信しました。ありがとうございますって。\n既読ついて、返信は来なかった。でもなんか、それでよかった気がして。\n237時間の模型、今日屋根がはまりました。',
    noReplyEffect: true, // 返信選択肢が出かけて消える
    lastChoice: null,
    typingText: null, typingRetry: false,
    karenResponse: null, karenTypingLoops: 0,
    appIconFade: false,
    silenceDuration: null, retryButtonDelay: 5000,
    mysteryMessage: null,

    monologue: [
      '届いた。',
      '',
      '誰に届いたか、',
      '朔さんはきっと知らない。',
      '',
      '私は知っている。',
      'それを言える立場に、',
      '私はない。',
      '',
      '…………',
      '237時間の屋根が、',
      '今日はまった。'
    ]
  },

  // ----------------------------------------------------------------
  saihan: {
    emoji: '☕', name: '再訪エンド',
    condition: '誠司ルート / buzzScore < 65 かつ selfScore < 65', // 修正：数値で明示
    requires: null,

    bgmTrack: 'ending_piano',
    fadeDuration: 4,         // 全エンド最短。軽い余韻に徹する
    blackoutDuration: 2,
    noBlackout: false,
    monologueInterval: 1500, // 他より速め。軽さを演出
    bgmNote: 'アコースティックギターの短いフレーズ1回のみ。繰り返さない。',
    bgmDelay: null,

    clientMessage: '先週、若いお客さんが来て。SNSで見ましたって言ってくれて。\nコーヒー飲んで、また来ますって帰った。それだけなんですけど。\n今日のメニュー、また気分次第にしました笑 なんかそれが、うちっぽいので。',
    noReplyEffect: true, // 追加：主人公は何も返さない。静かに仕事が終わる
    lastChoice: null,
    typingText: null, typingRetry: false,
    karenResponse: null, karenTypingLoops: 0,
    appIconFade: false,
    silenceDuration: null, retryButtonDelay: 5000,
    mysteryMessage: null,

    monologue: [
      '「また来ます」は',
      '小さい言葉だ。',
      '',
      'でも「また来ます」を',
      '言わせる場所は、',
      'たぶん、',
      'ずっとそこにある。',
      '',
      '…………',
      '今日のおすすめ、気分次第。'
    ]
  },

  // ----------------------------------------------------------------
  kidoku: {
    emoji: '🌸', name: '既読エンド',
    condition: '花蓮ルート / selfScore >= 65 かつ flashbackPhase >= 3',
    requires: null,

    bgmTrack: 'ending_piano',
    fadeDuration: 12,        // 全エンド最長
    blackoutDuration: 6,     // 全エンド最長
    noBlackout: false,
    monologueInterval: 2500, // 全エンド最も遅い。1行ずつ重く沈む
    bgmNote: '完全な無音から始まり、ピアノの単音が1つだけ鳴る。その後また無音に戻る。',
    bgmDelay: 3000,          // 追加：暗転開始から3秒後にピアノ1音が鳴る

    clientMessage: 'あの。姉のLINE、今朝、既読がついていました。\n返信はまだないけど。でも、読んでくれた。\n……ありがとうございました。',
    noReplyEffect: false,
    lastChoice: [
      { text: '「……よかった」とだけ送る', egoPlus: true },
      { text: '（画面を閉じる）' }
    ],
    typingText: null, typingRetry: false,
    karenResponse: null, karenTypingLoops: 0,
    appIconFade: false,
    silenceDuration: null, retryButtonDelay: 5000,
    mysteryMessage: null,

    monologue: [
      '3年前の記事は、今もある。',
      '',
      '消したことはない。',
      '消す権利が、',
      '私にはないと思っていたから。',
      '',
      '篠宮 カレンさんが',
      '既読を押した、その瞬間——',
      '',
      'あれは、許しだったのか。',
      '確認だったのか。',
      '',
      '…………',
      'わからないまま、明日も仕事をする。' // 修正：3行→1行に圧縮
    ]
  },

  // ----------------------------------------------------------------
  zure: {
    emoji: '🔥', name: 'ズレエンド',
    condition: '任意ルート / buzzScore >= 65 かつ selfScore < 50',
    requires: null,

    bgmTrack: null,          // BGMなし・stopBGM()を呼ぶ
    fadeDuration: null,      // 追加：フェードなし・即停止を明示
    blackoutDuration: 0,     // 修正：noBlackout と意味が重複するため 0 で統一
    noBlackout: true,        // 暗転しない。フィード画面が明るいまま終わる
    monologueInterval: 1600,
    bgmNote: null,
    bgmDelay: null,

    clientMessage: 'すごいですね。こんなにいいねが来るとは思わなくて。\nなんか…これ、私じゃない気がして。', // 修正：感情の揺れを強く
    noReplyEffect: false,
    lastChoice: null,
    typingText: null, typingRetry: false,
    karenResponse: null, karenTypingLoops: 0,
    appIconFade: false,
    silenceDuration: null, retryButtonDelay: 5000,
    mysteryMessage: null,

    monologue: [
      '3年前も、こうだった。',
      '',
      '数字が増えるのを見ていた。',
      'それが正しいことだと',
      '思っていた。',
      '',
      '…………',
      '「これ、私じゃない気がして」',
      '',
      '同じ問いだ。'
    ]
  },

  // ----------------------------------------------------------------
  zange: {
    emoji: '🎭', name: '贖罪エンド',
    condition: '花蓮ルート後 / egoScore > 0',
    requires: 'kidoku', // kidoku の lastChoice 経由で到達。直接到達するパスはない

    bgmTrack: 'ending_strings',
    fadeDuration: 10,
    blackoutDuration: 5,
    noBlackout: false,
    monologueInterval: 2200,
    bgmNote: null,
    bgmDelay: null,

    clientMessage: null, // タイピング演出で代替するため使わない
    noReplyEffect: false,
    lastChoice: null,

    typingText: '篠宮さん。3年前、記事を書いたのは私です。',
    typingRetry: true,   // 一度消して打ち直す演出あり
    karenResponse: [
      { text: '知っていました。',    pauseAfter: 8000 }, // 修正：コメント→フィールド化
      { text: 'だから、頼みました。', pauseAfter: 0 }    // ← ここで止まる。赦しも拒絶も書かない
    ],
    karenTypingLoops: 3, // タイピングインジケーターが3回出ては消える（約12秒）

    appIconFade: false,
    silenceDuration: null, retryButtonDelay: 5000,
    mysteryMessage: null,

    monologue: [
      '言った。',
      '',
      'それだけだ。',
      '',
      '赦されたかどうかは',
      '聞かなかった。',
      '聞く必要が、',
      'なかった気がした。',
      '',
      '…………',
      '「だから、頼みました。」',
      '',
      'その意味が、まだわからない。' // 修正：末尾4行→1行に圧縮
    ]
  },

  // ----------------------------------------------------------------
  chinmoku: {
    emoji: '🖤', name: '沈黙エンド',
    condition: '花蓮ルート後 / egoScore <= 0',
    requires: 'kidoku', // kidoku の lastChoice 経由で到達。直接到達するパスはない

    bgmTrack: null,          // BGMなし・完全無音
    fadeDuration: null,      // 追加：フェードなし・即停止を明示
    blackoutDuration: 4,     // 追加：設計書にはあったがデータに未記載だったため追加
    noBlackout: false,
    monologueInterval: 2000,
    bgmNote: null,
    bgmDelay: null,

    clientMessage: null,     // mysteryMessage で代替するため使わない
    noReplyEffect: false,
    lastChoice: null,
    typingText: null, typingRetry: false,
    karenResponse: null, karenTypingLoops: 0,

    appIconFade: true,       // ばずったー.app アイコンがゆっくりフェードアウト

    // silenceDuration と retryButtonDelay は同値にすること
    // 無音が終わった瞬間にボタンが出る = プレイヤーを暗闇に10秒置く
    silenceDuration: 10000,
    retryButtonDelay: 10000,

    mysteryMessage: {
      sender: '──────',        // クリックで開くまで差出人不明
      senderRevealed: '——カ', // 開いた時に右端から1文字ずつ消えて '——カ' だけ残る逆再生アニメ
      text: '翻訳、ありがとうございました。'
    },

    monologue: [
      '返信しなかった。',
      '',
      'それが正しかったのか、',
      '正しくなかったのか、',
      '今もわからない。',
      '',
      '「——カ」',
      '',
      '読んだ。',
      '削除はしなかった。',
      '',
      '…………',
      '明日も、仕事がある。'
    ]
  },

  // ----------------------------------------------------------------
  jizoku: {
    emoji: '🌱', name: '継続エンド',
    condition: 'みどりルート / selfScore < 65 かつ buzzScore < 65',
    requires: null,

    bgmTrack: 'ending_piano',
    fadeDuration: 4,
    blackoutDuration: 2,
    noBlackout: false,
    monologueInterval: 1600,
    bgmNote: null,
    bgmDelay: null,

    clientMessage: null,
    noReplyEffect: true,
    lastChoice: null,
    typingText: null, typingRetry: false,
    karenResponse: null, karenTypingLoops: 0,
    appIconFade: false,
    silenceDuration: null, retryButtonDelay: 5000,
    mysteryMessage: null,

    monologue: [
      '大きくなくていい、と',
      '誰かが言っていた。',
      '',
      '毎朝、植物に水をやる。',
      'それと同じことを、',
      '今日もSNSでやっている。',
      '',
      '…………',
      '届いている。',
      'たぶん、それで十分だ。'
    ]
  }

};
