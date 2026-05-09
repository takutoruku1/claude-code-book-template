'use strict';

// ── Card model ──────────────────────────────────────────────────────────────
const SUITS  = ['♠','♥','♦','♣'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RED_SUITS  = new Set(['♥','♦']);

function cardColor(suit) { return RED_SUITS.has(suit) ? 'red' : 'black'; }
function rankVal(rank)   { return RANKS.indexOf(rank) + 1; }

function makeDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ suit, rank, faceUp: false });
  return deck;
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── State ────────────────────────────────────────────────────────────────────
let tableau   = [];   // 7 arrays of cards
let foundation= [];   // 4 arrays (♠♥♦♣ order)
let stock     = [];   // face-down draw pile
let waste     = [];   // face-up draw pile

let score  = 0;
let moves  = 0;
let elapsed= 0;
let timerID= null;

let selected = null;  // { source, colIdx, cardIdx } or { source:'waste' }
let undoStack= [];

// ── DOM helpers ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function makeCardEl(card, isTopOfCascade) {
  const el = document.createElement('div');
  el.className = 'card' + (card.faceUp ? ' ' + cardColor(card.suit) : ' face-down');
  if (card.faceUp) {
    el.innerHTML = `
      <div class="corner tl"><span>${card.rank}</span><span>${card.suit}</span></div>
      <div class="center-suit">${card.suit}</div>
      <div class="corner br"><span>${card.rank}</span><span>${card.suit}</span></div>`;
  }
  return el;
}

// ── Render ───────────────────────────────────────────────────────────────────
const OVERLAP_DOWN = 22;   // px offset for face-down
const OVERLAP_UP   = 28;   // px offset for face-up

function renderAll() {
  renderStock();
  renderWaste();
  renderFoundations();
  renderTableau();
  $('statScore').textContent = score;
  $('statMoves').textContent = moves;
}

function renderStock() {
  const el = $('slotStock');
  el.innerHTML = '';
  if (stock.length > 0) {
    const c = document.createElement('div');
    c.className = 'card face-down';
    c.style.cssText = 'position:relative;width:100%;aspect-ratio:72/100;cursor:pointer;';
    c.addEventListener('click', onStockClick);
    el.appendChild(c);
  } else {
    el.addEventListener('click', onStockClick, { once: true });
  }
}

function renderWaste() {
  const el = $('slotWaste');
  el.innerHTML = '';
  if (waste.length === 0) return;
  const card = waste[waste.length - 1];
  const c = makeCardEl({ ...card, faceUp: true });
  c.style.cssText = 'position:relative;width:100%;aspect-ratio:72/100;';
  if (selected?.source === 'waste') c.classList.add('selected');
  c.addEventListener('click', onWasteClick);
  el.appendChild(c);
}

function renderFoundations() {
  SUITS.forEach((suit, fi) => {
    const slot = $('f' + fi);
    slot.innerHTML = '';
    const pile = foundation[fi];
    if (pile.length === 0) {
      slot.onclick = () => onFoundationClick(fi);
      return;
    }
    const card = pile[pile.length - 1];
    const c = makeCardEl({ ...card, faceUp: true });
    c.style.cssText = 'position:relative;width:100%;aspect-ratio:72/100;';
    c.addEventListener('click', () => onFoundationClick(fi));
    slot.appendChild(c);
    slot.onclick = null;
  });
}

function renderTableau() {
  for (let ci = 0; ci < 7; ci++) {
    const col = tableau[ci];
    const colEl = $('col' + ci);
    colEl.innerHTML = '';

    if (col.length === 0) {
      colEl.style.minHeight = 'calc(var(--card-h, 100px) * 0.8)';
      colEl.style.height = 'calc(var(--card-h, 100px) * 0.8)';
      colEl.onclick = () => onEmptyColClick(ci);
      continue;
    }
    colEl.onclick = null;

    // Calculate total height needed
    let totalH = 0;
    col.forEach((card, idx) => {
      if (idx === col.length - 1) {
        totalH += 100; // last card full height (relative units)
      } else {
        totalH += card.faceUp ? OVERLAP_UP : OVERLAP_DOWN;
      }
    });

    // Use pixels via CSS custom prop fallback
    const cardPxH = colEl.offsetWidth * (100 / 72) || 100;
    const colHeightPx = col.reduce((acc, card, idx) => {
      if (idx === col.length - 1) return acc + cardPxH;
      return acc + (card.faceUp ? OVERLAP_UP : OVERLAP_DOWN);
    }, 0);
    colEl.style.height = colHeightPx + 'px';

    let topPx = 0;
    col.forEach((card, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'card-wrap';
      wrap.style.top = topPx + 'px';

      const c = makeCardEl(card);
      c.style.position = 'relative';
      c.style.width = '100%';

      const isSel = selected?.source === 'tableau'
        && selected.colIdx === ci
        && selected.cardIdx <= idx
        && card.faceUp;

      if (isSel) c.classList.add('selected');

      if (card.faceUp) {
        c.addEventListener('click', (e) => { e.stopPropagation(); onTableauCardClick(ci, idx); });
        c.addEventListener('dblclick', (e) => { e.stopPropagation(); onTableauDblClick(ci, idx); });
      }

      wrap.appendChild(c);
      colEl.appendChild(wrap);

      topPx += (idx === col.length - 1) ? 0 : (card.faceUp ? OVERLAP_UP : OVERLAP_DOWN);
    });
  }
}

