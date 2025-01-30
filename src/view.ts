import {
  ANIMATION_LENGTH,
  CELL_OFFSET_X,
  CELL_OFFSET_y,
  CELL_SIZE,
  COLUMNS,
  FONT_SIZE,
  HEIGHT,
  ROWS,
  TILE_SIZE,
  WALK_SPEED,
  WIDTH,
} from "./constant";
import type { Controller } from "./controller";
import type { Direction, Player } from "./types";

const tiles = new Image();
tiles.src = "/public/tiles.png";

const sky = new Image();
sky.src = "/public/sky.png";

const characters = new Image();
characters.src = "/public/characters.png";

const youtubeIcon = new Image();
youtubeIcon.src = "/public/youtube.svg";
const twitchIcon = new Image();
twitchIcon.src = "/public/twitch.svg";

const coinIcon = new Image();
coinIcon.src = "/public/coin.png";

const sourceMap = {
  youtube: youtubeIcon,
  twitch: twitchIcon,
} as const;

const directionMap: Record<Direction, number> = {
  up: 2,
  right: 1,
  down: 0,
  left: -1,
};

const animationMap = [0, 1, 0, 2];

export class View {
  private context: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement, private controller: Controller) {
    const context = canvas.getContext("2d")!;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    context.imageSmoothingEnabled = false;
    this.context = context;
  }
  private drawCoin() {
    const hover = Math.sin((2 * Math.PI * Date.now()) / 2500);
    const column = 1;
    const row = 2;
    const index = Math.floor(Date.now() / 150) % 8;
    const sw = coinIcon.width / 8,
      sh = coinIcon.height,
      sx = index * sw,
      sy = 0,
      dx = CELL_SIZE / 4 + column * CELL_SIZE,
      dy = -CELL_SIZE / 2 + row * CELL_SIZE + hover * 10,
      dw = CELL_SIZE / 2,
      dh = CELL_SIZE / 2;
    this.context.beginPath();
    this.context.ellipse(
      CELL_SIZE / 2 + column * CELL_SIZE,
      (3 * CELL_SIZE) / 4 + row * CELL_SIZE,
      CELL_SIZE / 4 + hover,
      CELL_SIZE / 8 + hover,
      0,
      0,
      2 * Math.PI
    );
    this.context.fillStyle = "rgba(0, 0, 0, .3)";
    this.context.fill();
    this.context.drawImage(coinIcon, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  private drawNames() {
    this.context.font = `${FONT_SIZE}px sans-sarif`;
    this.context.textBaseline = "bottom";
    this.context.textAlign = "center";
    this.controller.getPlayers().forEach((player) => {
      const offset = this.getOffset(player);
      this.context.fillStyle = player.fill;
      this.context.fillText(
        player.name,
        player.column * CELL_SIZE + CELL_SIZE / 2 + offset.x,
        player.row * CELL_SIZE + CELL_SIZE + offset.y
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
    this.context.lineWidth = 1;
    this.context.strokeStyle = "rgba(0, 0, 0, .3)";
    this.context.stroke();
  }
  private getAnimtionIndex(player: Player) {
    const offset = Date.now() - (player.lastMovedAt || 0);
    if (offset > ANIMATION_LENGTH) {
      return 0;
    }
    return (
      animationMap[Math.floor(offset / WALK_SPEED) % animationMap.length] ?? 0
    );
  }
  private getOffset(player: Player) {
    const offset = Date.now() - (player.lastMovedAt || 0);
    if (offset > ANIMATION_LENGTH) {
      return {
        x: 0,
        y: 0,
      };
    }
    const percent = (ANIMATION_LENGTH - offset) / ANIMATION_LENGTH;
    const up = player.direction === "up" ? CELL_SIZE : 0;
    const right = player.direction === "right" ? -CELL_SIZE : 0;
    const down = player.direction === "down" ? -CELL_SIZE : 0;
    const left = player.direction === "left" ? CELL_SIZE : 0;
    return {
      x: (left + right) * percent,
      y: (up + down) * percent,
    };
  }
  private drawCharacters() {
    this.controller.getPlayers().forEach((player) => {
      const column = player.character % 2;
      const row = Math.floor(player.character / 2);
      const directionOffset =
        directionMap[player.direction || "down"] || directionMap.down;
      const animationIndex = this.getAnimtionIndex(player);
      const offset = this.getOffset(player);
      const sx = 3 * column * TILE_SIZE + Math.abs(directionOffset * TILE_SIZE),
        sy = 3 * row * TILE_SIZE + TILE_SIZE * animationIndex,
        sw = TILE_SIZE,
        sh = TILE_SIZE,
        dw = player.width,
        dh = player.height,
        dx = player.column * CELL_SIZE + CELL_SIZE / 2 - dw / 2 + offset.x,
        dy = player.row * CELL_SIZE + CELL_SIZE / 2 - dh / 2 + offset.y;

      if (directionOffset < 0) {
        this.context.save();
        this.context.translate(dx + dw / 2, dy + dh / 2);
        this.context.scale(-1, 1);
        this.context.translate(-(dx + dw / 2), -(dy + dh / 2));
      }

      this.context.beginPath();
      this.context.ellipse(
        dx + dw / 2,
        dy + dh - 5,
        CELL_SIZE / 4,
        CELL_SIZE / 8,
        0,
        0,
        2 * Math.PI
      );
      this.context.fillStyle = "rgba(0, 0, 0, .3)";
      this.context.fill();

      this.context.drawImage(characters, sx, sy, sw, sh, dx, dy, dw, dh);

      if (directionOffset < 0) {
        this.context.restore();
      }

      const iconSize = FONT_SIZE;
      const sourceIcon = sourceMap[player.source];
      this.context.drawImage(sourceIcon, dx + dw - 5, dy, iconSize, iconSize);
    });
  }
  private clear() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  }
  private drawMessages() {
    this.context.fillStyle = "black";
    this.context.textAlign = "center";
    this.context.textBaseline = "top";
    this.context.font = `${FONT_SIZE}px sans-serif`;
    this.controller.getPlayers().forEach((player) => {
      player.messages.forEach((message) => {
        const offset = this.getOffset(player);
        this.context.fillText(
          message.text,
          player.column * CELL_SIZE + CELL_SIZE / 2 + offset.x,
          player.row * CELL_SIZE + offset.y
        );
      });
    });
  }
  private drawSky() {
    const pattern = this.context.createPattern(sky, "repeat")!;
    const width = sky.width;
    const height = sky.height;
    const now = Date.now();
    const timing = 15_000;
    const xPercent = (Math.sin((2 * Math.PI * now) / timing) + 1) / 2;
    const yPercent = (Math.cos((2 * Math.PI * now) / timing) + 1) / 2;
    const x = (width - WIDTH) * xPercent;
    const y = (height - HEIGHT) * yPercent;

    this.context.save();
    this.context.globalAlpha = 0.7;
    this.context.translate(-x, -y);
    this.context.fillStyle = pattern;
    this.context.fillRect(0, 0, width, height);
    this.context.restore();
  }
  private drawLoader() {
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
  private drawIsland() {
    for (let column = 1; column < COLUMNS - 1; column++) {
      for (let row = 1; row < ROWS - 1; row++) {
        this.drawTile(0, 0, column, row);
      }
      this.drawTile(1, 2, column, ROWS - 1);
      this.drawTile(3, 2, column, 0);
    }
    for (let row = 1; row < ROWS - 1; row++) {
      this.drawTile(0, 2, COLUMNS - 1, row);
      this.drawTile(2, 2, 0, row);
    }
    this.drawTile(3, 4, 0, ROWS - 1);
    this.drawTile(4, 4, 0, 0);
    this.drawTile(5, 4, COLUMNS - 1, 0);
    this.drawTile(2, 4, COLUMNS - 1, ROWS - 1);
  }
  private drawTile(sc: number, sr: number, dc: number, dr: number) {
    const sw = 256 / 16,
      sh = 256 / 16,
      sx = sc * sw,
      sy = sr * sh,
      dx = CELL_SIZE * dc,
      dy = CELL_SIZE * dr,
      dw = CELL_SIZE,
      dh = CELL_SIZE;
    this.context.drawImage(tiles, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  draw() {
    this.clear();
    this.drawSky();
    this.context.save();
    this.context.translate(CELL_OFFSET_X, CELL_OFFSET_y);
    this.drawIsland();
    this.drawGrid();
    this.drawCharacters();
    this.drawNames();
    this.drawMessages();
    this.drawCoin();
    this.context.restore();
    // this.drawLoader();
  }
}
