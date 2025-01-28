import { HEIGHT, WIDTH } from "./constant";
import type { Controller } from "./controller";

const FONT_SIZE = 24;

const characters = new Image();
characters.src = "/public/RPG_assets.png";

export class View {
  private context: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement, private controller: Controller) {
    const context = canvas.getContext("2d")!;
    context.canvas.width = WIDTH * devicePixelRatio;
    canvas.height = HEIGHT * devicePixelRatio;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    context.scale(devicePixelRatio, devicePixelRatio);
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
        const scale = 5;
        const size = 96 / 6;
        const sx = 3 * column * size,
          sy = 3 * row * size,
          sw = size,
          sh = size,
          dw = size * scale,
          dh = size * scale,
          dx = player.x - dw / 2,
          dy = player.y - dh;
        this.context.drawImage(characters, sx, sy, sw, sh, dx, dy, dw, dh);
      });
  }
  private clear() {
    this.context.fillStyle = "red";
    this.context.fillRect(0, 0, WIDTH, HEIGHT);
  }
  draw() {
    this.clear();
    this.drawCharacters();
    this.drawNames();
  }
}
