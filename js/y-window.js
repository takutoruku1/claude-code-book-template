/* ============================================================
   Y APP  (Twitter/X 風 SNS ビューア)
============================================================ */

function openYWindow() {
  const win = document.getElementById('yWindow');
  win.classList.add('active');
  bringToFront(win);
  window.yMinimized = false;
  renderYTimeline('recommend');
  renderYTrends();
  renderYSuggestions();
  updateTaskbarIndicators();
  setDesktopNotif('notifY', false);

}

function closeYWindow() {
  document.getElementById('yWindow').classList.remove('active');
  window.yMinimized = false;
  updateTaskbarIndicators();
}

function taskbarToggleY() {
  const win = document.getElementById('yWindow');
  if (!win.classList.contains('active')) {
    openYWindow();
  } else if (window.yMinimized) {
    win.classList.add('active');
    bringToFront(win);
    window.yMinimized = false;
    renderYTimeline('recommend');
    updateTaskbarIndicators();
  } else {
    win.classList.remove('active');
    window.yMinimized = true;
    updateTaskbarIndicators();
  }
}

function yFeedTab(tab) {
  document.getElementById('yTabRecommend').classList.toggle('active', tab === 'recommend');
  document.getElementById('yTabFollowing').classList.toggle('active', tab === 'following');
  renderYTimeline(tab);
}

function yShowTab(tab) { /* ナビ選択の視覚のみ */ }

