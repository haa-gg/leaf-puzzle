/* ================================================================
   game.js  —  HER TREES · Leaf Puzzle
   ================================================================ */

'use strict';

// ── Leaf definitions ──────────────────────────────────────────────
// Each leaf: { src, width (% of board), startX (% board), startY (% board) }
const LEAVES = [
  { id: 'europa',    src: 'images/leaf-europa.png',    width: 18, startX: 8,  startY: 15 },
  { id: 'direction', src: 'images/leaf-direction.png', width: 18, startX: 28, startY: 12 },
  { id: 'hermes',    src: 'images/leaf-hermes.png',    width: 16, startX: 50, startY: 20 },
  { id: 'puzzler',   src: 'images/leaf-puzzler.png',   width: 17, startX: 68, startY: 14 },
];

// ── Secret code ───────────────────────────────────────────────────
const SECRET_CODE = ['G', 'D', 'C', 'B'];

// ── State ─────────────────────────────────────────────────────────
let sequence = [];          // currently entered letters
let dragState = null;       // { el, offsetX, offsetY }
let leafZCounter = 10;      // z-index stack for drag order

// ── DOM refs ──────────────────────────────────────────────────────
const board       = document.getElementById('board');
const seqDots     = [1,2,3,4].map(i => document.getElementById(`seq-${i}`));
const letterBtns  = document.querySelectorAll('.letter-btn');
const clearBtn    = document.getElementById('clear-btn');
const overlay     = document.getElementById('unlock-overlay');
const closeBtn    = document.getElementById('unlock-close');

// ── Boot ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  spawnLeaves();
  bindLetterButtons();
  clearBtn.addEventListener('click', resetSequence);
  closeBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    resetSequence();
  });
});

// ── Spawn leaves ──────────────────────────────────────────────────
function spawnLeaves() {
  LEAVES.forEach((def, idx) => {
    const el = document.createElement('div');
    el.className = 'leaf';
    el.id = `leaf-${def.id}`;
    el.style.width   = `${def.width}%`;
    el.style.left    = `${def.startX}%`;
    el.style.top     = `${def.startY}%`;
    el.style.zIndex  = idx + 1;

    const img = document.createElement('img');
    img.src = def.src;
    img.alt = def.id;
    img.draggable = false;
    el.appendChild(img);

    // Drag events
    el.addEventListener('mousedown',  startDrag);
    el.addEventListener('touchstart', startDragTouch, { passive: false });

    board.appendChild(el);
  });
}

// ── Drag (mouse) ──────────────────────────────────────────────────
function startDrag(e) {
  e.preventDefault();
  const el = e.currentTarget;
  const boardRect = board.getBoundingClientRect();
  const elRect    = el.getBoundingClientRect();

  // Raise to top
  el.style.zIndex = ++leafZCounter;

  dragState = {
    el,
    offsetX: e.clientX - elRect.left,
    offsetY: e.clientY - elRect.top,
    boardRect,
  };

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup',   endDrag);
}

function onDrag(e) {
  if (!dragState) return;
  moveDraggable(e.clientX, e.clientY);
}

function endDrag() {
  dragState = null;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup',   endDrag);
}

// ── Drag (touch) ──────────────────────────────────────────────────
function startDragTouch(e) {
  e.preventDefault();
  const touch   = e.touches[0];
  const el      = e.currentTarget;
  const boardRect = board.getBoundingClientRect();
  const elRect    = el.getBoundingClientRect();

  el.style.zIndex = ++leafZCounter;

  dragState = {
    el,
    offsetX: touch.clientX - elRect.left,
    offsetY: touch.clientY - elRect.top,
    boardRect,
  };

  document.addEventListener('touchmove', onDragTouch, { passive: false });
  document.addEventListener('touchend',  endDragTouch);
}

function onDragTouch(e) {
  e.preventDefault();
  if (!dragState) return;
  const touch = e.touches[0];
  moveDraggable(touch.clientX, touch.clientY);
}

function endDragTouch() {
  dragState = null;
  document.removeEventListener('touchmove', onDragTouch);
  document.removeEventListener('touchend',  endDragTouch);
}

// ── Shared move logic ─────────────────────────────────────────────
function moveDraggable(clientX, clientY) {
  const { el, offsetX, offsetY, boardRect } = dragState;
  const elW = el.offsetWidth;
  const elH = el.offsetHeight;

  // Position relative to board
  let x = clientX - boardRect.left - offsetX;
  let y = clientY - boardRect.top  - offsetY;

  // Clamp inside board
  x = Math.max(0, Math.min(x, boardRect.width  - elW));
  y = Math.max(0, Math.min(y, boardRect.height - elH));

  el.style.left = `${(x / boardRect.width)  * 100}%`;
  el.style.top  = `${(y / boardRect.height) * 100}%`;
}

// ── Letter buttons ────────────────────────────────────────────────
function bindLetterButtons() {
  letterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (sequence.length >= 4) return; // already full

      const letter = btn.dataset.letter;
      sequence.push(letter);
      btn.classList.add('used');

      // Update display
      const dot = seqDots[sequence.length - 1];
      dot.textContent = letter;
      dot.classList.add('filled');

      // Check on 4th letter
      if (sequence.length === 4) {
        setTimeout(checkCode, 180);
      }
    });
  });
}

// ── Sequence logic ────────────────────────────────────────────────
function checkCode() {
  const code = sequence.join('');
  const correct = sequence.every((l, i) => l === SECRET_CODE[i]);
  
  if (correct) {
    sessionStorage.setItem('leaf_key', code);
    window.location.href = 'success.html';
    return;
  }

  // Flash red + reset
  seqDots.forEach(d => {
    d.classList.add('wrong');
    setTimeout(() => d.classList.remove('wrong'), 600);
  });
  setTimeout(resetSequence, 700);
}

function resetSequence() {
  sequence = [];
  seqDots.forEach(d => {
    d.textContent = '_';
    d.classList.remove('filled', 'wrong');
  });
  letterBtns.forEach(b => b.classList.remove('used'));
}


