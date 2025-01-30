import { ANIMATION_LENGTH, CHARACTER_SIZE, COLUMNS, ROWS } from "./constant";
import { isDirection, type Coin, type Player, type User } from "./types";

const audio = (src: string) => {
  return new Audio(src);
};
const metalCoins = Array.from({ length: 5 }).map((_, index) =>
  audio(`metal-coin-${index + 1}.wav`)
);
const electronicCoin = audio("electronic-coin.wav");

const play = (index: number) => {
  electronicCoin.play();
  metalCoins[index]?.play();
};

const parseCommand = (input: string): string[] => {
  return input.split(/\s+/).filter((_) => _);
};

const commandMap: Record<string, string> = {
  u: "character move up",
  r: "character move right",
  d: "character move down",
  l: "character move left",
  j: "character jump",
};

export class Controller {
  private coin: Coin;
  private players: Record<string, Player>;
  private processedMessages = new Set<string>();
  constructor() {
    this.players = {};
    this.coin = this.moveCoin();
  }
  private moveCoin() {
    const coin: Coin = {
      collectedAt: 0,
      column: Math.floor(Math.random() * COLUMNS),
      row: Math.floor(Math.random() * ROWS),
    };
    this.coin = coin;
    return coin;
  }
  getCoin() {
    return this.coin;
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
      player.commands = [];
      player.coins = 0;
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
  update(now: number, users: User[]) {
    users.forEach((user) => {
      const player: Player = this.players[user.id] || {
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
        commands: [],
        coins: 0,
      };
      player.messages = user.messages;
      user.messages.forEach((message) => {
        if (
          player &&
          message.text[0] === "!" &&
          !this.processedMessages.has(message.id)
        ) {
          this.runCommand(now, message.text.slice(1), player);
          this.processedMessages.add(message.id);
        }
      });
      const diff = now - Math.max(player.lastMovedAt, player.jumpedAt);
      if (diff > ANIMATION_LENGTH && player.commands.length) {
        const command = commandMap[player.commands.shift() ?? ""];
        if (command) {
          this.runCommand(now, command, player);
        }
      }
      this.players[user.id] = player;
    });
    if (this.coin.collectedAt) {
      const diff = now - this.coin.collectedAt;
      if (diff > ANIMATION_LENGTH) {
        this.moveCoin();
      }
    }
  }
  private runCommand(now: number, command: string, player: Player) {
    console.log("command", command);
    const tokens = parseCommand(command);
    if (tokens[0] === "character") {
      this.runCharacterCommand(now, tokens.slice(1), player);
    }
  }
  private runCharacterCommand(now: number, tokens: string[], player: Player) {
    console.log("character", tokens);
    if (tokens[0] === "move") {
      this.runMoveCommand(now, tokens.slice(1), player);
    }
    if (tokens[0] === "customize") {
      this.runCusomizeCommand(tokens.slice(1), player);
    }
    if (tokens[0] === "jump") {
      player.jumpedAt = now;
      if (
        player.row === this.coin.row &&
        player.column === this.coin.column &&
        this.coin.collectedAt === 0
      ) {
        this.coin.collectedAt = now;
        player.coins++;
        play(0);
      }
    }
  }
  private runCusomizeCommand(tokens: string[], player: Player) {
    console.log("customize", tokens);
    const index = parseInt(tokens[0] ?? "");
    if (!isNaN(index)) {
      player.character = index % 4;
    }
  }
  private runMoveCommand(now: number, tokens: string[], player: Player) {
    console.log("move", tokens);
    const direction = tokens[0];
    if (isDirection(direction)) {
      const row = player.row;
      const column = player.column;
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
      if (player.row !== row || player.column !== column) {
        player.lastMovedAt = now;
      }
    } else {
      player.commands = tokens.flatMap((token) => token.split(""));
    }
  }
  getPlayers(now: number) {
    const cutoff = now - 1000 * 60 * 5;
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