/* ===== TL データ ===== */
const Y_POSTS_RECOMMEND = [
  {
    avatar: '📊', name: 'SNSマガジン編集部', handle: '@snsmag_jp', verified: true,
    time: '3分前', badge: 'おすすめ',
    body: '【調査レポート】SNS代行サービス市場が3年連続で急拡大。\n利用者の72%が「自分らしさを保ちながら伸ばしたい」と回答。\n\n"ブランドの声"を誰が担うのか──今、問われている。',
    tags: ['#SNS代行', '#デジタルアイデンティティ'],
    rt: '4.7万', like: '12.1万',
  },
  {
    avatar: '🦋', name: 'バズハンター_J', handle: '@viral_hunter_j', verified: false,
    time: '12分前',
    body: '最近思うんだけど、SNS代行って翻訳家に似てるな。\n\n言葉じゃなくて"その人"を訳してる。\n意味だけじゃなく、温度まで。\nそれができる人、本当に少ない。',
    tags: ['#SNS考察'],
    rt: '2,310', like: '8,777',
  },
  {
    avatar: '🔮', name: 'SNS仙人ゆき', handle: '@sennin_yuki', verified: true,
    time: '28分前',
    body: 'フォロワーを増やすより、フォロワーに増やしてもらうほうがずっと難しい。\nそれができたとき、本物になる。\n\nバズる投稿は作れる。\nでも「この人の声が聞きたい」とは、作れない。',
    tags: ['#SNS論'],
    rt: '1.2万', like: '5.8万',
  },
  {
    avatar: '📰', name: 'SNS代行タイムズ', handle: '@daiko_times', verified: true,
    time: '1時間前', badge: 'ニュース',
    body: '【速報】SNS代行業の法整備を求める声が国会で初めて取り上げられる。\n"本人か代行か 表示義務化"の議論が活発化。\n\n業界への影響は？ 続報を待て。',
    tags: ['#SNS法規制', '#代行業界'],
    rt: '8,214', like: '3.1万',
    quote: { name: '経済産業省 公式', text: '「デジタル表現の透明性」に関するパブリックコメントを募集します。' },
  },
  {
    avatar: '💼', name: '斎藤 翔馬 / マーケター', handle: '@mrktr_shoma', verified: false,
    time: '2時間前',
    body: 'クライアントに「自分の言葉で書きたい」と言われて一緒に考えた投稿が5万いいね超えた。\n\n代行ってそういうもんだと思う。\n"代わりに書く"じゃなくて"一緒に見つける"。',
    tags: [],
    rt: '412', like: '3,201',
  },
  {
    avatar: '🎀', name: '愛奈@インフルエンサー修行中', handle: '@infl_mana_diary', verified: false,
    time: '3時間前',
    body: 'SNS代行に頼んだら確かにフォロワー増えたけど、コメント欄で「最近文章変わった？」って言われた。\n\nうれしいような、悲しいような。',
    tags: [],
    rt: '601', like: '4,822',
  },
  {
    avatar: '🏢', name: 'PR会社 あかね広報室', handle: '@akane_pr_lab', verified: true,
    time: '4時間前',
    body: '弊社ではクライアントの「声の設計」から入ります。\n投稿文より先に「この人が話すとき何を大事にするか」を聞く時間に1時間かける。\n\nそこをスキップすると、どこかで必ずズレが出る。',
    tags: ['#PR', '#SNS運用'],
    rt: '1,043', like: '6,110',
  },
  {
    avatar: '🖊️', name: 'クリエイター なお', handle: '@creator_nao7', verified: false,
    time: '5時間前',
    body: '自分でSNS運用はじめて3ヶ月。\n\n投稿するたびに「これ本当に自分っぽいかな」って迷う。\nそういうの、ずっと迷い続けることが大事なのかもしれない。',
    tags: ['#クリエイター', '#SNS運用'],
    rt: '229', like: '1,984',
  },
  {
    avatar: '📊', name: 'SNSマガジン編集部', handle: '@snsmag_jp', verified: true,
    time: '6時間前', badge: 'おすすめ',
    body: '【特集】"らしさ"の経済学\n\nフォロワー5万人のアカウントより、1万人でも熱狂的なファンを持つアカウントのほうが商業的価値が高い時代へ。\n\nエンゲージメント率の意味が変わっている。',
    tags: ['#SNSマーケ', '#エンゲージメント'],
    rt: '5,892', like: '2.3万',
  },
  {
    avatar: '📈', name: 'データ分析 太一郎', handle: '@data_taichiro', verified: false,
    time: '7時間前',
    body: 'SNS代行アカウントと本人運用アカウントの投稿を機械学習で比較したら、代行のほうが「一文が短い」「記号が多い」「絵文字が規則的」という特徴が出た。\n\n"らしさ"って、不規則さの中にある。',
    tags: ['#データ分析', '#SNS研究'],
    rt: '3,102', like: '9,441',
  },
  {
    avatar: '🌃', name: '深夜の独り言', handle: '@midnight_monologue', verified: false,
    time: '8時間前',
    body: '代行に頼んだ自分のアカウントを見ると、なんか知らない人みたいで。\n\nでも「いいね」はたくさんついてる。\n\n……これって何のためにやってるんだろう。',
    tags: [],
    rt: '1,834', like: '1.2万',
  },
  {
    avatar: '🏪', name: '小さなお花屋さん ひまわり堂', handle: '@himawari_flower', verified: false,
    time: '9時間前',
    body: '代行さんにお願いして半年。\nお客さんに「Yで見ました」って言ってもらえることが増えました。\n\nでも昨日、自分で書いた「今日仕入れたバラが綺麗」って投稿に一番反応があって笑。',
    tags: ['#花屋', '#SNS'],
    rt: '408', like: '5,620',
  },
  {
    avatar: '💻', name: 'テックライター H', handle: '@techwriter_hiro', verified: false,
    time: '10時間前',
    body: 'AI生成文章とSNS代行文章と本人文章を並べて読むと、「本人文章」だけが予測できないタイミングで個人的な話題にジャンプする。\n\nそれが"温度"の正体だと思う。',
    tags: ['#AI', '#ライティング'],
    rt: '2,741', like: '7,830',
  },
  {
    avatar: '🎧', name: 'フリーランス Rei', handle: '@freelance_rei_w', verified: false,
    time: '12時間前',
    body: 'SNS代行の仕事して2年。\n\n一番難しいのは文章じゃなくて「このクライアントが怒るとき、悲しむとき、喜ぶとき何を言うか」を想像すること。\n\nキャラ設定じゃなくて、人間を理解する仕事。',
    tags: ['#フリーランス', '#SNS代行'],
    rt: '5,011', like: '2.1万',
  },
  {
    avatar: '🏙️', name: '広告代理店 S係長', handle: '@ad_agency_section_s', verified: false,
    time: '14時間前',
    body: 'クライアントが「もっとバズる文章にして」と言う。\nでも本当に言いたいのは「もっと自分のことを知ってほしい」なんだよな。\n\nバズと信頼、どっちを売るかで仕事が変わる。',
    tags: ['#広告', '#SNS戦略'],
    rt: '1,229', like: '8,004',
  },
  {
    avatar: '🔮', name: 'SNS仙人ゆき', handle: '@sennin_yuki', verified: true,
    time: '16時間前',
    body: '10万フォロワー達成おめでとう、って言われるたびに聞き返す。\n\n「それ、誰のフォロワーですか？」',
    tags: [],
    rt: '8,801', like: '4.2万',
  },
  {
    avatar: '📰', name: 'SNS代行タイムズ', handle: '@daiko_times', verified: true,
    time: '18時間前',
    body: '【コラム】代行された"声"は誰のものか。\n\n法的には依頼者のもの。\n商業的には代行会社のもの。\n感情的には……誰のものにもなれないのかもしれない。',
    tags: ['#代行倫理', '#SNS論'],
    rt: '4,519', like: '1.7万',
  },
  {
    avatar: '🌇', name: '普通の会社員 みつき', handle: '@futsuu_mitsuki28', verified: false,
    time: '20時間前',
    body: '会社のSNS担当になって思ったこと。\n\n文章書くより「この会社が何を大切にしてるか」を理解するほうに時間がかかる。\nわかったとき、初めてちゃんと書ける気がした。',
    tags: [],
    rt: '312', like: '2,741',
  },
  {
    avatar: '🦋', name: 'バズハンター_J', handle: '@viral_hunter_j', verified: false,
    time: '1日前',
    body: '「バズった」と「伝わった」は別物。\n\nバズは数字。\n伝わったは、誰かの行動が変わること。\n\nどっちを目指すかで、書く文章がぜんぶ変わる。',
    tags: ['#SNS哲学'],
    rt: '6,731', like: '3.1万',
  },
  {
    avatar: '📱', name: 'SNSコンサル 木村葵', handle: '@sns_kimura_aoi', verified: true,
    time: '1日前',
    body: '代行をやめてご本人が運用を始めると、最初はみんなフォロワーが減る。\n\nでも半年後に戻ってきたフォロワーはもう離れない。\n\n数字じゃなくて"関係"が育ってるから。',
    tags: ['#SNS運用', '#コンサル'],
    rt: '2,087', like: '9,342',
  },
];

