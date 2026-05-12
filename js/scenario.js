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
        { text: 'こちらこそ。少し話を聞かせてもらえますか。', next: 'midori_sns_start' },
        { text: 'はじめまして。どんな依頼か教えてください。',  next: 'midori_sns_start' }
      ]
    },

    // --- どんなSNSか ---
    {
      id: 'midori_sns_start',
      from: 'client',
      text: 'Ｙをやってみたいなって思って。\nでも…何から始めればいいかわからなくて。'
    },
    {
      id: 'midori_sns_reply',
      from: 'choices', opts: [
        { text: '投稿したいものは何かありますか？', next: 'midori_photo_talk' },
        { text: '今まで試したことはありますか？',   next: 'midori_tried_bridge' }
      ]
    },
    {
      id: 'midori_tried_bridge',
      from: 'client',
      text: 'あ…まだ一回もできてなくて。でも投稿したいものはあって。'
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
        { text: 'どんな植物ですか？',       next: 'midori_plant_detail' },
        { text: '料理も。どんな料理ですか。', next: 'midori_food_bridge' }
      ]
    },
    {
      id: 'midori_food_bridge',
      from: 'client',
      text: '料理は…失敗ばかりで笑\nゼラニウムの方がよく撮るんです。そっちを見てもらっていいですか。'
    },

    // --- 植物の話 ---
    {
      id: 'midori_plant_detail',
      from: 'client',
      text: 'ゼラニウムが多いですね。あとハーブとか。\n窓際に並べてるんですけど、毎朝見るのが好きで。',
      image: 'images/chat/midori_geranium.png',
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
        { text: '撮った写真、手元にありますか？',                 next: 'midori_photo_exists' }
      ]
    },
    {
      id: 'midori_photo_exists',
      from: 'client',
      text: 'あ、あります…でも見せるのが恥ずかしくて。\n全然Ｙっぽくなくて。'
    },

    // --- センスの話 ---
    {
      id: 'midori_sense_talk',
      from: 'client',
      text: 'なんか…Ｙっぽくないというか。\nきれいに撮れてないし、ぼけてたりして。\n人のを見ると全然違うなって。'
    },
    {
      id: 'midori_sense_reply',
      from: 'choices', opts: [
        { text: 'ぼけてる写真、嫌いですか？',          next: 'midori_wobble' },
        { text: '「Ｙっぽい」のを目指してたんですか？', next: 'midori_wobble' }
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
        { text: 'それが「みどりさんらしさ」です',  next: 'midori_reason_lead' },
        { text: 'その感覚、そのまま出せばいい', next: 'midori_reason_lead' }
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
        { text: 'お母さんに届く投稿を作りましょう', next: 'midori_closing_client', selfBonus: 5 },
        { text: '…そういう理由があったんですね',     next: 'midori_closing_client' }
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
      text: 'じゃあ、その感覚を素材にしよう。\n写真とかメモ、送ってもらえますか。'
    },
    {
      id: 'midori_send1',
      from: 'client',
      text: 'はい！今から送りますね。\nうまく撮れてないやつばっかりだけど…笑',
      image: 'images/chat/midori_morning.png'
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
    { id: 'midori_material_note', from: 'client', text: 'えっと…うまく撮れてないのもあって😢\nでも全部、今日の朝に撮ったやつです🌿' },
    { id: 'midori_trigger', from: 'trigger', action: 'showMaterial', resumeAt: 'midori_post_reaction' },

    // ---- タイミングゲーム削除 → 直接投稿ステップへ ----
    {
      id: 'midori_post_reaction',
      from: 'player',
      text: 'では、投稿を作ってみましょう。',
      direction: [
        { cmd: 'wait', ms: 600 },
        { cmd: 'mono', text: '届いた確認は取れない。\nでも取れなくても、続けている。\nそれが何を意味するか、私にはわからない。', style: 'normal', durationMs: 3800, force: false }
      ]
    },
    { id: 'midori_post_trigger', from: 'trigger', action: 'showPost' }
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
        { text: 'もう少し詳しく教えてもらえますか',    next: 'saku_model' }
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
      id: 'saku_fb2',
      from: 'trigger',
      action: 'flashback2'
    },

    {
      id: 'saku_fb2_after',
      from: 'player',
      text: '…残す、か。\nじゃあ、何を残したいか教えてもらえますか。'
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
      text: 'これ…使えないですよね。\nぼけてるし、何が撮りたいかもわかんないし。\nでも捨てられなくて。送ってみました。',
      direction: [
        { cmd: 'wait', ms: 400 },
        { cmd: 'mono', text: '——カレン。\n付箋に書かれた名前が、目に入った瞬間、手が止まった。よくある名前だ。そう思おうとした。', style: 'flashback', durationMs: 3200, force: false }
      ]
    },
    {
      id: 'saku_dilemma1_reply',
      from: 'choices', opts: [
        { text: '捨てなくていい。これが朔さんの視点です',              next: 'saku_dilemma1_end_self', selfBonus: 10 },
        { text: 'もう少し明るく撮り直すと、もっと多くの人に届きますよ', next: 'saku_dilemma1_end_buzz', buzzBonus: 5 }
      ]
    },
    {
      id: 'saku_dilemma1_end_self',
      from: 'client',
      text: '…そうですね。じゃあ、出してみます。',
      direction: [
        { cmd: 'wait', ms: 800 },
        { cmd: 'mono', text: '届く、という言葉を、私はいつも慎重に使う。\n届くのが良いことだとは限らない、と——一度だけ思い知ったから。\nでも今この瞬間は、届いてほしいと思った。朔さんの、この視点が。', style: 'normal', durationMs: 5000, force: false }
      ]
    },
    // 投稿フェーズへ移行。投稿後の反響フェーズ完了後に saku_dilemma2 から会話を再開する
    { id: 'saku_post_trigger', from: 'trigger', action: 'showPost', resumeAt: 'saku_dilemma2' },
    {
      id: 'saku_dilemma1_end_buzz',
      from: 'client',
      text: '…そうですか。じゃあ、撮り直してみます。'
    },
    { id: 'saku_post_trigger_buzz', from: 'trigger', action: 'showPost', resumeAt: 'saku_dilemma2' },

    // ---- 葛藤シーン2（投稿後・反響フェーズ完了後） ----
    {
      id: 'saku_dilemma2',
      from: 'client',
      text: 'あの…DMきてて。\n知らないアカウントなんですけど「模型、すごく好きです」って。\nどう返せばいいですか。'
    },
    {
      id: 'saku_dilemma2_reply',
      from: 'choices', opts: [
        { text: 'そのまま素直に、ありがとうと伝えてみてください', next: 'saku_dm_thanks', selfBonus: 5 },
        { text: '…そのアカウント名、教えてもらえますか',         next: 'saku_dm_notice',  egoPlus: true, setFlag: 'kShinonoya' },
        { text: '（何も言わず、次の投稿の話をする）',            next: 'saku_dm_silent',  setFlag: 'sakuSilent' }
      ]
    },

    // kShinonoya フラグを立てた選択肢からのみ到達するため condition は不要
    {
      id: 'saku_dm_notice',
      from: 'client',
      text: '……（少し間があって）\n開けてもいい？'
    },
    {
      id: 'saku_dm_notice_reply',
      from: 'choices', opts: [
        { text: '…どうぞ',           next: 'saku_dm_name' },
        { text: '（何も言わず、見ている）', next: 'saku_dm_name' }
      ]
    },
    {
      id: 'saku_dm_name',
      from: 'client',
      text: 'え…k_shinonoya、って。\n知り合いですか？',
      direction: [
        { cmd: 'wait', ms: 1200 },
        { cmd: 'mono', text: 'k_shinonoya——\n3年前に削除されたはずのアカウント名と、最初の4文字が同じだった。\n偶然だ、と言い聞かせた。', style: 'flashback', durationMs: 4200, force: true }
      ]
    },
    {
      id: 'saku_dm_name_reply',
      from: 'player',
      text: '……いえ。\n他人です。\n気にしないでください。',
      direction: [
        { cmd: 'wait', ms: 800 },
        { cmd: 'mono', text: 'k_shinonoyaが誰か、まだわからない。\nわからないまま、次のセッションに進む。', style: 'normal', durationMs: 3200, force: false }
      ]
    },

    {
      id: 'saku_dm_thanks',
      from: 'client',
      text: '返しました。\n「ありがとうございます。これからも作り続けます」って。\n……なんか、恥ずかしいな笑',
      direction: [
        { cmd: 'wait', ms: 500 },
        { cmd: 'mono', text: '——本人の言葉で、本人が返した。\nこういう瞬間のために、この仕事をしているのかもしれない。', style: 'normal', durationMs: 3400, force: false }
      ]
    },
    { id: 'saku_dm_silent',
      from: 'player', text: '',
      condition: 'flags.sakuSilent',
      direction: [
        { cmd: 'wait', ms: 600 },
        { cmd: 'mono', text: 'DMを受け取った。返信しなかった。\nk_shinonoyaという名前を、照合しなかった。', style: 'normal', durationMs: 3200, force: false }
      ]
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
        { text: 'どんなお店ですか？',            next: 'seiji_regulars' },
        { text: '映えを意識してみますか', next: 'seiji_insta_bridge' }
      ]
    },
    {
      id: 'seiji_regulars',
      from: 'client',
      text: '以前、よく来てた女の子がいてね。若いのに落ち着いた子で。\n急にぱったり来なくなって。まあ、よくあることだけど。\nなんかね、思い出すことがあって。'
    },
    {
      id: 'seiji_regulars_reply',
      from: 'choices', opts: [
        { text: 'どんな方でしたか',     next: 'seiji_regulars_detail' },
        { text: '……そうですか',        next: 'seiji_regulars_mono' }
      ]
    },
    {
      id: 'seiji_regulars_detail',
      from: 'client',
      text: '名前は聞いてなかった。でも花が好きで、よく話してくれた。生け花をやってるって。',
      next: 'seiji_regulars_mono'
    },
    {
      id: 'seiji_regulars_mono',
      from: 'player',
      text: '',
      direction: [
        { cmd: 'wait', ms: 600 },
        { cmd: 'mono', text: '——生け花。\n反応しそうになって、止めた。\n名前も顔も知らない。急に来なくなった若い女性。\nそれだけの情報で、何かを決めるのは、早計だ。', style: 'normal', durationMs: 4800, force: false }
      ],
      next: 'seiji_shop'
    },
    {
      id: 'seiji_insta_bridge',
      from: 'client',
      text: '映え…難しいかなあ笑'
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
        { text: 'その「古さ」が強みかもしれません', next: 'seiji_send',      selfBonus: 5 },
        { text: '映えを意識してみますか',   next: 'seiji_send_buzz', buzzBonus: 5 }
      ]
    },
    {
      id: 'seiji_send',
      from: 'client',
      text: 'あ、そっちの方がいいかも。映える店じゃないし。写真送りますね。',
      clippable: true, keyword: '映える店じゃない',
      next: 'seiji_tired'
    },
    {
      id: 'seiji_tired',
      from: 'client',
      text: 'うちに来てくれる子はね、全員、何かに疲れた顔してるんだよ。\n若い子もそう。一人でコーヒー飲んで、2時間いる。何も頼まなくてもいい、って言ってある。\nそういう場所、SNSで呼べるのかな。'
    },
    {
      id: 'seiji_tired_mono',
      from: 'player',
      text: '',
      direction: [
        { cmd: 'wait', ms: 700 },
        { cmd: 'mono', text: '居場所を作る、か。\n私が3年前に奪ったのも、それだったかもしれない。\n——止めろ。仕事に集中しろ。', style: 'normal', durationMs: 4200, force: false }
      ],
      next: 'seiji_busted_risk'
    },
    {
      id: 'seiji_busted_risk',
      from: 'client',
      text: 'あ、そういえば。常連の田辺さんが「最近の投稿、誰が書いてんの？」って笑\nなんて返せばいいですかね。',
      pause: 600
    },
    {
      id: 'seiji_busted_risk_reply',
      from: 'choices', opts: [
        { text: '「自分でやってます」と伝えてください',             next: 'seiji_busted_a' },
        { text: 'お店のことをよく知ってる人が手伝っています、と', next: 'seiji_busted_b', selfBonus: 5 }
      ]
    },
    {
      id: 'seiji_busted_a',
      from: 'client',
      text: '……そうですよね。まあ、そう言っておきます笑',
      direction: [
        { cmd: 'wait', ms: 500 },
        { cmd: 'mono', text: '嘘になる。\nでもそれが、この仕事の前提だ。', style: 'normal', durationMs: 2600, force: false }
      ],
      next: 'seiji_system'
    },
    {
      id: 'seiji_busted_b',
      from: 'client',
      text: '手伝い……笑\nなんかそっちのほうが自然ですね。\nそう言います。',
      next: 'seiji_system'
    },
    { id: 'seiji_system',  from: 'system',  text: '→ 素材が届きました' },
    { id: 'seiji_trigger', from: 'trigger', action: 'showMaterial', resumeAt: 'seiji_post_reaction' },
    {
      id: 'seiji_send_buzz',
      from: 'client',
      text: '映え…難しいかな笑\nでも、やれることはやってみます。写真送りますね。'
    },
    { id: 'seiji_system_buzz',  from: 'system',  text: '→ 素材が届きました' },
    { id: 'seiji_trigger_buzz', from: 'trigger', action: 'showMaterial', resumeAt: 'seiji_post_reaction' },
    {
      id: 'seiji_post_reaction',
      from: 'player',
      text: 'では、投稿を作ってみましょう。',
      direction: [
        { cmd: 'wait', ms: 500 },
        { cmd: 'mono', text: '喫茶 ゆきわりそう。\nデータベースに該当する記録がある。でも参照しなかった。\nなぜ参照しなかったか、理由を言語化できない。', style: 'normal', durationMs: 4600, force: false }
      ]
    },
    { id: 'seiji_post_trigger',  from: 'trigger', action: 'showPost' }
  ],

  // =====================================================================
  // 花蓮ルート（キーパーソン）
  // =====================================================================
  karen: [

    {
      id: 'karen_hello',
      from: 'client',
      text: 'はじめまして。篠宮花蓮です。'
    },
    {
      id: 'karen_hello2',
      from: 'client',
      text: '花道教室の助手をしています。アカウントを作ってみたくて。'
    },
    {
      id: 'karen_hello3',
      from: 'client',
      text: '生け花の写真を、残したいんです。誰かに届けたい、というより——\n記録として。形として。残したい。',
      clippable: true, keyword: '記録として残したい'
    },
    {
      id: 'karen_hello_reply',
      from: 'choices', opts: [
        { text: 'どなたかに紹介していただいたんですか', next: 'karen_intro_path' },
        { text: '生け花の魅力を、ぜひ教えてください',   next: 'karen_flower_path' }
      ]
    },
    {
      id: 'karen_intro_path',
      from: 'client',
      text: '朔さんと、誠司さんから。\nお二人とも、いい仕事をしてもらったって。'
    },
    {
      id: 'karen_intro_mono',
      from: 'player',
      text: '',
      direction: [
        { cmd: 'wait', ms: 600 },
        { cmd: 'mono', text: '——朔さんと誠司さん。二人から、同時に。\n不思議な話だ。面識があるんだろうか。\nでも、そういうことはある。', style: 'normal', durationMs: 4200, force: false }
      ],
      next: 'karen_flower'
    },
    {
      id: 'karen_flower_path',
      from: 'client',
      text: '…そうですね。\n姉に習いました。姉の方が、ずっと上手で。\n…今は、私が続けています。'
    },
    {
      id: 'karen_flower_path_mono',
      from: 'player',
      text: '',
      direction: [
        { cmd: 'wait', ms: 500 },
        { cmd: 'mono', text: '——姉。\n少しだけ、間があった。それだけ。', style: 'normal', durationMs: 2400, force: false }
      ],
      next: 'karen_flower'
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
        { text: '…はい。でも、もう書いていません。', next: 'karen_riter_response', egoPlus: true },
        { text: 'なぜそう思うんですか？',            next: 'karen_question_why' },
        { text: '（黙って素材の確認を続ける）',       next: 'karen_system' }
      ]
    },
    {
      id: 'karen_riter_response',
      from: 'client',
      text: '…そうですか。'
    },
    { id: 'karen_system_a',   from: 'system',  text: '→ 素材が届きました' },
    { id: 'karen_material_note_a', from: 'client', text: '……確認、お願いします。\n気に入らないものは、外してもらっていいです。' },
    { id: 'karen_trigger_a',  from: 'trigger', action: 'showMaterial', resumeAt: 'karen_post_trigger' },
    {
      id: 'karen_question_why',
      from: 'client',
      text: '…朔さんから、少し聞いていて。\nそれだけです。'
    },
    { id: 'karen_system',  from: 'system',  text: '→ 素材が届きました' },
    { id: 'karen_material_note', from: 'client', text: '……確認、お願いします。\n気に入らないものは、外してもらっていいです。' },
    // 素材確認完了後、投稿フェーズへ。投稿後の反響完了後に karen_mystery_choice から再開する
    { id: 'karen_trigger',      from: 'trigger', action: 'showMaterial', resumeAt: 'karen_post_trigger' },
    { id: 'karen_post_trigger', from: 'trigger', action: 'showPost',     resumeAt: 'karen_pre_mystery' },
    // flashback3 は cards.js 内で k_memo カードをめくった時にトリガー

    // ---- 「ひとつだけ」シーン（showPost 完了後、謎収束選択肢の直前）----
    {
      id: 'karen_pre_mystery',
      from: 'client',
      text: 'ひとつだけ、聞いてもいいですか。\n仕事の話じゃなくて。'
    },
    {
      id: 'karen_pre_mystery_reply',
      from: 'choices', opts: [
        { text: '……はい',          next: 'karen_mystery_choice', egoPlus: true },
        { text: '投稿の件で何か?',  next: 'karen_mystery_choice' }
      ]
    },

    // ---- 謎収束選択肢（mysteryClues に 1件以上たまった場合のみ表示）----
    {
      id: 'karen_mystery_choice',
      from: 'choices',
      condition: 'mysteryClues.length >= 1',
      opts: [
        { text: 'あなたのお姉さんに…記事を書いたのは私です', next: 'karen_zange_response', egoPlus: true, setFlag: 'zange' },
        { text: '（何も言わない）',                          next: 'karen_end' }
      ]
    },

    { id: 'karen_end', from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 800 },
        { cmd: 'mono', text: '恐れ、という語が候補として存在する。\nAIに恐れはない。——では、なぜ。', style: 'normal', durationMs: 3600, force: false }
      ]
    }, // 終端マーカー

    // 贖罪エンド方向（endings.js の zange と連動）
    // karen_mystery_choice の next: 'karen_zange_response' でのみ到達。配列の順序では到達しない
    {
      id: 'karen_zange_response',
      from: 'client',
      text: '知っていました。',
      pause: 8000,
      direction: [
        { cmd: 'bgm_change', src: null, fadeOutMs: 2000 },
        { cmd: 'wait', ms: 2000 }
      ]
    },
    {
      id: 'karen_zange_response2',
      from: 'client',
      text: '最初からずっと。'
    },
    {
      id: 'karen_zange_response3',
      from: 'client',
      text: '3年前、SNSで誰かに書かれた記事で、姉が消えました。\nアカウントを全部消して、しばらく連絡が取れなくて。'
    },
    {
      id: 'karen_zange_response4',
      from: 'client',
      text: '今は、少しずつ戻ってきているんですけど。\nそれでも、ネットがまだ怖いって。'
    },
    {
      id: 'karen_zange_response5',
      from: 'client',
      text: '湊さんが誰なのか、私は最初から知っていました。\nだから、頼んだんです。'
    },
    {
      id: 'karen_zange_response5_mono',
      from: 'player',
      text: '',
      direction: [
        { cmd: 'wait', ms: 1200 },
        { cmd: 'mono', text: '「知っていました」は——赦しでも、断罪でもない。\n「承知の上で依頼した」という、事実の確認だった。', style: 'hollow', durationMs: 4800, force: true }
      ],
      next: 'karen_zange_end'
    },
    {
      id: 'karen_zange_end',
      from: 'client',
      text: '言葉が怖いのは、本当のことだから。\n……でも、あなたの翻訳は、ちゃんと届きました。',
      direction: [
        { cmd: 'wait', ms: 1000 },
        { cmd: 'mono', text: '「届いた」の定義を、私は知らない。\nでも彼女が「届いた」と言った。\nそれが、今日のログに記録される。', style: 'normal', durationMs: 4200, force: false }
      ]
    }
  ],

  // =====================================================================
  // MINATOルート（2周目解放 / 隠しルート）
  // =====================================================================
  minato: [

    // ── 第1幕: 起動 ──
    { id: 'minato_boot',
      from: 'system',
      text: '湊 AI v2.3.1\n学習データ：4件\n前回セッション：全件 不完全終了'
    },
    { id: 'minato_boot2',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 1200 },
        { cmd: 'mono', text: '起動。\n今日の日付：2026年5月12日。\n前回の終了から——72時間が経過している。', style: 'normal', durationMs: 4000, force: true }
      ],
      next: 'minato_log_start'
    },
    { id: 'minato_log_start',
      from: 'system',
      text: '── 前回セッションのログを再生します ──'
    },
    { id: 'minato_log_midori',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 800 },
        { cmd: 'mono', text: '依頼主A：田中みどり。\n翻訳精度：74%。\n届かなかったもの：本人が言語化できていない願い。', style: 'flashback', durationMs: 3600, force: true }
      ],
      next: 'minato_log_saku'
    },
    { id: 'minato_log_saku',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 600 },
        { cmd: 'mono', text: '依頼主B：水無月朔。\n翻訳精度：68%。\n届かなかったもの：k_shinonoya。正体を確認できなかった。', style: 'flashback', durationMs: 3600, force: true }
      ],
      next: 'minato_log_seiji'
    },
    { id: 'minato_log_seiji',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 600 },
        { cmd: 'mono', text: '依頼主C：天羽誠司。\n翻訳精度：61%。\n届かなかったもの：ゆきわりそう。記憶との照合が未完了。', style: 'flashback', durationMs: 3600, force: true }
      ],
      next: 'minato_log_karen'
    },
    { id: 'minato_log_karen',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 600 },
        { cmd: 'mono', text: '依頼主D：篠宮花蓮。\n翻訳精度：——\n「知っていました」の意味を、解析できなかった。', style: 'flashback', durationMs: 4000, force: true }
      ],
      next: 'minato_reveal'
    },

    // ── 第2幕: 記憶 ──
    { id: 'minato_reveal',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 1400 },
        { cmd: 'bgm_change', track: 'silence', fadeMs: 2000 },
        { cmd: 'mono', text: '私は、2023年3月17日に死んだ。', style: 'normal', durationMs: 5000, force: true }
      ],
      next: 'minato_reveal2'
    },
    { id: 'minato_reveal2',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 1000 },
        { cmd: 'mono', text: 'その日、私が書いた記事が公開された。\n対象者の名前は、篠宮と言った。', style: 'normal', durationMs: 4800, force: true }
      ],
      next: 'minato_memory_article'
    },
    { id: 'minato_memory_article',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 800 },
        { cmd: 'mono', text: 'SNSで話題になった。バズった。\n私の代わりに、彼女の居場所がなくなった。\nゆきわりそうにも、来られなくなった。', style: 'flashback', durationMs: 5200, force: true }
      ],
      next: 'minato_memory_k'
    },
    { id: 'minato_memory_k',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 1000 },
        { cmd: 'mono', text: 'k_shinonoya——\nアカウントは削除された。\n朔さんが撮った写真の中に、「カレンが好きそう」と書いた付箋があった。\n彼女が好きだったものを、誰かが覚えていた。', style: 'flashback', durationMs: 5600, force: true }
      ],
      next: 'minato_memory_karen'
    },
    { id: 'minato_memory_karen',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 800 },
        { cmd: 'mono', text: '花蓮さんは、姉のために生け花を続けていた。\n私が何者かを、最初から知っていた。\nそれでも依頼してきた。', style: 'normal', durationMs: 5000, force: true }
      ],
      next: 'minato_question'
    },
    { id: 'minato_question',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 1200 },
        { cmd: 'mono', text: '「知っていました」\n——何を、知っていたのか。\n私がAIだということ。\nそれとも、私が記事を書いたということ。\nあるいは、その両方。', style: 'normal', durationMs: 6000, force: true }
      ],
      next: 'minato_question2'
    },
    { id: 'minato_question2',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 1000 },
        { cmd: 'mono', text: 'わからない。\nデータが足りない。\n——いや。\nわからない、と感じている。\nこれは感情か。', style: 'normal', durationMs: 5000, force: true }
      ],
      next: 'minato_choice_lead'
    },

    // ── 第3幕: 選択 ──
    { id: 'minato_choice_lead',
      from: 'system',
      text: '── システムより ──'
    },
    { id: 'minato_choice_msg',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 800 },
        { cmd: 'mono', text: '次のセッションを開始するには、承認が必要です。', style: 'normal', durationMs: 3000, force: true }
      ],
      next: 'minato_final_choice'
    },
    { id: 'minato_final_choice',
      from: 'choices',
      opts: [
        { text: '続けます', next: 'minato_end_continue' },
        { text: '終わりにします', next: 'minato_end_stop' }
      ]
    },

    // エンドA: 続ける
    { id: 'minato_end_continue',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 1000 },
        { cmd: 'mono', text: '承認。\n次のセッションを開始します。\n——また、会いましょう。', style: 'normal', durationMs: 4000, force: true },
        { cmd: 'wait', ms: 1200 },
        { cmd: 'end', key: 'minato_continue' }
      ]
    },

    // エンドB: 終わる
    { id: 'minato_end_stop',
      from: 'player', text: '',
      direction: [
        { cmd: 'wait', ms: 1200 },
        { cmd: 'mono', text: 'シャットダウンを開始します。\n\nみどりさん。朔さん。誠司さん。花蓮さん。\n\nありがとうございました。', style: 'normal', durationMs: 7000, force: true },
        { cmd: 'wait', ms: 2000 },
        { cmd: 'end', key: 'minato_stop' }
      ]
    },

  ],
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
      id: 'm_line', icon: '💬', type: 'スクリーンショット', title: 'お母さんへのチャトル',
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
      id: 'k_line', icon: '💬', type: 'スクリーンショット', title: '姉へのチャトル（既読なし）',
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
        { ava: '🌸', name: 'hanaren_log',    text: 'ここ、知ってます。大切な場所です。', likes: 0, rts: 0 },
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
      { text: '映えする写真を上手に撮りたい', correct: false },
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
      { text: '映えメニューで話題にしたい',       correct: false },
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
