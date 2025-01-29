import { HEIGHT, WIDTH } from "./constant";
import type { Controller } from "./controller";
import type { Player } from "./types";

const FONT_SIZE = 24;
const PLAYER_SCALE = 5;

const characters = new Image();
characters.src = "/public/RPG_assets.png";

export class View {
  private context: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement, private controller: Controller) {
    const context = canvas.getContext("2d")!;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    context.imageSmoothingEnabled = false;
    this.context = context;
  }
  private drawNames() {
    this.context.font = `${FONT_SIZE}px sans-sarif`;
    this.context.textBaseline = "top";
    this.context.textAlign = "center";
    this.controller.getPlayers().forEach((player) => {
      this.context.fillStyle = player.fill;
      this.context.fillText(player.name, player.x, player.y);
    });
  }
  private drawCharacters() {
    this.controller
      .getPlayers()
      .sort((a, b) => a.y - b.y)
      .forEach((player) => {
        const column = player.character % 2;
        const row = Math.floor(player.character / 2);
        const width = player.width;
        const height = player.height;
        const sx = 3 * column * width,
          sy = 3 * row * height,
          sw = width,
          sh = height,
          dw = width * PLAYER_SCALE,
          dh = height * PLAYER_SCALE,
          dx = player.x - dw / 2,
          dy = player.y - dh;
        this.context.drawImage(characters, sx, sy, sw, sh, dx, dy, dw, dh);
      });
  }
  private clear() {
    this.context.fillStyle = "red";
    this.context.fillRect(0, 0, WIDTH, HEIGHT);
  }
  private drawMessages() {
    this.context.fillStyle = "black";
    this.context.textAlign = "center";
    this.context.textBaseline = "bottom";
    const fontSize = FONT_SIZE / 2;
    this.context.font = `${fontSize}px sans-serif`;
    const playersById = this.controller
      .getPlayers()
      .reduce((playersById, player) => {
        playersById[player.id] = player;
        return playersById;
      }, {} as Record<string, Player>);
    this.controller.getMessages().forEach((message) => {
      const player = playersById[message.userId];
      if (player) {
        this.context.fillText(
          message.text,
          player.x + player.width / 2,
          player.y - player.height * PLAYER_SCALE,
          WIDTH
        );
      }
    });
  }
  drawLoader() {
    const theta = ((2 * Math.PI * Date.now()) / 1000) % (2 * Math.PI);
    this.context.strokeStyle = "black";
    this.context.beginPath();
    const radius = 25;
    const padding = 25;
    this.context.lineWidth = radius / 2;
    this.context.ellipse(
      WIDTH - radius - padding,
      HEIGHT - radius - padding,
      radius,
      radius,
      theta,
      0,
      Math.PI
    );
    this.context.stroke();
  }
  draw() {
    this.clear();
    this.drawCharacters();
    this.drawNames();
    this.drawMessages();
    this.drawLoader();
  }
}
