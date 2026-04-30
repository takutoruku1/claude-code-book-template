// ===== 投稿タイミング判定ゲーム =====
// グラフのピークを狙ってクリック。命中精度でボーナスを獲得

const TIMING_GAME = {
  isRunning: false,
  isFinished: false,
  startTime: 0,
  peakTime: 0,
  duration: 4000,     // ゲーム全体の時間（ms）
  peakOffset: 2200,   // ゲーム開始からピークまでの時間
  clickTime: null,
  result: null,
  onComplete: null,
};

/**
 * ゲームを初期化して開始
 * @param {Function} onComplete - ゲーム完了時のコールバック(result)
 */
function startTimingGame(onComplete) {
  TIMING_GAME.onComplete = onComplete;
  TIMING_GAME.isRunning = true;
  TIMING_GAME.isFinished = false;
  TIMING_GAME.clickTime = null;
  TIMING_GAME.result = null;
  TIMING_GAME.startTime = Date.now();
  TIMING_GAME.peakTime = TIMING_GAME.startTime + TIMING_GAME.peakOffset;
  
  const gameArea = document.getElementById('timingGameArea');
  if (!gameArea) return;
  
  // ゲーム開始前に必ずUIをリセット
  gameArea.classList.remove('active');
  setTimeout(() => gameArea.classList.add('active'), 50);
  
  // ゲージのリセット
  const gauge = document.getElementById('timingGauge');
  const clickZone = document.getElementById('timingClickZone');
  const indicator = document.getElementById('timingIndicator');
  const result = document.getElementById('timingResult');
  
  if (gauge) {
    gauge.style.height = '0%';
    result.textContent = '';
    result.className = '';
    result.style.opacity = '0';
  }
  
  // ゲージアニメーション開始
  animateTimingGauge();
  
  // クリックリスナー登録
  if (clickZone) {
    clickZone.onclick = () => onTimingClick();
  }
  
  // ゲーム終了タイマー
  setTimeout(() => {
    finishTimingGame();
  }, TIMING_GAME.duration);
}

/**
 * ゲージをアニメーション
 */
function animateTimingGauge() {
  const gauge = document.getElementById('timingGauge');
  if (!gauge || !TIMING_GAME.isRunning) return;
  
  const now = Date.now();
  const elapsed = now - TIMING_GAME.startTime;
  const progress = Math.min(elapsed / TIMING_GAME.duration, 1);
  
  // 山型（0→1→0）のイージング
  let height;
  if (progress <= 0.5) {
    // 上昇（0 → 1）
    height = progress * 2;
  } else {
    // 下降（1 → 0）
    height = 2 * (1 - progress);
  }
  
  gauge.style.height = (height * 100) + '%';
  
  // ピークの光を表示
  if (progress > 0.45 && progress < 0.55) {
    document.getElementById('timingIndicator')?.classList.add('peak-glow');
  } else {
    document.getElementById('timingIndicator')?.classList.remove('peak-glow');
  }
  
  if (TIMING_GAME.isRunning && progress < 1) {
    requestAnimationFrame(animateTimingGauge);
  }
}

/**
 * ゲージクリック
 */
function onTimingClick() {
  if (!TIMING_GAME.isRunning || TIMING_GAME.clickTime !== null) return;
  
  TIMING_GAME.clickTime = Date.now();
  const timeSincePeak = Math.abs(TIMING_GAME.clickTime - TIMING_GAME.peakTime);
  
  // 精度を計算（250ms以内を満点）
  const accuracy = Math.max(0, 1 - (timeSincePeak / 250));
  
  // ボーナス計算
  const buzzBonus = Math.round(accuracy * 80);  // 最大 +80
  const selfBonus = Math.round(accuracy * 100); // 最大 +100
  
  TIMING_GAME.result = {
    accuracy,
    buzzBonus,
    selfBonus,
    timeSincePeak,
  };
  
  // 結果表示
  showTimingResult(accuracy, buzzBonus, selfBonus);
  
  // ゲーム停止
  TIMING_GAME.isRunning = false;
  
  // 結果表示後すぐにUIを消す
  setTimeout(() => {
    finishTimingGame();
  }, 500);
}

/**
 * 結果表示
 */
function showTimingResult(accuracy, buzzBonus, selfBonus) {
  const resultEl = document.getElementById('timingResult');
  if (!resultEl) return;
  
  let message = '';
  let className = '';
  
  if (accuracy > 0.85) {
    message = `🎯 パーフェクト！\n+${buzzBonus} buzz\n+${selfBonus} らしさ`;
    className = 'result-perfect';
  } else if (accuracy > 0.6) {
    message = `✨ グッド！\n+${buzzBonus} buzz\n+${selfBonus} らしさ`;
    className = 'result-good';
  } else if (accuracy > 0.3) {
    message = `👍 OK\n+${buzzBonus} buzz\n+${selfBonus} らしさ`;
    className = 'result-ok';
  } else {
    message = `😅 ミス…\n+${buzzBonus} buzz\n+${selfBonus} らしさ`;
    className = 'result-miss';
  }
  
  resultEl.textContent = message;
  resultEl.className = className;
  resultEl.style.opacity = '1';
}

/**
 * ゲーム終了
 */
function finishTimingGame() {
  if (TIMING_GAME.isFinished) return; // 二重実行防止
  TIMING_GAME.isFinished = true;
  TIMING_GAME.isRunning = false;
  
  const gameArea = document.getElementById('timingGameArea');
  if (gameArea) {
    gameArea.classList.remove('active');
  }
  
  // クリックされなかった場合は最低限の結果を返す
  if (!TIMING_GAME.result) {
    TIMING_GAME.result = {
      accuracy: 0,
      buzzBonus: 0,
      selfBonus: 0,
      timeSincePeak: 1000,
    };
  }
  
  if (TIMING_GAME.onComplete) {
    TIMING_GAME.onComplete(TIMING_GAME.result);
  }
}

/**
 * ゲームをクリア（外部呼び出し用）
 */
function clearTimingGame() {
  TIMING_GAME.isRunning = false;
  const gameArea = document.getElementById('timingGameArea');
  if (gameArea) {
    gameArea.classList.remove('active');
  }
}
