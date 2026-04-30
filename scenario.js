// ===== チャットフロー定義 =====
//
// 【フィールド仕様】
// id       : このステップの一意なID。choices の next はこのIDを参照する
// from     : 'client' | 'player' | 'system' | 'choices' | 'trigger'
// text     : 表示テキスト（\n で改行）
// opts     : choices の選択肢配列。各 opt は { text, next, selfBonus?, buzzBonus?, egoPlus?, setFlag? }
// next     : 文字列ID で次のステップを指定（数値インデックス参照は廃止）
// condition: このステップを表示する条件フラグ名。フラグが立っている場合のみ表示
// pause    : このステップの表示前に待つミリ秒
//
// 【trigger.action の種類】
// 'showMaterial' : 素材カード画面を表示し、会話を一時停止する
// 'flashback2'   : フラッシュバック段階2を発火（isAnimating=true → モノローグ → endAnim()）
// 'showPost'     : 投稿ビルダー画面 → 反響フェーズを表示し、完了後に resumeAt から会話を再開する
//
// 【trigger の resumeAt フィールド】
// showMaterial の trigger に resumeAt を指定すると、素材フェーズ完了後に
// そのIDのステップから会話を再開する。resumeAt がない場合は再開しない。
// 例: { from:'trigger', action:'showMaterial', resumeAt:'saku_dilemma1' }
//     → 素材確認が終わったら saku_dilemma1 から会話を再開する
//
// 【condition フィールドの動作規約】
// condition 付きステップは、指定フラグが GAME_STATE に true で存在する場合のみ表示する。
// 表示後は次のステップ（配列の次の要素）へ自動進行する。next は持たない。
// condition を満たさない場合はそのステップをスキップして次の要素へ進む。
// ※ next を持つのは choices 型のみ。
//
// 【ミステリーフラグの発火】
// mysteryClues への追加は MATERIALS の mysteryFlag フィールドで一元管理する。
// CHAT_FLOWS 内の setFlag trigger は廃止（二重管理を解消）。
// カードをめくった時に cards.js が mysteryFlag を読んで GAME_STATE.mysteryClues に push する。
//
// 【selfBonus / buzzBonus の反映タイミング】
// 選択肢を選んだ瞬間に score.js の applyBonus(selfBonus, buzzBonus) を呼ぶ。
// postOptions.js のスコアと合算後に Math.min(100, Math.max(0, val)) でクランプする。