// ── Game logic helpers ────────────────────────────────────────────────────────
function canPlaceOnFoundation(card, fi) {
  const pile = foundation[fi];
  if (card.suit !== SUITS[fi]) return false;
  if (pile.length === 0) return rankVal(card.rank) === 1;
  return rankVal(card.rank) === rankVal(pile[pile.length - 1].rank) + 1;
}

function canPlaceOnTableau(card, col) {
  if (col.length === 0) return rankVal(card.rank) === 13; // King only
  const top = col[col.length - 1];
  if (!top.faceUp) return false;
  return cardColor(card.suit) !== cardColor(top.suit)
    && rankVal(card.rank) === rankVal(top.rank) - 1;
}

function foundationIndexForCard(card) {
  return SUITS.indexOf(card.suit);
}

function autoMoveToFoundation(card) {
  const fi = foundationIndexForCard(card);
  return canPlaceOnFoundation(card, fi) ? fi : -1;
}

// ── Save/restore state for undo ───────────────────────────────────────────────
function saveState() {
  undoStack.push(JSON.stringify({ tableau, foundation, stock, waste, score, moves }));
  if (undoStack.length > 50) undoStack.shift();
}

function undo() {
  if (undoStack.length === 0) return;
  const s = JSON.parse(undoStack.pop());
  tableau    = s.tableau;
  foundation = s.foundation;
  stock      = s.stock;
  waste      = s.waste;
  score      = s.score;
  moves      = s.moves;
  selected   = null;
  renderAll();
}

// ── Event handlers ────────────────────────────────────────────────────────────
function onStockClick() {
  saveState();
  if (stock.length > 0) {
    const card = stock.pop();
    card.faceUp = true;
    waste.push(card);
    addScore(stock.length === 0 ? 0 : 0);
  } else if (waste.length > 0) {
    // Recycle waste → stock
    while (waste.length) {
      const card = waste.pop();
      card.faceUp = false;
      stock.push(card);
    }
    addScore(-100);
  }
  selected = null;
  renderAll();
}

function onWasteClick() {
  if (waste.length === 0) return;
  if (selected?.source === 'waste') {
    selected = null;
  } else {
    selected = { source: 'waste', card: waste[waste.length - 1] };
  }
  renderAll();
}

function onFoundationClick(fi) {
  if (!selected) return;
  const card = getSelectedCard();
  if (!card || !canPlaceOnFoundation(card, fi)) { selected = null; renderAll(); return; }
  saveState();
  placeSelected([card], 'foundation', fi);
}

function onTableauCardClick(ci, idx) {
  const col = tableau[ci];
  const card = col[idx];
  if (!card.faceUp) return;

  if (selected) {
    // Try to place
    const cards = getSelectedCards();
    if (cards && canPlaceOnTableau(cards[0], col.slice(0, idx + 1))) {
      saveState();
      placeSelected(cards, 'tableau', ci);
      return;
    }
    // Reselect
    selected = { source: 'tableau', colIdx: ci, cardIdx: idx };
    renderAll();
    return;
  }

  // Select this card (and all below it)
  selected = { source: 'tableau', colIdx: ci, cardIdx: idx };
  renderAll();
}

function onTableauDblClick(ci, idx) {
  const col = tableau[ci];
  if (idx !== col.length - 1) return; // only top card
  const card = col[idx];
  if (!card.faceUp) return;
  const fi = autoMoveToFoundation(card);
  if (fi >= 0) {
    saveState();
    selected = { source: 'tableau', colIdx: ci, cardIdx: idx };
    placeSelected([card], 'foundation', fi);
  }
}

function onEmptyColClick(ci) {
  if (!selected) return;
  const cards = getSelectedCards();
  if (!cards) return;
  if (canPlaceOnTableau(cards[0], [])) {
    saveState();
    placeSelected(cards, 'tableau', ci);
  } else {
    selected = null;
    renderAll();
  }
}

