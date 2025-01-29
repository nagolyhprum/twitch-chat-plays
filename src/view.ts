import {
  CELL_OFFSET_X,
  CELL_OFFSET_y,
  CELL_SIZE,
  COLUMNS,
  FONT_SIZE,
  HEIGHT,
  ROWS,
  TILE_SIZE,
  WIDTH,
} from "./constant";
import type { Controller } from "./controller";
import type { Player } from "./types";

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
    this.context.textBaseline = "bottom";
    this.context.textAlign = "center";
    this.controller.getPlayers().forEach((player) => {
      this.context.fillStyle = player.fill;
      this.context.fillText(
        player.name,
        player.column * CELL_SIZE + CELL_SIZE / 2,
        player.row * CELL_SIZE + CELL_SIZE
      );
    });
  }
  private drawGrid() {
    this.context.beginPath();
    Array.from({ length: COLUMNS - 1 }).forEach((_, column) => {
      this.context.moveTo((column + 1) * CELL_SIZE, 0);
      this.context.lineTo((column + 1) * CELL_SIZE, ROWS * CELL_SIZE);
    });

    Array.from({ length: ROWS - 1 }).forEach((_, row) => {
      this.context.moveTo(0, (row + 1) * CELL_SIZE);
      this.context.lineTo(COLUMNS * CELL_SIZE, (row + 1) * CELL_SIZE);
    });
    this.context.rect(0, 0, CELL_SIZE * COLUMNS, CELL_SIZE * ROWS);
    this.context.lineWidth = 1;
    this.context.strokeStyle = "rgba(0, 0, 0, .3)";
    this.context.stroke();
  }
  private drawCharacters() {
    this.controller.getPlayers().forEach((player) => {
      const column = player.character % 2;
      const row = Math.floor(player.character / 2);
      const sx = 3 * column * TILE_SIZE,
        sy = 3 * row * TILE_SIZE,
        sw = TILE_SIZE,
        sh = TILE_SIZE,
        dw = player.width,
        dh = player.height,
        dx = player.column * CELL_SIZE + CELL_SIZE / 2 - dw / 2,
        dy = player.row * CELL_SIZE + CELL_SIZE / 2 - dh / 2;
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
    this.context.textBaseline = "top";
    this.context.font = `${FONT_SIZE}px sans-serif`;
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
          player.column * CELL_SIZE + CELL_SIZE / 2,
          player.row * CELL_SIZE
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
    this.context.save();
    this.context.translate(CELL_OFFSET_X, CELL_OFFSET_y);
    this.drawGrid();
    this.drawCharacters();
    this.drawNames();
    this.drawMessages();
    this.context.restore();
    // this.drawLoader();
  }
}