const Y_POSTS_FOLLOWING = Y_POSTS_RECOMMEND.filter(p =>
  ['@viral_hunter_j','@sennin_yuki','@mrktr_shoma','@freelance_rei_w','@creator_nao7','@daiko_times','@sns_kimura_aoi'].includes(p.handle)
);

const Y_TRENDS = [
  { cat: 'トレンド', name: '#SNS代行',            count: '2.3万件のポスト' },
  { cat: 'テクノロジー · トレンド', name: '#デジタルアイデンティティ', count: '1.1万件のポスト' },
  { cat: 'ビジネス · トレンド', name: '#自分らしさ',           count: '5.1万件のポスト' },
  { cat: 'トレンド', name: '#バズり方',            count: '8,740件のポスト' },
  { cat: 'SNS · トレンド', name: '#らしさスコア',         count: '3,012件のポスト' },
];

const Y_SUGGESTIONS = [
  { avatar: '🔮', name: 'SNS仙人ゆき',         handle: '@sennin_yuki' },
  { avatar: '🦋', name: 'バズハンター_J',      handle: '@viral_hunter_j' },
  { avatar: '📱', name: 'SNSコンサル 木村葵',  handle: '@sns_kimura_aoi' },
  { avatar: '🎧', name: 'フリーランス Rei',    handle: '@freelance_rei_w' },
];

