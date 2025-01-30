export const WIDTH = 640;
export const HEIGHT = 480;
export const CHARACTERS = 4;
export const BOUNDARY = 100;
export const FONT_SIZE = 12;
export const PLAYER_SCALE = 3;
export const TILE_SIZE = 96 / 6;
export const CHARACTER_SIZE = TILE_SIZE * PLAYER_SCALE;
export const CELL_SIZE = TILE_SIZE * PLAYER_SCALE + FONT_SIZE * 2;
export const COLUMNS = Math.floor(WIDTH / CELL_SIZE);
export const ROWS = Math.floor(HEIGHT / CELL_SIZE);
export const CELL_OFFSET_X = WIDTH / 2 - (COLUMNS * CELL_SIZE) / 2;
export const CELL_OFFSET_y = HEIGHT / 2 - (ROWS * CELL_SIZE) / 2;
export const ANIMATION_LENGTH = 1000;
export const WALK_SPEED = 300;
