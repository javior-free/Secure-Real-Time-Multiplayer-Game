// game.mjs
import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

// Instancias locales
const player = new Player({ id: socket.id, x: 100, y: 100, score: 0 });
const collectible = new Collectible({ id: 'c1', x: 300, y: 200, value: 5 });

// Estado compartido
let players = {};
let collectibles = [collectible];

// Input de teclado
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Loop principal
function gameLoop() {
  // Movimiento local
  if (keys['ArrowUp']) player.movePlayer('up');
  if (keys['ArrowDown']) player.movePlayer('down');
  if (keys['ArrowLeft']) player.movePlayer('left');
  if (keys['ArrowRight']) player.movePlayer('right');

  // Colisión con collectible
  collectibles.forEach(c => {
    if (player.collision(c)) {
      player.score += c.value;
      c.respawn();
      // Emitir evento al servidor
      socket.emit('collect', { playerId: player.id, collectibleId: c.id, score: player.score });
    }
  });

  // Emitir posición al servidor
  socket.emit('move', { id: player.id, x: player.x, y: player.y, score: player.score });

  // Render
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar jugadores
  Object.values(players).forEach(p => {
    context.fillStyle = p.id === player.id ? 'blue' : 'red';
    context.fillRect(p.x - 8, p.y - 8, 16, 16);
    context.fillStyle = 'black';
    context.fillText(p.score, p.x - 10, p.y - 12);
  });

  // Dibujar collectibles
  collectibles.forEach(c => {
    context.fillStyle = 'green';
    context.fillRect(c.x - 8, c.y - 8, 16, 16);
  });

  requestAnimationFrame(gameLoop);
}

// Socket listeners
socket.on('state', state => {
  players = state.players;
  collectibles = state.collectibles;
});

// Iniciar loop
gameLoop();