/* ===== 描画 ===== */
const _yCountCache = {};

function toggleYReplies(el) {
  const box = el.nextElementSibling;
  const open = box.classList.toggle('open');
  el.textContent = open ? '▲ コメントを閉じる' : `💬 コメントを見る (${box.dataset.count}件)`;
}

function _buildOwnPostEl(p) {
  const repliesHtml = p.replies.map(r => `
    <div class="y-reply-item">
      <div class="y-reply-ava">${r.ava}</div>
      <div>
        <div class="y-reply-name">${r.name}</div>
        <div class="y-reply-text">${r.text}</div>
      </div>
    </div>`).join('');
  const own = document.createElement('div');
  own.className = 'y-post y-post-own';
  own.innerHTML = `
    <div class="y-post-avatar">${p.avatar}</div>
    <div class="y-post-main">
      <div class="y-post-header">
        <span class="y-post-name">${p.name}</span>
        <span class="y-post-handle">${p.handle}</span>
        <span class="y-post-dot">·</span>
        <span class="y-post-time">たった今</span>
      </div>
      <div class="y-post-body">${p.text.replace(/\n/g,'<br>')}</div>
      ${p.imageSrc ? `<img src="${p.imageSrc}" alt="" onclick="openChatImageViewer(this.src)" style="max-width:100%;border-radius:12px;margin-top:8px;cursor:pointer;display:block;">` : ''}
      <div class="y-post-body" style="margin-top:4px"><span class="y-post-tag">${p.tags}</span></div>
      <div class="y-post-actions">
        <div class="y-post-action">
          <svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 7.501 3.58 7.501 8 0 4.421-3.01 8-7.5 8h-4.135c-1.006 2.834-3.27 4.818-6.636 5-.392.022-.615-.38-.461-.749C3.498 19.208 3.75 17.564 3.75 16c0-3.916.017-6-2-6zm8.005-6c-3.317 0-6.005 2.686-6.005 6 0 1.876-.23 3.408-1.073 5.122C5.136 15.124 7.03 13.568 8 11.5h5.756c2.995 0 5.5-2.685 5.5-5.5S16.756 0 13.756 0H9.756z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <span class="y-post-label">${p.replies.length}</span>
        </div>
        <div class="y-post-action y-rt" onclick="this.classList.toggle('liked'); const n=parseInt(this.querySelector('.y-post-label').textContent.replace(/[^\\d]/g,''))||0; this.querySelector('.y-post-label').textContent=this.classList.contains('liked')?(n+1)+'' : Math.max(0,n-1)+''">
          <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
          <span class="y-post-label">${p.rtsDelta}</span>
        </div>
        <div class="y-post-action" onclick="this.classList.toggle('liked'); const n=parseInt(this.querySelector('.y-post-label').textContent.replace(/[^\\d]/g,''))||0; this.querySelector('.y-post-label').textContent=this.classList.contains('liked')?(n+1)+'' : Math.max(0,n-1)+''">
          <svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>
          <span class="y-post-label">${p.likesDelta}</span>
        </div>
      </div>
      <div class="y-post-reply-toggle" onclick="toggleYReplies(this)">💬 コメントを見る (${p.replies.length}件)</div>
      <div class="y-post-replies" data-count="${p.replies.length}">${repliesHtml}</div>
    </div>`;
  return own;
}

