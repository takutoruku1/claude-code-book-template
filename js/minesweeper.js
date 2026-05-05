/* ============================================================
   MINESWEEPER  5×5
============================================================ */
const MS_SIZE  = 5;
const MS_MINES = 5;

let msBoard    = [];
let msState    = 'idle'; // idle | playing | won | lost
let msTimerVal = 0;
let msTimerInt = null;
let msFlagsLeft = MS_MINES;
let msLostCell  = null;

function msReset() {
  clearInterval(msTimerInt);
  msTimerVal  = 0;
  msFlagsLeft = MS_MINES;
  msState     = 'idle';
  msLostCell  = null;

  msBoard = Array.from({ length: MS_SIZE }, () =>
    Array.from({ length: MS_SIZE }, () =>
      ({ mine: false, revealed: false, flagged: false, count: 0 })
    )
  );

  document.getElementById('msFace').textContent = '🙂';
  msLCD('msMineCount', msFlagsLeft);
  msLCD('msTimerEl',   0);
  msRender();
}

function msPlaceMines(skipR, skipC) {
  let placed = 0;
  while (placed < MS_MINES) {
    const r = Math.floor(Math.random() * MS_SIZE);
    const c = Math.floor(Math.random() * MS_SIZE);
    if (msBoard[r][c].mine) continue;
    if (r === skipR && c === skipC) continue;
    msBoard[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < MS_SIZE; r++)
    for (let c = 0; c < MS_SIZE; c++)
      if (!msBoard[r][c].mine)
        msBoard[r][c].count = msNeighbors(r, c).filter(([nr, nc]) => msBoard[nr][nc].mine).length;
}

function msNeighbors(r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < MS_SIZE && nc >= 0 && nc < MS_SIZE) out.push([nr, nc]);
    }
  return out;
}

function msReveal(r, c) {
  if (msState === 'lost' || msState === 'won') return;
  const cell = msBoard[r][c];
  if (cell.revealed || cell.flagged) return;

  if (msState === 'idle') {
    msState = 'playing';
    msPlaceMines(r, c);
    msTimerInt = setInterval(() => {
      msTimerVal = Math.min(999, msTimerVal + 1);
      msLCD('msTimerEl', msTimerVal);
    }, 1000);
  }

  cell.revealed = true;

  if (cell.mine) {
    msState   = 'lost';
    msLostCell = { r, c };
    clearInterval(msTimerInt);
    document.getElementById('msFace').textContent = '😵';
    for (let row = 0; row < MS_SIZE; row++)
      for (let col = 0; col < MS_SIZE; col++)
        if (msBoard[row][col].mine) msBoard[row][col].revealed = true;
    msRender();
    return;
  }

  if (cell.count === 0)
    msNeighbors(r, c).forEach(([nr, nc]) => {
      if (!msBoard[nr][nc].revealed && !msBoard[nr][nc].flagged) msReveal(nr, nc);
    });

  if (msCheckWin()) {
    msState = 'won';
    clearInterval(msTimerInt);
    document.getElementById('msFace').textContent = '😎';
  }

  msRender();
}

function msFlag(r, c) {
  if (msState === 'lost' || msState === 'won' || msState === 'idle') return;
  const cell = msBoard[r][c];
  if (cell.revealed) return;
  cell.flagged  = !cell.flagged;
  msFlagsLeft  += cell.flagged ? -1 : 1;
  msLCD('msMineCount', msFlagsLeft);
  msRender();
}

function msCheckWin() {
  for (let r = 0; r < MS_SIZE; r++)
    for (let c = 0; c < MS_SIZE; c++)
      if (!msBoard[r][c].mine && !msBoard[r][c].revealed) return false;
  return true;
}

function msLCD(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(Math.max(-99, Math.min(999, val))).padStart(3, '0');
}

const MS_NUM_COLORS = ['','#0100fe','#017f01','#fe0000','#010080','#7f0000','#008081','#000000','#808080'];

function msRender() {
  const grid = document.getElementById('msGrid');
  if (!grid) return;
  grid.innerHTML = '';

  for (let r = 0; r < MS_SIZE; r++) {
    for (let c = 0; c < MS_SIZE; c++) {
      const cell = msBoard[r][c];
      const div  = document.createElement('div');
      div.className = 'ms-cell';

      if (cell.revealed) {
        div.classList.add('revealed');
        if (cell.mine) {
          div.textContent = '💣';
          if (msLostCell && msLostCell.r === r && msLostCell.c === c)
            div.classList.add('mine-hit');
        } else if (cell.count > 0) {
          div.textContent = cell.count;
          div.style.color = MS_NUM_COLORS[cell.count];
        }
      } else if (cell.flagged) {
        div.textContent = '🚩';
      }

      div.addEventListener('click', () => msReveal(r, c));
      div.addEventListener('contextmenu', e => { e.preventDefault(); msFlag(r, c); });
      grid.appendChild(div);
    }
  }
}

function openMinesweeper() {
  const win = document.getElementById('minesweeperWindow');
  if (!win.classList.contains('active')) {
    win.classList.add('active');
    msReset();
  }
  bringToFront(win);
}

function closeMinesweeper() {
  document.getElementById('minesweeperWindow').classList.remove('active');
  clearInterval(msTimerInt);
}
