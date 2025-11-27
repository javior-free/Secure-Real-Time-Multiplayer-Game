// Collectible.mjs

class Collectible {
  constructor({ x = 0, y = 0, value = 1, id = null } = {}) {
    this.id = id;
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    this.value = Number.isFinite(value) ? value : 1;
    this.hitbox = 16; // tamaño para colisión
    this.bounds = { width: 640, height: 480 }; // puede ser sobrescrito
  }

  /**
   * Reubica el ítem en una posición aleatoria dentro del canvas.
   * Útil cuando se recolecta y se quiere regenerar.
   */
  respawn() {
    const margin = this.hitbox;
    this.x = Math.floor(Math.random() * (this.bounds.width - margin * 2)) + margin;
    this.y = Math.floor(Math.random() * (this.bounds.height - margin * 2)) + margin;
  }

  /**
   * Verifica si un jugador colisiona con este ítem.
   * player: instancia de Player con x, y, hitbox
   * Retorna true si hay colisión.
   */
  isCollectedBy(player) {
    if (!player || !Number.isFinite(player.x) || !Number.isFinite(player.y)) return false;

    const halfP = player.hitbox / 2;
    const halfC = this.hitbox / 2;

    const px1 = player.x - halfP;
    const py1 = player.y - halfP;
    const px2 = player.x + halfP;
    const py2 = player.y + halfP;

    const cx1 = this.x - halfC;
    const cy1 = this.y - halfC;
    const cx2 = this.x + halfC;
    const cy2 = this.y + halfC;

    const overlap =
      px1 < cx2 &&
      px2 > cx1 &&
      py1 < cy2 &&
      py2 > cy1;

    return Boolean(overlap);
  }
}

/*
 * Note: Attempt to export this for use
 * in server.js
 */
try {
  module.exports = Collectible;
} catch (e) {}

export default Collectible;