const CHAT_FLOWS = {

  // =====================================================================
  // みどりルート（チュートリアル）
  // =====================================================================
  midori: [

    // --- 挨拶 ---
    {
      id: 'midori_hello',
      from: 'client',
      text: 'はじめまして！SNS代行の件でご連絡しました🌿\nよろしくお願いします…！'
    },
    {
      id: 'midori_hello_reply',
      from: 'choices', opts: [
        { text: 'こちらこそ！よろしくお願いします。まず少し聞かせてもらえますか？', next: 'midori_sns_start' },
        { text: 'はじめまして。どんなご依頼か教えてください',                      next: 'midori_sns_start' }
      ]
    },

    // --- どんなSNSか ---
    {
      id: 'midori_sns_start',
      from: 'client',
      text: 'Instagramをやってみたいなって思って。\nでも…何から始めればいいかわからなくて。'
    },
    {
      id: 'midori_sns_reply',
      from: 'choices', opts: [
        { text: '投稿したいものは何かありますか？', next: 'midori_photo_talk' },
        { text: '今まで試したことはありますか？',   next: 'midori_photo_talk' }
      ]
    },

    // --- 写真の話 ---
    {
      id: 'midori_photo_talk',
      from: 'client',
      text: '植物の写真と、たまに料理も。\n家に植物がたくさんあって、よく写真撮るんですけど。'
    },
    {
      id: 'midori_photo_reply',
      from: 'choices', opts: [
        { text: 'どんな植物ですか？',            next: 'midori_plant_detail' },
        { text: '料理も作るんですね！どんな料理ですか？', next: 'midori_plant_detail' }
      ]
    },

    // --- 植物の話 ---
    {
      id: 'midori_plant_detail',
      from: 'client',
      text: 'ゼラニウムが多いですね。あとハーブとか。\n窓際に並べてるんですけど、毎朝見るのが好きで。',
      clippable: true, keyword: '毎朝見るのが好き'
    },
    {
      id: 'midori_plant_reply',
      from: 'choices', opts: [
        { text: '毎朝見るんですね。どんな気持ちになりますか？', next: 'midori_cant_post' },
        { text: '写真に撮りたくなりますよね',                 next: 'midori_cant_post' }
      ]
    },

    // --- 「でも投稿できない」へ ---
    {
      id: 'midori_cant_post',
      from: 'client',
      text: 'なんか…元気もらえるんですよね。\nでもいざ投稿しようとすると、センスないし、\nうまく撮れないしって思って。ずっとできなくて😢'
    },
    {
      id: 'midori_cant_post_reply',
      from: 'choices', opts: [
        { text: '「センスない」って、どういう意味で使ってますか？', next: 'midori_sense_talk' },
        { text: '撮った写真、手元にありますか？',                 next: 'midori_sense_talk' }
      ]
    },

    // --- センスの話 ---
    {
      id: 'midori_sense_talk',
      from: 'client',
      text: 'なんか…インスタっぽくないというか。\nきれいに撮れてないし、ぼけてたりして。\n人のを見ると全然違うなって。'
    },
    {
      id: 'midori_sense_reply',
      from: 'choices', opts: [
        { text: 'ぼけてる写真、嫌いですか？',          next: 'midori_wobble' },
        { text: '「インスタっぽい」のを目指してたんですか？', next: 'midori_wobble' }
      ]
    },

    // --- 揺らぎ ---
    {
      id: 'midori_wobble',
      from: 'client',
      text: '…あ、嫌いじゃないかも。\nぼけてても、その朝の空気みたいなのが\n写ってる気がして、好きだったりするんですけど。'
    },
    {
      id: 'midori_wobble_reply',
      from: 'choices', opts: [
        { text: 'それが「みどりさんらしさ」だと思います', next: 'midori_reason_lead' },
        { text: 'その感覚、ちゃんと伝わりますよ',       next: 'midori_reason_lead' }
      ]
    },

    // --- お母さんの話へ ---
    {
      id: 'midori_reason_lead',
      from: 'client',
      text: 'ありがとうございます…なんか、それ聞いて\nちょっと背中押された気がします。\n実はSNS始めたい理由があって。'
    },
    {
      id: 'midori_reason_ask',
      from: 'choices', opts: [
        { text: '聞かせてもらえますか？', next: 'midori_mother' },
        { text: 'どんな理由ですか？',     next: 'midori_mother' }
      ]
    },

    // --- お母さんの話 ---
    {
      id: 'midori_mother',
      from: 'client',
      text: 'お母さんが最近、施設に入ったんです。\n離れてても繋がってるって感じたくて。\n私の日常、見ててほしいなって。',
      clippable: true, keyword: 'お母さんに届けたい'
    },
    {
      id: 'midori_mother_reply',
      from: 'choices', opts: [
        { text: 'お母さんに届く投稿、一緒に作りましょう', next: 'midori_closing_client', selfBonus: 5 },
        { text: 'それは…素敵な理由ですね',               next: 'midori_closing_client' }
      ]
    },

    // --- クロージング ---
    {
      id: 'midori_closing_client',
      from: 'client',
      text: '泣きそう…🌿\nなんかこうやって話してたら、\n自分が何を投稿したいかわかってきた気がします。'
    },
    {
      id: 'midori_closing_player1',
      from: 'player',
      text: 'じゃあ、その感覚を素材にしましょう。\n写真とか、メモとか、送ってもらえますか？'
    },
    {
      id: 'midori_send1',
      from: 'client',
      text: 'はい！今から送りますね。\nうまく撮れてないやつばっかりだけど…笑'
    },
    {
      id: 'midori_closing_player2',
      from: 'player',
      text: 'それで十分です。'
    },
    {
      id: 'midori_send2',
      from: 'client',
      text: '…ありがとうございます🌿'
    },
    { id: 'midori_system',  from: 'system',  text: '→ 素材が届きました' },
    { id: 'midori_trigger', from: 'trigger', action: 'showMaterial', resumeAt: 'midori_timing_intro' },

    // ---- タイミングゲーム ----
    {
      id: 'midori_timing_intro',
      from: 'player',
      text: 'では素材をもとに、投稿を作りましょう。\nただ、SNSは投稿のタイミングも重要なんです。\n試しに、ベストタイミングを狙う練習をしてみませんか？'
    },
    {
      id: 'midori_timing_game',
      from: 'trigger',
      action: 'timingGame',
      resumeAt: 'midori_post_reaction'
    },

    // ---- タイミングゲーム後の反応 ----
    {
      id: 'midori_post_reaction',
      from: 'player',
      text: 'いいですね。このタイミング感を覚えておいてください。\nでは、投稿を作ってみましょう。'
    },
    { id: 'midori_post_trigger', from: 'trigger', action: 'showPost', resumeAt: 'midori_post_end' },

    // ---- 投稿後 ----
    {
      id: 'midori_post_end',
      from: 'system',
      text: ''
    }
  ],

  // =====================================================================
  // 朔ルート
  // =====================================================================
  saku: [

    {
      id: 'saku_hello',
      from: 'client',
      text: 'はじめまして。SNS、やったことなくて。\nでも最近、なんか残したくて。',
      clippable: true, keyword: 'なんか残したくて'
    },
    {
      id: 'saku_hello_reply',
      from: 'choices', opts: [
        { text: '「残したい」って、どんなものですか？', next: 'saku_model' },
        { text: '素材を送ってもらえますか',            next: 'saku_model' }
      ]
    },
    {
      id: 'saku_model',
      from: 'client',
      text: '模型、作ってます。ずっと一人で。\n誰かに見てもらいたいな、と。最近思って。',
      clippable: true, keyword: '誰かに見てもらいたい'
    },

    // フラッシュバック段階2：「残したい」でトリガー
    // flashback2 は演出 trigger。showMaterial と違い resumeAt を使わず、
    // 演出完了後は配列の次のステップ（saku_fb2_after）へ自動進行する。
    {
      id: 'saku_fb2_pre',
      from: 'system',
      text: '— 主人公の記憶が揺れる —',
      pause: 600
    },
    {
      id: 'saku_fb2',
      from: 'trigger',
      action: 'flashback2'
    },

    {
      id: 'saku_fb2_after',
      from: 'player',
      text: '…残す、か。\nじゃあ、何を残したいか聞かせてもらえますか。'
    },
    {
      id: 'saku_send',
      from: 'client',
      // mysteryClues への 'karen' 追加は MATERIALS.saku[0].mysteryFlag で管理。
      // ここでは setFlag trigger を持たない（二重管理を廃止）。
      text: '写真、何枚か送ります。うまく撮れてないけど。\nあと、カレンが好きそうだと思って撮ったのも。'
    },
    { id: 'saku_system',  from: 'system',  text: '→ 素材が届きました' },
    // resumeAt: 素材確認完了後に saku_dilemma1 から会話を再開する
    { id: 'saku_trigger', from: 'trigger', action: 'showMaterial', resumeAt: 'saku_dilemma1' },

    // ---- 葛藤シーン1（素材確認後） ----
    {
      id: 'saku_dilemma1',
      from: 'client',
      text: 'これ…使えないですよね。\nぼけてるし、何が撮りたいかもわかんないし。\nでも捨てられなくて。送ってみました。'
    },
    {
      id: 'saku_dilemma1_reply',
      from: 'choices', opts: [
        { text: '捨てなくていい。これが朔さんの視点です',          next: 'saku_dilemma1_end', selfBonus: 10 },
        { text: 'もう少し明るく撮り直すと、もっと多くの人に届きますよ', next: 'saku_dilemma1_end', buzzBonus: 5 }
      ]
    },
    {
      id: 'saku_dilemma1_end',
      from: 'client',
      text: '…そうですね。じゃあ、出してみます。'
    },
    // 投稿フェーズへ移行。投稿後の反響フェーズ完了後に saku_dilemma2 から会話を再開する
    { id: 'saku_post_trigger', from: 'trigger', action: 'showPost', resumeAt: 'saku_dilemma2' },

    // ---- 葛藤シーン2（投稿後・反響フェーズ完了後） ----
    {
      id: 'saku_dilemma2',
      from: 'client',
      text: 'あの…DMきてて。\n知らないアカウントなんですけど「模型、すごく好きです」って。\nどう返せばいいですか。'
    },
    {
      id: 'saku_dilemma2_reply',
      from: 'choices', opts: [
        { text: 'そのまま素直に、ありがとうと伝えてみてください', next: 'saku_dm_end' },
        { text: '…そのアカウント名、教えてもらえますか',         next: 'saku_dm_name',    egoPlus: true, setFlag: 'kShinonoya' },
        { text: '（何も言わず、次の投稿の話をする）',            next: 'saku_dm_end' }
      ]
    },

    // kShinonoya フラグを立てた選択肢からのみ到達するため condition は不要
    {
      id: 'saku_dm_name',
      from: 'client',
      text: 'え…k_shinonoya、って。\n知り合いですか？'
    },
    {
      id: 'saku_dm_name_reply',
      from: 'player',
      text: '……いえ。\n知らない人だと思います。\n気にしないでください。'
    },

    { id: 'saku_dm_end', from: 'system', text: '' } // 終端マーカー
  ],

  // =====================================================================
  // 誠司ルート
  // =====================================================================
  seiji: [

    {
      id: 'seiji_hello',
      from: 'client',
      text: '突然すみません。喫茶店やってるんですが、\nSNSやったほうがいいよって言われて…。'
    },
    {
      id: 'seiji_hello_reply',
      from: 'choices', opts: [
        { text: 'どんなお店ですか？',        next: 'seiji_shop' },
        { text: 'インスタ映えを意識してみますか', next: 'seiji_shop' }
      ]
    },
    {
      id: 'seiji_shop',
      from: 'client',
      text: '古い商店街の中の、古い店です笑\n常連さんは元気なんですけど、若い人に来てほしくて。',
      clippable: true, keyword: '若い人に来てほしい'
    },
    {
      id: 'seiji_shop_reply',
      from: 'choices', opts: [
        { text: 'その「古さ」が強みかもしれません', next: 'seiji_send', selfBonus: 5 },
        { text: 'インスタ映えを意識してみますか', next: 'seiji_send', buzzBonus: 5 }
      ]
    },
    {
      id: 'seiji_send',
      from: 'client',
      text: 'あ、そっちの方がいいかも。映える店じゃないし。写真送りますね。',
      clippable: true, keyword: '映える店じゃない'
    },
    { id: 'seiji_system',  from: 'system',  text: '→ 素材が届きました' },
    { id: 'seiji_trigger', from: 'trigger', action: 'showMaterial' }
  ],

  // =====================================================================
  // 花蓮ルート（キーパーソン）
  // =====================================================================
  karen: [

    {
      id: 'karen_hello',
      from: 'client',
      text: 'はじめまして。篠宮 花蓮といいます。\nお二人から紹介していただいて。'
    },
    {
      id: 'karen_hello_reply',
      from: 'player',
      text: 'ご連絡ありがとうございます。どんな発信を考えていますか？'
    },
    {
      id: 'karen_flower',
      from: 'client',
      text: '花が好きで。生け花、少しやっています。\nあと…姉に、見ていてほしくて。',
      clippable: true, keyword: '姉に見ていてほしい'
    },
    {
      id: 'karen_question',
      from: 'client',
      text: 'あなたって…昔、ライターさんでしたか？',
      clippable: true, keyword: '過去を知っている'
    },
    {
      id: 'karen_question_reply',
      from: 'choices', opts: [
        { text: '…はい。でも、もう書いていません。', next: 'karen_system', egoPlus: true },
        { text: 'なぜそう思うんですか？',            next: 'karen_system' },
        { text: '（黙って素材の確認を続ける）',       next: 'karen_system' }
      ]
    },
    { id: 'karen_system',  from: 'system',  text: '→ 素材が届きました' },
    // resumeAt: 素材確認完了後に karen_mystery_choice から会話を再開する
    { id: 'karen_trigger', from: 'trigger', action: 'showMaterial', resumeAt: 'karen_mystery_choice' },
    // flashback3 は cards.js 内で k_memo カードをめくった時にトリガー

    // ---- 謎収束選択肢（mysteryClues に 2件以上たまった場合のみ表示）----
    // condition: 'mysteryClues.length >= 2' はエンジンが動的に評価する式。
    // エンジン側の評価処理: canShowStep(step) で condition が文字列の場合は
    // Function('GAME_STATE', 'return ' + step.condition)(GAME_STATE) で評価すること。
    {
      id: 'karen_mystery_choice',
      from: 'choices',
      condition: 'mysteryClues.length >= 2',
      opts: [
        // setFlag:'zange' をここで立てることで、次の karen_zange_response が確実に表示される
        { text: 'あなたのお姉さんに…記事を書いたのは私です', next: 'karen_zange_response', egoPlus: true, setFlag: 'zange' },
        { text: '（何も言わない）',                          next: 'karen_end' }
      ]
    },

    // フォールバック：伏線が未回収のままルートを終えた場合（mysteryClues < 2）
    // system ノードはフォールスルーで次要素へ進むため、karen_end を直後に配置する
    {
      id: 'karen_mystery_fallback',
      from: 'system',
      condition: 'mysteryClues.length < 2',
      text: '— 花蓮の依頼の真意は、まだわからない —'
    },

    { id: 'karen_end', from: 'system', text: '' }, // 終端マーカー（fallback のフォールスルー先）

    // 贖罪エンド方向（endings.js の zange と連動）
    // karen_mystery_choice の next: 'karen_zange_response' でのみ到達。配列の順序では到達しない
    {
      id: 'karen_zange_response',
      from: 'client',
      text: '知っていました。',
      pause: 8000
    },
    {
      id: 'karen_zange_end',
      from: 'client',
      text: 'だから、頼みました。'
    }
  ]
};

