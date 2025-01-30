import { CHARACTER_SIZE, COLUMNS, ROWS } from "./constant";
import { isDirection, type Player, type Point, type User } from "./types";

const parseCommand = (input: string): string[] => {
  return input.split(/\s+/).filter((_) => _);
};

export class Controller {
  private players: Record<string, Player>;
  private processedMessages = new Set<string>();
  constructor() {
    this.players = {};
  }
  async load() {
    const response = await fetch("/users");
    const json = await response.json();
    this.players = json.data.players;
    this.processedMessages = new Set(json.data.processedMessages);
    Object.values(this.players).forEach((player) => {
      player.messages = [];
      player.jumpedAt = 0;
      player.width = CHARACTER_SIZE;
      player.height = CHARACTER_SIZE;
    });
  }
  async save() {
    const response = await fetch("/users", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        players: this.players,
        processedMessages: Array.from(this.processedMessages),
      }),
    });
    return response.json();
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
    users.forEach((user) => {
      const player = this.players[user.id] || {
        ...user,
        column: Math.floor(Math.random() * COLUMNS),
        row: Math.floor(Math.random() * ROWS),
        width: CHARACTER_SIZE,
        height: CHARACTER_SIZE,
        fill: "black",
        character: Math.floor(Math.random() * 4),
        direction: "down",
        lastMovedAt: 0,
        jumpedAt: 0,
      };
      player.messages = user.messages;
      user.messages.forEach((message) => {
        if (
          player &&
          message.text[0] === "!" &&
          !this.processedMessages.has(message.id)
        ) {
          this.runCommand(message.text.slice(1), player);
          this.processedMessages.add(message.id);
        }
      });
      this.players[user.id] = player;
    });
  }
  runCommand(command: string, player: Player) {
    console.log("command", command);
    const tokens = parseCommand(command);
    if (tokens[0] === "character") {
      this.runCharacterCommand(tokens.slice(1), player);
    }
  }
  runCharacterCommand(tokens: string[], player: Player) {
    console.log("character", tokens);
    if (tokens[0] === "move") {
      this.runMoveCommand(tokens.slice(1), player);
    }
    if (tokens[0] === "customize") {
      this.runCusomizeCommand(tokens.slice(1), player);
    }
    if (tokens[0] === "jump") {
      player.jumpedAt = Date.now();
    }
  }
  runCusomizeCommand(tokens: string[], player: Player) {
    console.log("customize", tokens);
    const index = parseInt(tokens[0] ?? "");
    if (!isNaN(index)) {
      player.character = index % 4;
    }
  }
  runMoveCommand(tokens: string[], player: Player) {
    console.log("move", tokens);
    const direction = tokens[0];
    if (isDirection(direction)) {
      switch (direction) {
        case "up": {
          player.row--;
          break;
        }
        case "right": {
          player.column++;
          break;
        }
        case "down": {
          player.row++;
          break;
        }
        case "left": {
          player.column--;
          break;
        }
      }
      player.row = Math.max(Math.min(ROWS - 1, player.row), 0);
      player.column = Math.max(Math.min(COLUMNS - 1, player.column), 0);
      player.direction = direction;
      player.lastMovedAt = Date.now();
    }
  }
  getPlayers() {
    const cutoff = Date.now() - 1000 * 60 * 5;
    return Object.values(this.players)
      .map((user) => ({
        ...user,
        messages: user.messages.filter(
          (message) => message.text[0] !== "!" && message.publishedAt > cutoff
        ),
      }))
      .sort((a, b) => a.jumpedAt - b.jumpedAt);
  }
}
