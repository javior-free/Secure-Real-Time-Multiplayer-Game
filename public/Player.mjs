class Player {
  constructor({ x = 0, y = 0, score = 0, id = null, name = '' } = {}) {
    // Core state
    this.id = id;
    this.name = name;

    // Position
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;

    // Score
    this.score = Number.isFinite(score) ? score : 0;

    // Hitbox for collision
    this.hitbox = 16;
  }

  /**
   * Move player in a cardinal direction.
   * dir: 'up' | 'down' | 'left' | 'right'
   * num: number of pixels to move
   * Returns current position.
   */
  movePlayer(dir, num) {
    switch (dir) {
      case 'up':
        this.y -= num;
        break;
      case 'down':
        this.y += num;
        break;
      case 'left':
        this.x -= num;
        break;
      case 'right':
        this.x += num;
        break;
      default:
        break;
    }
    return { x: this.x, y: this.y };
  }

  /**
   * Check collision with a collectible item using AABB overlap.
   * item: { x, y, id, value, hitbox? }
   * Returns true if overlapping; false otherwise.
   */
  collision(item) {
    if (!item || !Number.isFinite(item.x) || !Number.isFinite(item.y)) return false;

    const itemHit = Number.isFinite(item.hitbox) ? item.hitbox : 16;

    const halfP = this.hitbox / 2;
    const halfI = itemHit / 2;

    const px1 = this.x - halfP;
    const py1 = this.y - halfP;
    const px2 = this.x + halfP;
    const py2 = this.y + halfP;

    const ix1 = item.x - halfI;
    const iy1 = item.y - halfI;
    const ix2 = item.x + halfI;
    const iy2 = item.y + halfI;

    const overlap =
      px1 < ix2 &&
      px2 > ix1 &&
      py1 < iy2 &&
      py2 > iy1;

    return Boolean(overlap);
  }

  /**
   * Calculate ranking given an array of players.
   * Returns string "Rank: current/total"
   */
  calculateRank(players = []) {
    if (!Array.isArray(players)) return 'Rank: 0/0';

    const sorted = [...players].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex(p => p.id === this.id) + 1;
    return `Rank: ${rank}/${players.length}`;
  }
}

export default Player;