// =====================================================================
// 素材カード定義
// =====================================================================
// imgSrc       : null の場合はアイコン+背景色でフォールバック表示
// styleUnlock  : このカードを選択した時に解放される styleOptions のインデックス配列
// hashUnlock   : このカードを選択した時に解放される hashOptions のインデックス配列
// mysteryFlag  : カードをめくった時に GAME_STATE.mysteryClues に push する値。null の場合は何もしない
//               （CHAT_FLOWS の setFlag trigger は廃止し、ここで一元管理する）
// flashback3Trigger : true の場合、めくった時に flashback3 を発火する

const MATERIALS = {
  midori: [
    {
      id: 'm_line', icon: '💬', type: 'スクリーンショット', title: 'お母さんへのLINE',
      desc: '「今日もゼラニウム咲いたよ。去年より元気な気がする。」既読あり・返信あり。',
      tags: ['日常的', '家族へ', '植物愛'],
      styleUnlock: [0, 1], hashUnlock: [0, 1, 3],
      mysteryFlag: null, flashback3Trigger: false, imgSrc: null
    },
    {
      id: 'm_memo', icon: '📓', type: 'メモ帳', title: '走り書きメモ',
      desc: '「料理の失敗ばかりだけど作るのは好き」「完璧じゃなくていいのかな」',
      tags: ['自己開示', '等身大', 'ゆるい'],
      styleUnlock: [1, 3], hashUnlock: [1, 3, 4],
      mysteryFlag: null, flashback3Trigger: false, imgSrc: null
    },
    {
      id: 'm_plant', icon: '📷', type: '写真', title: '窓際の植物写真',
      desc: '少しぼけた朝の光。ゼラニウムが窓際に並ぶ。「うまく撮れてないけど好きな景色」',
      tags: ['温かみ', '日常美', '完璧じゃない'],
      styleUnlock: [0, 3], hashUnlock: [0, 1, 3],
      mysteryFlag: null, flashback3Trigger: false, imgSrc: null
    },
    {
      id: 'm_food', icon: '🍳', type: '写真', title: '手料理の写真',
      desc: '少し歪んだオムレツ。付箋「失敗作だけど美味しかった」が貼ってある。',
      tags: ['失敗OK', 'ユーモア', '正直'],
      styleUnlock: [2, 3], hashUnlock: [2, 3, 4],
      mysteryFlag: null, flashback3Trigger: false, imgSrc: null
    }
  ],

  saku: [
    {
      id: 's_desk', icon: '📷', type: '写真', title: '作業台の全景',
      desc: '工具・模型パーツが整然と並ぶ。付箋「カレンが好きそうだと思って」。',
      tags: ['日常的', '制作感'],
      styleUnlock: [0, 1], hashUnlock: [0, 1],
      mysteryFlag: 'karen', // めくった時に mysteryClues に 'karen' を push
      flashback3Trigger: false, imgSrc: null
    },
    {
      id: 's_light', icon: '📷', type: '写真', title: '窓の隙間から差す朝の光（ぼけ写真）',
      desc: '意図的にピントを外した光の写真。「綺麗だと思った」とだけメモ。',
      tags: ['温かみ', '日常美', '完璧じゃない'],
      styleUnlock: [0, 3], hashUnlock: [0, 3],
      mysteryFlag: null, flashback3Trigger: false, imgSrc: null
    },
    {
      id: 's_model', icon: '📷', type: '写真', title: '完成品の模型（全体）',
      desc: '背景に「ゆきわりそう」の看板がさりげなく見える。',
      tags: ['制作感', '完成'],
      styleUnlock: [1, 2, 3], hashUnlock: [1, 2, 3],
      mysteryFlag: 'yukiwarisou', // めくった時に mysteryClues に 'yukiwarisou' を push
      flashback3Trigger: false, imgSrc: null
    },
    {
      id: 's_memo', icon: '📓', type: 'メモ', title: '制作の走り書き',
      desc: '「今日で237時間。まだ屋根が合わない」「完成したら誰かに見てもらいたい」',
      tags: ['等身大', '継続'],
      styleUnlock: [1, 3], hashUnlock: [1, 3],
      mysteryFlag: null, flashback3Trigger: false, imgSrc: null
    }
  ],

  seiji: [
    {
      id: 'sj_menu', icon: '📷', type: '写真', title: '手書きメニューボード',
      desc: '字が少し歪んでいる。「今日のおすすめ：気分次第」という一行がある。',
      tags: ['ユーモア', 'らしさ'],
      styleUnlock: [0, 1, 2, 3], hashUnlock: [0, 1, 2, 3],
      mysteryFlag: null, flashback3Trigger: false, imgSrc: null
    },
    {
      id: 'sj_sign', icon: '📷', type: '写真', title: '店内の古い看板',
      desc: '「喫茶 ゆきわりそう」の看板。背景に同名の看板が映り込む。',
      tags: ['温かみ', '歴史'],
      styleUnlock: [0, 1], hashUnlock: [0, 1],
      mysteryFlag: 'yukiwarisou', // めくった時に mysteryClues に 'yukiwarisou' を push
      flashback3Trigger: false, imgSrc: null
    },
    {
      id: 'sj_memo', icon: '📓', type: 'メモ', title: '失敗コーヒーの記録',
      desc: '「今日の失敗：豆を多く入れすぎた。苦いけど嫌いじゃない」',
      tags: ['正直', '等身大'],
      styleUnlock: [1, 3], hashUnlock: [1, 3, 4],
      mysteryFlag: null, flashback3Trigger: false, imgSrc: null
    }
  ],

  karen: [
    {
      id: 'k_flower', icon: '🌸', type: '写真', title: '生け花の作品（白・淡紅）',
      desc: '背景に遠景で「ゆきわりそう」の看板。「姉に見せたくて活けた」メモ付き。',
      tags: ['温かみ', '家族へ', '植物愛'],
      styleUnlock: [0, 1, 2], hashUnlock: [0, 1, 2, 3],
      mysteryFlag: 'yukiwarisou', // めくった時に mysteryClues に 'yukiwarisou' を push
      flashback3Trigger: false, imgSrc: null
    },
    {
      id: 'k_line', icon: '💬', type: 'スクリーンショット', title: '姉へのLINE（既読なし）',
      desc: '「お姉ちゃん、私もSNS始めてみる。見ててね」。返信なし・既読なし。',
      tags: ['家族へ', '希望'],
      styleUnlock: [0, 1, 3], hashUnlock: [0, 1, 3],
      mysteryFlag: null, flashback3Trigger: false, imgSrc: null
    },
    {
      id: 'k_memo', icon: '📓', type: 'メモ', title: '依頼の理由メモ',
      desc: '「3年前、姉がSNSで記事を書かれて消えた。信頼できる人に頼みたかった。朔さんと誠司さんに紹介してもらった。」',
      tags: ['謎収束'],
      styleUnlock: [0, 1, 3], hashUnlock: [0, 1, 3],
      mysteryFlag: null,
      flashback3Trigger: true, // めくった瞬間に flashback3 を発火
      imgSrc: null
    }
  ]
};

