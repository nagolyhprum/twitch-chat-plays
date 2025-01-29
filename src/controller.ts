import { BOUNDARY, HEIGHT, WIDTH } from "./constant";
import type { Message, Player, User } from "./types";

export class Controller {
  private players: Record<string, Player>;
  private messages: Message[];
  constructor() {
    this.players = {};
    this.messages = [];
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
  update(users: User[], messages: Message[]) {
    // init
    users.forEach((user) => {
      const player = this.players[user.id] || {
        ...user,
        x: Math.random() * (WIDTH - 2 * BOUNDARY) + BOUNDARY,
        y: Math.random() * (HEIGHT - 2 * BOUNDARY) + BOUNDARY,
        width: 96 / 6,
        height: 96 / 6,
        fill: "black",
        character: Math.floor(Math.random() * 4),
      };
      const theta = 2 * Math.PI * Math.random();
      player.x += Math.cos(theta);
      player.y += Math.sin(theta);
      this.players[user.id] = player;
    });
    this.messages = messages;
  }
  getMessages() {
    const ids = new Set<string>();
    return this.messages
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .filter((message) => {
        const has = ids.has(message.userId);
        ids.add(message.userId);
        return !has;
      });
  }
  getPlayers() {
    return Object.values(this.players);
  }
}
