import { CHARACTER_SIZE, COLUMNS, ROWS } from "./constant";
import type { Message, Player, User } from "./types";
import yaml from "yaml";
import fs from "fs/promises";

const save = (input: unknown) => {};

const load = () => {};

const parseCommand = (input: string): string[] => {
  return input.split(/\s+/).filter((_) => _);
};

export class Controller {
  private players: Record<string, Player>;
  private messages: Message[];
  private processedMessages = new Set<string>();
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
    users.forEach((user) => {
      const player = this.players[user.id] || {
        ...user,
        column: Math.floor(Math.random() * COLUMNS),
        row: Math.floor(Math.random() * ROWS),
        width: CHARACTER_SIZE,
        height: CHARACTER_SIZE,
        fill: "black",
        character: Math.floor(Math.random() * 4),
      };
      this.players[user.id] = player;
    });
    messages.forEach((message) => {
      const player = this.players[message.userId];
      if (
        player &&
        message.text[0] === "!" &&
        !this.processedMessages.has(message.id)
      ) {
        this.runCommand(message.text.slice(1), player);
        this.processedMessages.add(message.id);
      }
    });
    this.messages = messages;
  }
  runCommand(command: string, player: Player) {
    const tokens = parseCommand(command);
    if (tokens[0] === "character") {
      this.runCharacterCommand(tokens.slice(1), player);
    }
  }
  runCharacterCommand(tokens: string[], player: Player) {
    if (tokens[0] === "move") {
      this.runMoveCommand(tokens.slice(1), player);
    }
  }
  runMoveCommand(tokens: string[], player: Player) {
    const direction = tokens[0];
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
  }
  getMessages() {
    const ids = new Set<string>();
    return this.messages
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .filter((message) => {
        return message.text[0] !== "!";
      })
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
