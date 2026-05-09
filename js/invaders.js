/* ============================================================
   SPACE INVADERS
============================================================ */
(function () {

const S        = 2;     // pixel scale (1 sprite-px = 2 canvas-px)
const CW       = 400;   // canvas width
const CH       = 480;   // canvas height
const COLS     = 11;
const CELL_W   = 32;    // horizontal spacing between invader columns
const CELL_H   = 28;    // vertical spacing between invader rows
const GX0      = 24;    // grid left edge
const GY0      = 78;    // grid top edge
const PLR_Y    = 432;   // player cannon top-y

// Row configs (top → bottom): [spriteKey, color]
const ROW_DEF = [
  { type: 'BEETLE',  color: '#ff9944' },
  { type: 'SKULL',   color: '#ff6bff' },
  { type: 'SQUID',   color: '#6bffff' },
  { type: 'OCTOPUS', color: '#6bff6b' },
  { type: 'CRAB',    color: '#ffff6b' },
];

const SHIELD_Y  = 372;
const SHIELD_XS = [78, 142, 206, 270];

// ── state ──────────────────────────────────────────────────
let state, score, hiscore, lives, tick;
let raf, canvas, ctx, keys;
let grid, formX, formY, dir, phase, moveTimer, moveInt;
let plrX;
let bullet, bombs, ufo, ufoTick, shields, explosions;

hiscore = 0; // survives across games

function getCtx() {
  if (!canvas) {
    canvas = document.getElementById('invCanvas');
    ctx = canvas ? canvas.getContext('2d') : null;
  }
  return ctx;
}

function aliveCount() { return grid.filter(i => i.alive).length; }

// ── init ───────────────────────────────────────────────────
function startGame() {
  if (!getCtx()) return;
  score = 0; lives = 3; tick = 0; state = 'playing';
  formX = 0; formY = 0; dir = 1; phase = 0; moveTimer = 0; moveInt = 40;
  plrX = Math.round(CW / 2 - SPRITES.CANNON.w * S / 2);
  bullet = null; bombs = []; ufo = null; ufoTick = 0; explosions = [];

  grid = [];
  for (let r = 0; r < ROW_DEF.length; r++)
    for (let c = 0; c < COLS; c++)
      grid.push({ row: r, col: c, type: ROW_DEF[r].type, color: ROW_DEF[r].color, alive: true });

  shields = SHIELD_XS.map(x => ({
    x, y: SHIELD_Y,
    pixels: SPRITES.SHIELD.a.map(row => [...row]),
  }));

  updateHUD();
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

// ── game loop ──────────────────────────────────────────────
function loop() {
  update();
  draw();
  if (state === 'playing') raf = requestAnimationFrame(loop);
}

function update() {
  tick++;

  // Player movement
  if (keys['ArrowLeft']  || keys['KeyA']) plrX = Math.max(0, plrX - 2.5);
  if (keys['ArrowRight'] || keys['KeyD']) plrX = Math.min(CW - SPRITES.CANNON.w * S, plrX + 2.5);

  // Formation step
  moveTimer++;
  if (moveTimer >= moveInt) { moveTimer = 0; phase ^= 1; moveFormation(); }

  // Bullet
  if (bullet) { bullet.y -= 6; if (bullet.y < 0) bullet = null; }

  // Bombs
  for (let i = bombs.length - 1; i >= 0; i--) {
    bombs[i].y += 2; bombs[i].phase ^= 1;
    if (bombs[i].y > CH) bombs.splice(i, 1);
  }

  // UFO spawn / move
  ufoTick++;
  if (!ufo && ufoTick >= 550) {
    ufoTick = 0;
    const d = Math.random() < 0.5 ? 1 : -1;
    ufo = { x: d === 1 ? -SPRITES.UFO.w * S : CW, y: 26, dir: d };
  }
  if (ufo) {
    ufo.x += 1.5 * ufo.dir;
    if (ufo.x > CW + 32 || ufo.x < -32) ufo = null;
  }

  // Enemy bombing
  if (tick % 60 === 0 && bombs.length < 3) {
    const alive = grid.filter(i => i.alive);
    if (alive.length) {
      const sh = alive[Math.floor(Math.random() * alive.length)];
      const sp = SPRITES[sh.type];
      bombs.push({
        x: GX0 + sh.col * CELL_W + formX + Math.floor(sp.w * S / 2),
        y: GY0 + sh.row * CELL_H + formY + sp.h * S,
        phase: 0,
      });
    }
  }

  // Collisions
  hitBulletVsInvaders();
  hitBulletVsUfo();
  hitBulletVsShields();
  hitBombsVsShields();
  hitBombsVsPlayer();
  checkBottom();
  tickExplosions();

  if (state === 'playing' && aliveCount() === 0) state = 'win';
}

function moveFormation() {
  const alive = grid.filter(i => i.alive);
  if (!alive.length) return;
  const minC  = Math.min(...alive.map(i => i.col));
  const maxC  = Math.max(...alive.map(i => i.col));
  const rInv  = alive.find(i => i.col === maxC);
  const left  = GX0 + minC * CELL_W + formX;
  const right = GX0 + maxC * CELL_W + formX + SPRITES[rInv.type].w * S;

  if      (dir ===  1 && right >= CW - 4) { dir = -1; formY += 8; }
  else if (dir === -1 && left  <=      4) { dir =  1; formY += 8; }
  else formX += dir * 4;
}

// ── collision helpers ──────────────────────────────────────
function hitBulletVsInvaders() {
  if (!bullet) return;
  for (const inv of grid) {
    if (!inv.alive) continue;
    const sp = SPRITES[inv.type];
    const ix = GX0 + inv.col * CELL_W + formX;
    const iy = GY0 + inv.row * CELL_H + formY;
    if (bullet.x >= ix && bullet.x <= ix + sp.w * S &&
        bullet.y >= iy && bullet.y <= iy + sp.h * S) {
      inv.alive = false;
      score += sp.score;
      if (score > hiscore) hiscore = score;
      explosions.push({ x: ix, y: iy, ttl: 20, phase: 0, color: inv.color, isPlayer: false });
      bullet = null;
      updateHUD();
      moveInt = Math.max(4, 40 - Math.floor((55 - aliveCount()) * 0.65));
      return;
    }
  }
}

function hitBulletVsUfo() {
  if (!bullet || !ufo) return;
  const uw = SPRITES.UFO.w * S, uh = SPRITES.UFO.h * S;
  if (bullet.x >= ufo.x && bullet.x <= ufo.x + uw &&
      bullet.y >= ufo.y && bullet.y <= ufo.y + uh) {
    score += 200;
    if (score > hiscore) hiscore = score;
    explosions.push({ x: ufo.x, y: ufo.y, ttl: 20, phase: 0, color: '#ff4444', isPlayer: false });
    ufo = null; bullet = null;
    updateHUD();
  }
}

function hitBulletVsShields() {
  if (!bullet) return;
  for (const sh of shields) {
    const sc = Math.floor((bullet.x - sh.x) / S);
    const sr = Math.floor((bullet.y - sh.y) / S);
    if (sr >= 0 && sr < SPRITES.SHIELD.h && sc >= 0 && sc < SPRITES.SHIELD.w && sh.pixels[sr]?.[sc]) {
      erodeShield(sh, sc, sr, 2);
      bullet = null;
      return;
    }
  }
}

function hitBombsVsShields() {
  for (let bi = bombs.length - 1; bi >= 0; bi--) {
    const b = bombs[bi];
    for (const sh of shields) {
      const sc = Math.floor((b.x - sh.x) / S);
      const sr = Math.floor((b.y - sh.y) / S);
      if (sr >= 0 && sr < SPRITES.SHIELD.h && sc >= 0 && sc < SPRITES.SHIELD.w && sh.pixels[sr]?.[sc]) {
        erodeShield(sh, sc, sr, 3);
        bombs.splice(bi, 1);
        break;
      }
    }
  }
}

function hitBombsVsPlayer() {
  if (explosions.some(e => e.isPlayer)) return; // invulnerable during explosion
  const pw = SPRITES.CANNON.w * S, ph = SPRITES.CANNON.h * S;
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    if (b.x >= plrX && b.x <= plrX + pw && b.y >= PLR_Y && b.y <= PLR_Y + ph) {
      bombs.splice(i, 1);
      playerHit();
      return;
    }
  }
}

function checkBottom() {
  for (const inv of grid) {
    if (!inv.alive) continue;
    const sp = SPRITES[inv.type];
    if (GY0 + inv.row * CELL_H + formY + sp.h * S >= PLR_Y) { state = 'gameover'; return; }
  }
}

function tickExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].ttl--;
    explosions[i].phase = explosions[i].ttl % 2;
    if (explosions[i].ttl <= 0) explosions.splice(i, 1);
  }
}