function renderYTimeline(tab) {
  const feed = document.getElementById('yFeed');
  if (!feed) return;
  feed.innerHTML = '';

  if (tab === 'recommend' && window._allPostedContents?.length) {
    window._allPostedContents.slice().reverse().forEach((p, idx) => {
      try {
        const el = _buildOwnPostEl(p);
        if (idx === 0) el.classList.add('y-post-new'); // 最新投稿にハイライト
        feed.appendChild(el);
      } catch(e) { console.error('own post error', e, p); }
    });
  }

  const posts = tab === 'following' ? Y_POSTS_FOLLOWING : Y_POSTS_RECOMMEND;
  posts.forEach((p, idx) => {
    const el = document.createElement('div');
    el.className = 'y-post';
    const tagsHtml = p.tags.map(t => `<span class="y-post-tag">${t}</span>`).join(' ');
    const quoteHtml = p.quote
      ? `<div class="y-post-quote"><div class="y-post-quote-name">${p.quote.name}</div>${p.quote.text}</div>`
      : '';
    const verifiedHtml = p.verified ? `<span class="y-post-verified" title="認証済み">✓</span>` : '';
    const badgeHtml    = p.badge    ? `<div class="y-post-badge">${p.badge}</div>` : '';
    el.innerHTML = `
      <div class="y-post-avatar">${p.avatar}</div>
      <div class="y-post-main">
        ${badgeHtml}
        <div class="y-post-header">
          <span class="y-post-name">${p.name}</span>
          ${verifiedHtml}
          <span class="y-post-handle">${p.handle}</span>
          <span class="y-post-dot">·</span>
          <span class="y-post-time">${p.time}</span>
        </div>
        <div class="y-post-body">${p.body.replace(/\n/g,'<br>')}${tagsHtml ? '<br>' + tagsHtml : ''}</div>
        ${quoteHtml}
        <div class="y-post-actions">
          <div class="y-post-action">
            <svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 7.501 3.58 7.501 8 0 4.421-3.01 8-7.5 8h-4.135c-1.006 2.834-3.27 4.818-6.636 5-.392.022-.615-.38-.461-.749C3.498 19.208 3.75 17.564 3.75 16c0-3.916.017-6 -2-6zm8.005-6c-3.317 0-6.005 2.686-6.005 6 0 1.876-.23 3.408-1.073 5.122C5.136 15.124 7.03 13.568 8 11.5h5.756c2.995 0 5.5-2.685 5.5-5.5S16.756 0 13.756 0H9.756z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
            <span class="y-post-label">${(_yCountCache[tab+idx] = _yCountCache[tab+idx] ?? Math.floor(Math.random()*80+5))}</span>
          </div>
          <div class="y-post-action y-rt" onclick="this.classList.toggle('liked'); const n=parseInt(this.querySelector('.y-post-label').textContent.replace(/[^\d]/g,''))||0; this.querySelector('.y-post-label').textContent=this.classList.contains('liked')? (n+1)+'' : Math.max(0,n-1)+''">
            <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
            <span class="y-post-label">${p.rt}</span>
          </div>
          <div class="y-post-action" onclick="this.classList.toggle('liked'); const n=parseInt(this.querySelector('.y-post-label').textContent.replace(/[^\d]/g,''))||0; this.querySelector('.y-post-label').textContent=this.classList.contains('liked')? (n+1)+'' : Math.max(0,n-1)+''">
            <svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>
            <span class="y-post-label">${p.like}</span>
          </div>
          <div class="y-post-action">
            <svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>
          </div>
        </div>
      </div>`;
    feed.appendChild(el);
  });
}

function renderYTrends() {
  const el = document.getElementById('yTrends');
  if (!el) return;
  el.innerHTML = Y_TRENDS.map(t => `
    <div class="y-trend-item">
      <div class="y-trend-cat">${t.cat}</div>
      <div class="y-trend-name">${t.name}</div>
      <div class="y-trend-count">${t.count}</div>
    </div>`).join('');
}

function renderYSuggestions() {
  const el = document.getElementById('ySuggest');
  if (!el) return;
  el.innerHTML = Y_SUGGESTIONS.map(u => `
    <div class="y-suggest-item">
      <div class="y-suggest-avatar">${u.avatar}</div>
      <div class="y-suggest-info">
        <div class="y-suggest-name">${u.name}</div>
        <div class="y-suggest-handle">${u.handle}</div>
      </div>
      <button class="y-follow-btn" onclick="this.textContent=this.textContent==='フォロー'?'フォロー済み':'フォロー'; this.style.background=this.textContent==='フォロー済み'?'#2f3336':'#e7e9ea'; this.style.color=this.textContent==='フォロー済み'?'#e7e9ea':'#0f1419'">フォロー</button>
    </div>`).join('');
}