// =====================================================================
// 反響データ
// =====================================================================
// replies はキャラクター別オブジェクト。buildReactionFeed() で GS.route をキーに参照する。
const REACTIONS = {
  high_self: {
    likesDelta: 47, rtsDelta: 8, followerDelta: 12,
    replies: {
      midori: [
        { ava: '🌷', name: 'hanako_garden', text: 'こういう投稿大好きです…ゆっくり見てしまった' },
        { ava: '👩', name: 'midori_mama',   text: 'みどりちゃん！お母さんだよ！みてるよ💕' },
        { ava: '🌿', name: 'slow_life_log', text: '完璧じゃないのがかえっていい。また来ます' },
      ],
      saku: [
        { ava: '🔧', name: 'craft_memo',    text: '作業台の写真、好きです。工具の並びに性格が出る気がして' },
        { ava: '🏗️', name: 'diorama_fan',  text: '237時間…尊敬します。屋根、絶対はまりますよ' },
        { ava: '📷', name: 'quiet_record',  text: 'こういう記録系のアカウント大好きです。フォローしました' },
      ],
      seiji: [
        { ava: '☕', name: 'cafe_hopper',    text: 'こういうお店、大好きです。今度行ってみます' },
        { ava: '🏘️', name: 'shotengai_fan', text: '商店街の喫茶店、なんか落ち着く。また来たくなる投稿' },
        { ava: '📖', name: 'slow_morning',   text: '「気分次第」のメニュー、いいですね。それが一番正直' },
      ],
      karen: [
        { ava: '🌸', name: 'ikebana_note',  text: 'この生け花、白と淡紅のバランスが美しい…' },
        { ava: '🌺', name: 'hana_log',      text: '「姉に見せたくて」という言葉が刺さりました。また来ます' },
        { ava: '🕊️', name: 'flower_quiet', text: 'こういう投稿、ゆっくり見てしまいます' },
      ],
    }
  },
  high_buzz: {
    likesDelta: 318, rtsDelta: 102, followerDelta: 234,
    replies: {
      midori: [
        { ava: '🔥', name: 'buzz_hunter',   text: '100日チャレンジ応援！フォローしました！' },
        { ava: '📱', name: 'insta_tips99',  text: 'リールも作るといいですよ！伸びます' },
        { ava: '🤖', name: 'follow4follow', text: 'フォローバックお願いします！！' },
      ],
      saku: [
        { ava: '🔥', name: 'buzz_hunter',   text: '超大作ジオラマ応援！フォローしました！' },
        { ava: '📱', name: 'insta_tips99',  text: 'タイムラプス動画にするともっと伸びますよ！' },
        { ava: '🤖', name: 'follow4follow', text: 'フォローバックお願いします！！' },
      ],
      seiji: [
        { ava: '🔥', name: 'buzz_hunter',   text: '映えない喫茶店、むしろ話題！フォローしました！' },
        { ava: '📱', name: 'insta_tips99',  text: 'レトロ系は今トレンドですよ！リールも試してみては' },
        { ava: '🤖', name: 'follow4follow', text: 'フォローバックお願いします！！' },
      ],
      karen: [
        { ava: '🔥', name: 'buzz_hunter',   text: '伝統美の発信、応援してます！フォローしました！' },
        { ava: '📱', name: 'insta_tips99',  text: '生け花はリール映えしますよ！ぜひ動画も' },
        { ava: '🤖', name: 'follow4follow', text: 'フォローバックお願いします！！' },
      ],
    }
  },
  balanced: {
    likesDelta: 89, rtsDelta: 23, followerDelta: 41,
    replies: {
      midori: [
        { ava: '🌸', name: 'petit_garden', text: 'ぶれた写真もそれはそれで味わいあります🌿' },
        { ava: '👩', name: 'midori_mama',  text: 'かわいい！お母さん毎日見てるよ〜！' },
        { ava: '☕', name: 'morning_log',  text: 'フォローしました！ゆっくり読む系のアカウント好きです' },
      ],
      saku: [
        { ava: '🛠️', name: 'model_lover',  text: '完成品、楽しみにしています。ゆっくり見てしまった' },
        { ava: '📝', name: 'solo_maker',   text: '一人で作ってる感じ、伝わってきます' },
        { ava: '🌙', name: 'night_craft',  text: 'フォローしました。また来ます' },
      ],
      seiji: [
        { ava: '☕', name: 'coffee_diary', text: 'ゆっくりできそうなお店。行ってみたいです' },
        { ava: '🌿', name: 'local_walk',   text: '商店街のお店、こういう投稿好きです。フォローしました' },
        { ava: '📋', name: 'morning_log',  text: '字の歪み、味があります。また来ます' },
      ],
      karen: [
        { ava: '🌸', name: 'season_flower', text: 'こういう静かな生け花、好きです。また来ます' },
        { ava: '🌿', name: 'hana_memo',     text: 'お姉さんに届くといいですね。フォローしました' },
        { ava: '📷', name: 'morning_still', text: 'ゆっくり見てしまいました。また来ます' },
      ],
    }
  }
};

