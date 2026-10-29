// Lantern Drift: the browser view (milestone 3). Draws the game from src/play.js.
import { generateLevel } from '../src/generate.js';
import {
  createGame, cycleCell, undo, reset, moveCount, gameStatus, isMovable, nextMovable, parseSettings, settingsToHash,
} from '../src/play.js';
import { LEVEL_COUNT, levelSettings } from '../src/packs.js';
import { FEATURED } from '../src/featured.js';

const boardEl = document.getElementById('board');
const beamEl = document.getElementById('beam');
const statusEl = document.getElementById('status');
const noticeEl = document.getElementById('notice');
const levelEl = document.getElementById('level');
const prevEl = document.getElementById('prev');
const nextEl = document.getElementById('next');

const EMITTER_NAMES = { '>': 'right', '<': 'left', '^': 'up', 'v': 'down' };
const STOP_TEXT = { edge: 'left the board', wall: 'hit a wall', loop: 'looped back on itself' };

let game = null;

function notice(text) {
  noticeEl.textContent = text;
}

let settings = null;

// Level 1 of the ladder is the first thing a new visitor sees.
function load() {
  settings = location.hash.length > 1 ? parseSettings(location.hash) : levelSettings(1);
  try {
    // A ladder level is built from its tier (walls and route cap), not from the bare link fields.
    game = createGame(generateLevel(settings.level ? levelSettings(settings.level) : settings).text);
  } catch (err) {
    notice(`no level for these settings (${err.message}). try another seed or size.`);
    return;
  }
  // Write the cleaned-up link back, so a bad one still shows what is being played.
  history.replaceState(null, '', settingsToHash(settings));
  notice('');
  showLevel();
  render();
}

function showLevel() {
  if (settings.level) {
    const { tier } = levelSettings(settings.level);
    levelEl.textContent = `level ${settings.level} of ${LEVEL_COUNT} · ${tier} · ${settings.width}x${settings.height}, ${settings.lanterns} lanterns`;
  } else {
    const featured = FEATURED.find((f) => f.seed === settings.seed && f.width === settings.width
      && f.height === settings.height && f.lanterns === settings.lanterns);
    const label = featured ? `featured · ${featured.name}` : 'custom level';
    levelEl.textContent = `${label} · ${settings.width}x${settings.height}, ${settings.lanterns} lanterns`;
  }
  prevEl.disabled = !settings.level || settings.level <= 1;
  nextEl.disabled = !settings.level || settings.level >= LEVEL_COUNT;
}

function goToLevel(level) {
  location.hash = settingsToHash(levelSettings(level));
}

function describe(ch, x, y, movable) {
  const where = `row ${y + 1}, column ${x + 1}`;
  let what;
  if (ch === '.') what = 'empty';
  else if (ch === '/') what = 'mirror slash';
  else if (ch === '\\') what = 'mirror backslash';
  else if (ch === 'L') what = 'lantern';
  else if (ch === '#') what = 'wall';
  else what = `emitter, beam goes ${EMITTER_NAMES[ch]}`;
  return `${where}: ${what}${movable ? ', press to change' : ''}`;
}

function cellClass(ch) {
  if (ch === '.') return 'open';
  if (ch === '/') return 'mirror slash';
  if (ch === '\\') return 'mirror back';
  if (ch === 'L') return 'lantern';
  if (ch === '#') return 'wall';
  return `emitter emitter-${EMITTER_NAMES[ch]}`;
}

function render() {
  const status = gameStatus(game);
  boardEl.style.setProperty('--w', status.width);
  boardEl.style.setProperty('--h', status.height);
  boardEl.replaceChildren();

  for (let y = 0; y < status.height; y++) {
    for (let x = 0; x < status.width; x++) {
      const ch = game.rows[y][x];
      const movable = isMovable(game, x, y);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `cell ${cellClass(ch)}`;
      if (ch === 'L' && status.lit.has(`${x},${y}`)) cell.classList.add('lit');
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.setAttribute('aria-label', describe(ch, x, y, movable));
      cell.disabled = !movable;
      boardEl.append(cell);
    }
  }

  drawBeam(status);
  showStatus(status);
  document.body.classList.toggle('solved', status.solved);
}

// One polyline through the centres of the cells the beam crosses, starting at the emitter.
function drawBeam(status) {
  beamEl.setAttribute('viewBox', `0 0 ${status.width} ${status.height}`);
  const points = [status.emitter, ...status.path]
    .map((p) => `${p.x + 0.5},${p.y + 0.5}`)
    .join(' ');
  beamEl.innerHTML = `<polyline class="beam-line" points="${points}" />`;
}

function showStatus(status) {
  const moves = moveCount(game);
  const moveText = `${moves} move${moves === 1 ? '' : 's'}`;
  if (status.solved) {
    statusEl.textContent = `solved in ${moveText}. all ${status.total} lanterns are lit.`;
  } else {
    statusEl.textContent =
      `lanterns lit: ${status.litCount} of ${status.total} · ${moveText} · the beam ${STOP_TEXT[status.stop]}`;
  }
}

function focusCell(x, y) {
  boardEl.querySelector(`[data-x="${x}"][data-y="${y}"]`)?.focus();
}

boardEl.addEventListener('click', (event) => {
  const cell = event.target.closest('.cell');
  if (!cell || cell.disabled) return;
  const x = Number(cell.dataset.x);
  const y = Number(cell.dataset.y);
  game = cycleCell(game, x, y);
  render();
  focusCell(x, y);
});

// Arrow keys move between the cells you can change (enter or space turns a cell, as on any button).
const ARROW_STEPS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

boardEl.addEventListener('keydown', (event) => {
  const step = ARROW_STEPS[event.key];
  const cell = event.target.closest('.cell');
  if (!step || !cell) return;
  event.preventDefault();
  const target = nextMovable(game, Number(cell.dataset.x), Number(cell.dataset.y), ...step);
  if (target) focusCell(target.x, target.y);
});

document.getElementById('undo').addEventListener('click', () => {
  game = undo(game);
  render();
});

document.getElementById('reset').addEventListener('click', () => {
  game = reset(game);
  render();
});

prevEl.addEventListener('click', () => goToLevel(settings.level - 1));
nextEl.addEventListener('click', () => goToLevel(settings.level + 1));

document.getElementById('new').addEventListener('click', () => {
  const seed = 1 + Math.floor(Math.random() * 999999);
  location.hash = settingsToHash({ seed, width: settings.width, height: settings.height, lanterns: settings.lanterns });
});

document.getElementById('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    notice('link copied. it opens this level from the start, not your mirrors.');
  } catch {
    notice('could not copy here. select the address bar and copy the link from there.');
  }
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    game = undo(game);
    render();
  }
});

// Featured boards (milestone 7): links to the hand-checked boards in src/featured.js.
// The route count in each note is the one countRoutes found (test/solve.test.js checks it).
const featuredEl = document.getElementById('featured');
for (const f of FEATURED) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = settingsToHash(f);
  link.textContent = f.name;
  const detail = document.createElement('span');
  detail.textContent = ` · ${f.width}x${f.height}, ${f.lanterns} lanterns · ${f.note}`;
  item.append(link, detail);
  featuredEl.append(item);
}

window.addEventListener('hashchange', load);
load();
