import { BOUNDARY, HEIGHT, WIDTH } from "./constant";
import type { Player, User } from "./types";

export class Controller {
  private players: Record<string, Player>;
  constructor() {
    this.players = {};
  }
  private getRandomColorComponent() {
    return Math.floor(Math.random() * 256);
  }
  private getRandomColor() {
    const r = this.getRandomColorComponent();
    const g = this.getRandomColorComponent();
    const b = this.getRandomColorComponent();
    return `rgb(${r}, ${g}, ${b})`;
  }
  update(users: User[]) {
    // init
    users.forEach((user) => {
      const player = this.players[user.id] || {
        ...user,
        x: Math.random() * (WIDTH - 2 * BOUNDARY) + BOUNDARY,
        y: Math.random() * (HEIGHT - 2 * BOUNDARY) + BOUNDARY,
        fill: this.getRandomColor(),
        character: Math.floor(Math.random() * 4),
      };
      const theta = 2 * Math.PI * Math.random();
      player.x += Math.cos(theta);
      player.y += Math.sin(theta);
      this.players[user.id] = player;
    });
  }
  getPlayers() {
    return Object.values(this.players);
  }
}