function playerHit() {
  explosions.push({ x: plrX, y: PLR_Y, ttl: 40, phase: 0, color: '#ff6b9d', isPlayer: true });
  lives--;
  if (lives <= 0) { state = 'gameover'; return; }
  plrX = Math.round(CW / 2 - SPRITES.CANNON.w * S / 2);
  bullet = null;
  updateHUD();
}

function erodeShield(sh, col, row, r) {
  for (let dr = -r; dr <= r; dr++)
    for (let dc = -r; dc <= r; dc++) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < SPRITES.SHIELD.h && nc >= 0 && nc < SPRITES.SHIELD.w)
        sh.pixels[nr][nc] = 0;
    }
}

function updateHUD() {
  const s = document.getElementById('invScore');
  if (s) s.textContent = String(score).padStart(4, '0');
  const h = document.getElementById('invHiScore');
  if (h) h.textContent = String(hiscore).padStart(4, '0');
}

// ── draw ───────────────────────────────────────────────────
function draw() {
  if (!getCtx()) return;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CW, CH);

  if (state === 'idle') { drawIdle(); return; }

  // Ground line
  ctx.fillStyle = '#3f3';
  ctx.fillRect(0, PLR_Y + SPRITES.CANNON.h * S + 2, CW, 1);

  // Score
  ctx.font = '8px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';  ctx.fillText('SCORE',    80, 12);
  ctx.fillText('HI-SCORE', 200, 12);
  ctx.fillText('LIVES',    320, 12);
  ctx.fillStyle = '#ff6b9d';
  ctx.fillText(String(score).padStart(4, '0'),  80, 24);
  ctx.fillText(String(hiscore).padStart(4, '0'), 200, 24);
  ctx.textAlign = 'left';
  for (let i = 0; i < lives - 1; i++)
    drawSprite(ctx, SPRITES.CANNON.a, 296 + i * (SPRITES.CANNON.w * S + 3), 16, S, '#3f3');

  // UFO
  if (ufo) drawSprite(ctx, SPRITES.UFO.a, ufo.x, ufo.y, S, '#ff4444');

  // Shields
  ctx.fillStyle = '#3f3';
  for (const sh of shields)
    for (let r = 0; r < sh.pixels.length; r++)
      for (let c = 0; c < sh.pixels[r].length; c++)
        if (sh.pixels[r][c]) ctx.fillRect(sh.x + c * S, sh.y + r * S, S, S);

  // Invaders
  for (const inv of grid) {
    if (!inv.alive) continue;
    const sp = SPRITES[inv.type];
    const ix = GX0 + inv.col * CELL_W + formX;
    const iy = GY0 + inv.row * CELL_H + formY;
    drawSprite(ctx, phase === 0 ? sp.a : (sp.b || sp.a), ix, iy, S, inv.color);
  }

  // Player cannon
  if (!explosions.some(e => e.isPlayer))
    drawSprite(ctx, SPRITES.CANNON.a, plrX, PLR_Y, S, '#3f3');

  // Bullet
  if (bullet) drawSprite(ctx, SPRITES.BULLET.a, bullet.x, bullet.y, S, '#fff');

  // Bombs
  for (const b of bombs)
    drawSprite(ctx, b.phase === 0 ? SPRITES.BOMB.a : SPRITES.BOMB.b, b.x, b.y, S, '#f84');

  // Explosions
  for (const ex of explosions) {
    const fr = ex.isPlayer
      ? (ex.phase === 0 ? SPRITES.CANNON_HIT.a : SPRITES.CANNON_HIT.b)
      : (ex.phase === 0 ? SPRITES.EXPLOSION.a  : SPRITES.EXPLOSION.b);
    drawSprite(ctx, fr, ex.x, ex.y, S, ex.color);
  }

  // Overlay
  if (state === 'gameover' || state === 'win') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CW, CH);
    ctx.font = 'bold 20px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillStyle = state === 'win' ? '#00d4aa' : '#ff6b9d';
    ctx.fillText(state === 'win' ? 'YOU WIN!' : 'GAME OVER', CW / 2, CH / 2 - 14);
    ctx.font = '10px "Courier New"';
    ctx.fillStyle = '#fff';
    ctx.fillText(`SCORE: ${score}`, CW / 2, CH / 2 + 4);
    ctx.fillText('SPACE / FIRE: PLAY AGAIN', CW / 2, CH / 2 + 20);
    ctx.textAlign = 'left';
  }
}

