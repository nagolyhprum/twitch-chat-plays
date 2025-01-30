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

const image = (src: string) => {
  const image = new Image();
  image.src = src;
  return image;
};

const pole = image("/public/pole.png");
const tiles = image("/public/tiles.png");
const sky = image("/public/sky.png");
const characters = image("/public/characters.png");
const youtubeIcon = image("/public/youtube.svg");
const twitchIcon = image("/public/twitch.svg");
const coinIcon = image("/public/coin.png");

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
  private backContext: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement, private controller: Controller) {
    const context = canvas.getContext("2d")!;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    context.imageSmoothingEnabled = false;
    this.context = context;

    const backCanvas = document.createElement("canvas");
    this.backContext = backCanvas.getContext("2d")!;
    backCanvas.width = WIDTH;
    backCanvas.height = HEIGHT;
    this.backContext.imageSmoothingEnabled = false;
  }
  private drawShadow(x: number, y: number) {
    this.context.fillStyle = "rgba(0, 0, 0, .3)";
    this.context.beginPath();
    this.context.ellipse(x, y, CELL_SIZE / 4, CELL_SIZE / 8, 0, 0, 2 * Math.PI);
    this.context.fill();
  }
  private drawCoin(now: number) {
    const { column, row, collectedAt } = this.controller.getCoin();
    const percent = collectedAt ? (now - collectedAt) / ANIMATION_LENGTH : 0;
    const hover = Math.sin((2 * Math.PI * now) / 2500);
    const index = Math.floor(now / 150) % 8;
    const sw = coinIcon.width / 8,
      sh = coinIcon.height,
      sx = index * sw,
      sy = 0,
      dx = CELL_SIZE / 4 + column * CELL_SIZE,
      dy = -CELL_SIZE / 2 + row * CELL_SIZE + hover * 10,
      dw = CELL_SIZE / 2,
      dh = CELL_SIZE / 2;
    this.backContext.globalAlpha = 1 - percent;
    this.backContext.beginPath();
    this.drawShadow(
      CELL_SIZE / 2 + column * CELL_SIZE,
      (3 * CELL_SIZE) / 4 + row * CELL_SIZE
    );
    this.backContext.drawImage(
      coinIcon,
      sx,
      sy,
      sw,
      sh,
      dx,
      dy - (percent * CELL_SIZE) / 2,
      dw,
      dh
    );
    this.backContext.globalAlpha = 1;
  }
  private drawNames(now: number) {
    this.backContext.font = `${FONT_SIZE}px sans-sarif`;
    this.backContext.textBaseline = "bottom";
    this.backContext.textAlign = "center";
    this.controller.getPlayers(now).forEach((player) => {
      const offset = this.getOffset(now, player);
      this.backContext.fillStyle = player.fill;
      this.backContext.fillText(
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
  private getAnimtionIndex(now: number, player: Player) {
    if (now - player.jumpedAt < ANIMATION_LENGTH) {
      return 1;
    }
    const offset = now - player.lastMovedAt;
    if (offset > ANIMATION_LENGTH) {
      return 0;
    }
    return (
      animationMap[Math.floor(offset / WALK_SPEED) % animationMap.length] ?? 0
    );
  }
  private getOffset(now: number, player: Player) {
    const jumpedAt = now - player.jumpedAt;
    if (jumpedAt < ANIMATION_LENGTH) {
      const percent = Math.sin(
        (Math.PI * (ANIMATION_LENGTH - jumpedAt)) / ANIMATION_LENGTH
      );
      return {
        x: 0,
        y: 0,
        elevation: percent * CELL_SIZE,
      };
    }
    const movedAt = now - player.lastMovedAt;
    if (movedAt < ANIMATION_LENGTH) {
      const percent = (ANIMATION_LENGTH - movedAt) / ANIMATION_LENGTH;
      const up = player.direction === "up" ? CELL_SIZE : 0;
      const right = player.direction === "right" ? -CELL_SIZE : 0;
      const down = player.direction === "down" ? -CELL_SIZE : 0;
      const left = player.direction === "left" ? CELL_SIZE : 0;
      return {
        x: (left + right) * percent,
        y: (up + down) * percent,
        elevation: 0,
      };
    }
    return {
      x: 0,
      y: 0,
      elevation: 0,
    };
  }
  private drawPoles() {
    for (let column = 0; column < COLUMNS - 1; column++) {
      for (let row = 0; row < ROWS - 1; row++) {
        const scale = 1.5;
        const width = pole.width * scale;
        const height = pole.height * scale;
        this.backContext.drawImage(
          pole,
          column * CELL_SIZE + CELL_SIZE - width / 2,
          row * CELL_SIZE + CELL_SIZE - height + 5 * scale,
          width,
          height
        );
      }
    }
  }
  private drawCharacters(now: number) {
    this.controller.getPlayers(now).forEach((player) => {
      const column = player.character % 2;
      const row = Math.floor(player.character / 2);
      const directionOffset =
        directionMap[player.direction || "down"] || directionMap.down;
      const animationIndex = this.getAnimtionIndex(now, player);
      const offset = this.getOffset(now, player);
      const sx = 3 * column * TILE_SIZE + Math.abs(directionOffset * TILE_SIZE),
        sy = 3 * row * TILE_SIZE + TILE_SIZE * animationIndex,
        sw = TILE_SIZE,
        sh = TILE_SIZE,
        dw = player.width,
        dh = player.height,
        dx = player.column * CELL_SIZE + CELL_SIZE / 2 - dw / 2 + offset.x,
        dy = player.row * CELL_SIZE + CELL_SIZE / 2 - dh / 2 + offset.y;
      if (directionOffset < 0) {
        this.backContext.save();
        this.backContext.translate(dx + dw / 2, dy + dh / 2);
        this.backContext.scale(-1, 1);
        this.backContext.translate(-(dx + dw / 2), -(dy + dh / 2));
      }
      this.backContext.beginPath();
      this.drawShadow(dx + dw / 2, dy + dh - 5);
      this.backContext.drawImage(
        characters,
        sx,
        sy,
        sw,
        sh,
        dx,
        dy - offset.elevation,
        dw,
        dh
      );
      if (directionOffset < 0) {
        this.backContext.restore();
      }
      const padding = 4;
      const iconSize = FONT_SIZE;
      const sourceIcon = sourceMap[player.source];
      this.backContext.drawImage(
        sourceIcon,
        dx + dw - padding,
        dy,
        iconSize,
        iconSize
      );
      this.backContext.drawImage(
        coinIcon,
        0,
        0,
        coinIcon.width / 8,
        coinIcon.height,
        dx + dw - padding,
        dy + iconSize + padding,
        iconSize,
        iconSize
      );
      this.backContext.fillStyle = "black";
      this.backContext.font = `${FONT_SIZE}px sans-serif`;
      this.backContext.textAlign = "center";
      this.backContext.textBaseline = "top";
      this.backContext.fillText(
        `${player.coins}`,
        dx + dw + iconSize / 2 - padding,
        dy + iconSize + iconSize + padding + padding / 2
      );
    });
  }
  private clear() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
    this.backContext.clearRect(0, 0, WIDTH, HEIGHT);
  }
  private drawMessages(now: number) {
    this.backContext.fillStyle = "black";
    this.backContext.textAlign = "center";
    this.backContext.textBaseline = "top";
    this.backContext.font = `${FONT_SIZE}px sans-serif`;
    this.controller.getPlayers(now).forEach((player) => {
      const message = player.messages[0];
      if (message) {
        const offset = this.getOffset(now, player);
        this.backContext.fillText(
          message.text,
          player.column * CELL_SIZE + CELL_SIZE / 2 + offset.x,
          player.row * CELL_SIZE + offset.y
        );
      }
    });
  }
  private drawSky(now: number) {
    const pattern = this.context.createPattern(sky, "repeat")!;
    const width = sky.width;
    const height = sky.height;
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
  private drawLoader(now: number) {
    const theta = ((2 * Math.PI * now) / 1000) % (2 * Math.PI);
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
  draw(now: number) {
    this.clear();
    this.drawSky(now);
    this.backContext.save();
    this.backContext.translate(CELL_OFFSET_X, CELL_OFFSET_y);
    this.context.save();
    this.context.translate(CELL_OFFSET_X, CELL_OFFSET_y);
    this.drawIsland();
    this.drawGrid();
    this.drawCharacters(now);
    this.drawPoles();
    this.drawNames(now);
    this.drawMessages(now);
    this.drawCoin(now);
    this.backContext.restore();
    this.context.restore();
    this.context.drawImage(this.backContext.canvas, 0, 0);
    // this.drawLoader(now);
  }
}