// =====================================================================
// 本音読み取りクイズ（素材フェーズ前に表示）
// =====================================================================
const CHAT_QUIZ = {
  midori: {
    question: 'みどりさんが一番求めていることは？',
    opts: [
      { text: 'フォロワーを増やしてバズりたい',       correct: false },
      { text: 'お母さんに日常を届けたい',              correct: true  },
      { text: 'インスタ映えする写真を上手に撮りたい', correct: false },
    ]
  },
  saku: {
    question: '朔さんが発信したい本当の理由は？',
    opts: [
      { text: '制作スキルを広く知ってもらいたい',           correct: false },
      { text: '誰かに、作り続けていることを見ていてほしい', correct: true  },
      { text: 'フォロワーを増やしてファンを作りたい',       correct: false },
    ]
  },
  seiji: {
    question: '誠司さんがSNSを始める本当の目的は？',
    opts: [
      { text: '若い客を増やして店を繁盛させたい',         correct: false },
      { text: 'この店の空気を、知ってほしい人に届けたい', correct: true  },
      { text: 'インスタ映えメニューで話題にしたい',       correct: false },
    ]
  },
  karen: {
    question: '花蓮さんが発信を始めた本当の理由は？',
    opts: [
      { text: '生け花の技術を広く伝えたい',       correct: false },
      { text: '姉に、自分の日常を見ていてほしい', correct: true  },
      { text: 'SNSで影響力をつけたい',            correct: false },
    ]
  },
};