function drawIdle() {
  ctx.fillStyle = '#3f3';
  ctx.font = 'bold 16px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE INVADERS', CW / 2, 130);
  ctx.font = '9px "Courier New"';
  ctx.fillStyle = '#aaa';
  ctx.fillText('← →  MOVE       SPACE  FIRE', CW / 2, 152);
  ctx.fillStyle = '#888';
  ctx.font = '8px "Courier New"';
  ctx.fillText('PRESS SPACE OR FIRE TO START', CW / 2, 170);

  ctx.fillStyle = '#666';
  ctx.fillText('= SCORE ADVANCE TABLE =', CW / 2, 210);

  let ty = 234;
  for (const row of ROW_DEF) {
    const sp = SPRITES[row.type];
    const sx = CW / 2 - sp.w * S / 2 - 40;
    drawSprite(ctx, sp.a, sx, ty - sp.h * S + 2, S, row.color);
    ctx.fillStyle = row.color;
    ctx.textAlign = 'right';
    ctx.fillText(`= ${sp.score} PTS`, CW / 2 + 52, ty);
    ty += 26;
  }
  // UFO row
  const usp = SPRITES.UFO;
  drawSprite(ctx, usp.a, CW / 2 - usp.w * S / 2 - 40, ty - usp.h * S + 2, S, '#ff4444');
  ctx.fillStyle = '#ff4444';
  ctx.textAlign = 'right';
  ctx.fillText('= ? PTS', CW / 2 + 52, ty);
  ctx.textAlign = 'left';
}

