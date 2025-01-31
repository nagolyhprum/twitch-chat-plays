import { ANIMATION_LENGTH, CHARACTER_SIZE, COLUMNS, ROWS } from "./constant";
import {
  ALL_WALLS,
  BOTTOM_DOOR_INDEX,
  BOTTOM_WALL,
  LEFT_DOOR_INDEX,
  LEFT_WALL,
  Maze,
  RIGHT_DOOR_INDEX,
  RIGHT_WALL,
  TOP_DOOR_INDEX,
  TOP_WALL,
} from "./maze";
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
  private maze: Maze;
  private coin: Coin;
  private players: Record<string, Player>;
  private processedMessages = new Set<string>();
  constructor() {
    this.players = {};
    this.maze = new Maze(ROWS - 2, COLUMNS - 2);
    this.coin = this.moveCoin();
  }
  getMaze() {
    return this.maze;
  }
  private moveCoin() {
    const data = this.maze
      .generate()
      .flat()
      .find((cell) => cell.isLast);
    const coin: Coin = {
      collectedAt: 0,
      column: (data?.column ?? 0) + 1,
      row: (data?.row ?? 0) + 1,
    };
    Object.values(this.players).forEach((player) => {
      player.column = 1;
      player.row = 1;
      player.lastMovedAt = 0;
      player.jumpedAt = 0;
      player.commands = [];
      player.direction = "down";
    });
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
      player.coins = player.coins || 0;
      player.lastActiveAt = player.lastActiveAt || 0;
      player.fill = "white";
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
        fill: "white",
        character: Math.floor(Math.random() * 4),
        direction: "down",
        lastMovedAt: 0,
        jumpedAt: 0,
        commands: [],
        coins: 0,
        lastActiveAt: now,
      };
      player.messages = user.messages;
      user.messages.forEach((message) => {
        player.lastActiveAt = Math.max(
          player.lastActiveAt,
          message.publishedAt
        );
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
      const cell = this.maze.getData()[player.row - 1]?.[player.column - 1];
      const walls = cell?.walls ?? ALL_WALLS;
      const doors = cell?.doors ?? [];
      switch (direction) {
        case "up": {
          if (!(walls & TOP_WALL) && doors[TOP_DOOR_INDEX] === undefined) {
            player.row--;
          }
          break;
        }
        case "right": {
          if (!(walls & RIGHT_WALL) && doors[RIGHT_DOOR_INDEX] === undefined) {
            player.column++;
          }
          break;
        }
        case "down": {
          if (
            !(walls & BOTTOM_WALL) &&
            doors[BOTTOM_DOOR_INDEX] === undefined
          ) {
            player.row++;
          }
          break;
        }
        case "left": {
          if (!(walls & LEFT_WALL) && doors[LEFT_DOOR_INDEX] === undefined) {
            player.column--;
          }
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
      player.commands.push(...tokens.flatMap((token) => token.split("")));
    }
  }
  getPlayers(now: number) {
    const cutoff = now - 1000 * 60 * 5;
    return Object.values(this.players)
      .filter((user) => now - user.lastActiveAt < 10 * 60 * 1000)
      .map((user) => ({
        ...user,
        messages: user.messages
          .filter(
            (message) => message.text[0] !== "!" && message.publishedAt > cutoff
          )
          .sort((a, b) => b.publishedAt - a.publishedAt),
      }))
      .sort((a, b) => a.jumpedAt - b.jumpedAt);
  }
}
