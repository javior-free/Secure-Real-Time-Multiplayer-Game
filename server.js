require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const helmet = require('helmet');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// --- Seguridad con Helmet v3 ---
app.use(helmet.noSniff());      // Test 16: evita sniffing de MIME
app.use(helmet.xssFilter());   // Test 17: previene XSS básico
app.use(helmet.noCache());     // Test 18: evita cache en cliente

// Test 19: cabecera falsa "X-Powered-By: PHP 7.4.3"
app.use((req, res, next) => {
  res.setHeader("X-Powered-By", "PHP 7.4.3");
  next();
});

// --- Static y parsing ---
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.static(process.cwd() + '/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- FCC testing ---
fccTestingRoutes(app);

// --- Routes ---
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// --- Estado del juego ---
const CANVAS = { width: 640, height: 480 };
const DEFAULTS = { speed: 3, maxSpeed: 8, hitbox: 16 };

const players = {};
const collectibles = [
  { id: 'c1', x: 300, y: 200, value: 5, hitbox: 16 }
];

function clampToBounds(x, y, hitbox = DEFAULTS.hitbox) {
  const half = hitbox / 2;
  return {
    x: Math.min(Math.max(half, x), CANVAS.width - half),
    y: Math.min(Math.max(half, y), CANVAS.height - half)
  };
}

function respawnCollectible(c) {
  const margin = c.hitbox || DEFAULTS.hitbox;
  c.x = Math.floor(Math.random() * (CANVAS.width - margin * 2)) + margin;
  c.y = Math.floor(Math.random() * (CANVAS.height - margin * 2)) + margin;
}

function overlaps(ax, ay, ah, bx, by, bh) {
  const halfA = ah / 2, halfB = bh / 2;
  const ax1 = ax - halfA, ay1 = ay - halfA;
  const ax2 = ax + halfA, ay2 = ay + halfA;
  const bx1 = bx - halfB, by1 = by - halfB;
  const bx2 = bx + halfB, by2 = by + halfB;
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

// --- Socket.io ---
io.on('connection', (socket) => {
  players[socket.id] = { id: socket.id, x: 100, y: 100, score: 0, lastUpdate: Date.now() };

  socket.emit('state', { players, collectibles, canvas: CANVAS });

  socket.on('move', (payload) => {
    const p = players[socket.id];
    if (!p) return;

    const nx = Number.isFinite(payload?.x) ? payload.x : p.x;
    const ny = Number.isFinite(payload?.y) ? payload.y : p.y;
    const ns = Number.isFinite(payload?.score) ? payload.score : p.score;

    const now = Date.now();
    const dt = Math.max(16, now - p.lastUpdate);
    const maxStep = DEFAULTS.maxSpeed * (dt / 16);

    const dx = nx - p.x, dy = ny - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxStep) {
      const scale = maxStep / (dist || 1);
      const capped = clampToBounds(p.x + dx * scale, p.y + dy * scale, DEFAULTS.hitbox);
      p.x = capped.x; p.y = capped.y;
    } else {
      const clamped = clampToBounds(nx, ny, DEFAULTS.hitbox);
      p.x = clamped.x; p.y = clamped.y;
    }

    p.score = Math.max(0, ns);
    p.lastUpdate = now;
  });

  socket.on('collect', (payload) => {
    const p = players[socket.id];
    if (!p) return;

    const col = collectibles.find(c => c.id === payload?.collectibleId);
    if (!col) return;

    if (overlaps(p.x, p.y, DEFAULTS.hitbox, col.x, col.y, col.hitbox || DEFAULTS.hitbox)) {
      p.score += Number.isFinite(col.value) ? col.value : 1;
      respawnCollectible(col);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
  });
});

// Broadcast de estado
setInterval(() => {
  io.emit('state', { players, collectibles, canvas: CANVAS });
}, 50);

const portNum = process.env.PORT || 3000;
server.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try { runner.run(); }
      catch(e) { console.error('Tests are not valid:', e); }
    }, 1500);
  }
});

module.exports = app; // For testing