// ── controls ───────────────────────────────────────────────
function fireBullet() {
  if (state === 'idle' || state === 'gameover' || state === 'win') {
    startGame();
  } else if (state === 'playing' && !bullet) {
    bullet = { x: Math.round(plrX + (SPRITES.CANNON.w * S) / 2), y: PLR_Y };
  }
}

function onKeyDown(e) {
  keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); fireBullet(); }
}
function onKeyUp(e) { keys[e.code] = false; }

function attachTouchControls() {
  const btnL = document.getElementById('invBtnLeft');
  const btnR = document.getElementById('invBtnRight');
  const btnF = document.getElementById('invBtnFire');
  if (!btnL || !btnR || !btnF) return;

  const press   = k => () => { keys[k] = true;  };
  const release = k => () => { keys[k] = false; };

  btnL.addEventListener('touchstart', e => { e.preventDefault(); press('ArrowLeft')();  }, { passive: false });
  btnL.addEventListener('touchend',   e => { e.preventDefault(); release('ArrowLeft')(); }, { passive: false });
  btnL.addEventListener('mousedown',  press('ArrowLeft'));
  btnL.addEventListener('mouseup',    release('ArrowLeft'));
  btnL.addEventListener('mouseleave', release('ArrowLeft'));

  btnR.addEventListener('touchstart', e => { e.preventDefault(); press('ArrowRight')();  }, { passive: false });
  btnR.addEventListener('touchend',   e => { e.preventDefault(); release('ArrowRight')(); }, { passive: false });
  btnR.addEventListener('mousedown',  press('ArrowRight'));
  btnR.addEventListener('mouseup',    release('ArrowRight'));
  btnR.addEventListener('mouseleave', release('ArrowRight'));

  btnF.addEventListener('touchstart', e => { e.preventDefault(); fireBullet(); }, { passive: false });
  btnF.addEventListener('mousedown',  () => fireBullet());
}

// ── public API ─────────────────────────────────────────────
window.openInvaders = function () {
  const win = document.getElementById('invadersWindow');
  if (!win) return;
  const firstOpen = !win.classList.contains('active');
  win.classList.add('active');
  window.invadersMinimized = false;
  bringToFront(win);
  if (typeof updateTaskbarIndicators === 'function') updateTaskbarIndicators();

  if (firstOpen) {
    canvas = null; // force re-acquire
    state = 'idle'; score = 0; lives = 3;
    grid = []; bombs = []; explosions = []; shields = [];
    keys = {};
    if (getCtx()) draw();
    attachTouchControls();
  }

  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup',   onKeyUp);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup',   onKeyUp);
};

window.closeInvaders = function () {
  const win = document.getElementById('invadersWindow');
  if (win) win.classList.remove('active');
  window.invadersMinimized = false;
  if (raf) { cancelAnimationFrame(raf); raf = null; }
  state = 'idle';
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup',   onKeyUp);
  if (typeof updateTaskbarIndicators === 'function') updateTaskbarIndicators();
};

})();