// ── Move execution ────────────────────────────────────────────────────────────
function getSelectedCard() {
  if (!selected) return null;
  if (selected.source === 'waste') return waste[waste.length - 1];
  if (selected.source === 'tableau') return tableau[selected.colIdx][selected.cardIdx];
  return null;
}

function getSelectedCards() {
  if (!selected) return null;
  if (selected.source === 'waste') return [waste[waste.length - 1]];
  if (selected.source === 'tableau') {
    const col = tableau[selected.colIdx];
    return col.slice(selected.cardIdx);
  }
  return null;
}

function placeSelected(cards, destType, destIdx) {
  // Remove from source
  if (selected.source === 'waste') {
    waste.pop();
  } else if (selected.source === 'tableau') {
    const col = tableau[selected.colIdx];
    col.splice(selected.cardIdx);
    // Flip new top card
    if (col.length > 0 && !col[col.length - 1].faceUp) {
      col[col.length - 1].faceUp = true;
      addScore(5);
    }
  }

  // Add to destination
  if (destType === 'foundation') {
    foundation[destIdx].push(...cards);
    addScore(cards.length === 1 ? 10 : 10);
  } else if (destType === 'tableau') {
    tableau[destIdx].push(...cards);
  }

  moves++;
  selected = null;
  renderAll();
  checkWin();
}

function addScore(n) {
  score = Math.max(0, score + n);
}

// ── Win detection ─────────────────────────────────────────────────────────────
function checkWin() {
  const won = foundation.every(pile => pile.length === 13);
  if (won) {
    clearInterval(timerID);
    const bonus = Math.max(0, Math.floor((700 - elapsed) * 2));
    score += bonus;
    $('winStats').textContent =
      `スコア: ${score}  手数: ${moves}  タイム: ${fmtTime(elapsed)}`;
    $('winOverlay').classList.add('show');
  }
}

// ── Auto-complete ─────────────────────────────────────────────────────────────
function tryAutoComplete() {
  // Only if no face-down cards remain and stock/waste empty
  const hasFaceDown = tableau.some(col => col.some(c => !c.faceUp));
  if (hasFaceDown || stock.length > 0 || waste.length > 0) return false;

  let moved = true;
  while (moved) {
    moved = false;
    for (let ci = 0; ci < 7; ci++) {
      const col = tableau[ci];
      if (col.length === 0) continue;
      const card = col[col.length - 1];
      const fi = autoMoveToFoundation(card);
      if (fi >= 0) {
        col.pop();
        foundation[fi].push(card);
        addScore(10);
        moves++;
        moved = true;
      }
    }
  }
  renderAll();
  checkWin();
  return true;
}

// ── New game / deal ───────────────────────────────────────────────────────────
function newGame() {
  $('winOverlay').classList.remove('show');
  clearInterval(timerID);

  const deck = shuffle(makeDeck());
  tableau    = Array.from({ length: 7 }, () => []);
  foundation = Array.from({ length: 4 }, () => []);
  stock      = [];
  waste      = [];
  selected   = null;
  undoStack  = [];
  score      = 0;
  moves      = 0;
  elapsed    = 0;

  // Deal: col i gets i+1 cards, last is face-up
  let di = 0;
  for (let ci = 0; ci < 7; ci++) {
    for (let j = 0; j <= ci; j++) {
      const card = deck[di++];
      card.faceUp = (j === ci);
      tableau[ci].push(card);
    }
  }
  // Rest to stock
  while (di < deck.length) stock.push(deck[di++]);

  timerID = setInterval(() => {
    elapsed++;
    $('statTime').textContent = fmtTime(elapsed);
  }, 1000);

  renderAll();
}

function fmtTime(s) {
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// ── Click on board (deselect) ─────────────────────────────────────────────────
document.getElementById('board').addEventListener('click', e => {
  if (e.target === document.getElementById('board') ||
      e.target === document.getElementById('tableau') ||
      e.target === document.getElementById('topRow')) {
    selected = null;
    renderAll();
  }
});

// ── Buttons ───────────────────────────────────────────────────────────────────
document.getElementById('btnNew').addEventListener('click', () => {
  if (confirm('新しいゲームを始めますか？')) newGame();
});
document.getElementById('btnUndo').addEventListener('click', undo);

// ── Keyboard ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
  if (e.key === 'n' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (confirm('新しいゲームを始めますか？')) newGame(); }
  if (e.key === ' ') { e.preventDefault(); tryAutoComplete(); }
});

// ── Start ─────────────────────────────────────────────────────────────────────
newGame();
