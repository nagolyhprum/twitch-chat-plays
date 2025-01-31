export const TOP_WALL = 1;
export const RIGHT_WALL = 2;
export const BOTTOM_WALL = 4;
export const LEFT_WALL = 8;
export const ALL_WALLS = TOP_WALL | RIGHT_WALL | BOTTOM_WALL | LEFT_WALL;

interface MazeCell {
  walls: number;
  distance: number;
  row: number;
  column: number;
}

export class Maze {
  private data: MazeCell[][];
  constructor(private rows: number, private columns: number) {
    this.data = Array.from({ length: rows }).map((_, row) =>
      Array.from({ length: columns }).map((_, column) => ({
        walls: ALL_WALLS,
        distance: 0,
        column,
        row,
      }))
    );
  }
  generate() {
    this.data.forEach((row) => {
      row.forEach((column) => {
        column.walls = ALL_WALLS;
        column.distance = 0;
      });
    });
    this.visit(0, 0, 0);
    return this.data;
  }
  private visit(row: number, column: number, distance: number) {
    const current = this.data[row]?.[column];
    if (!current) {
      return;
    }
    const directions = [
      {
        row: row - 1,
        column: column,
        wall: TOP_WALL,
        opposite: BOTTOM_WALL,
      },
      {
        row: row,
        column: column + 1,
        wall: RIGHT_WALL,
        opposite: LEFT_WALL,
      },
      {
        row: row + 1,
        column: column,
        wall: BOTTOM_WALL,
        opposite: TOP_WALL,
      },
      {
        row: row,
        column: column - 1,
        wall: LEFT_WALL,
        opposite: RIGHT_WALL,
      },
    ];
    while (directions.length) {
      const index = Math.floor(Math.random() * directions.length);
      const direction = directions.splice(index, 1)[0];
      if (direction) {
        const destination = this.data[direction.row]?.[direction.column];
        if (destination && destination.walls === ALL_WALLS) {
          current.walls &= ~direction.wall;
          destination.walls &= ~direction.opposite;
          destination.distance = distance;
          this.visit(direction.row, direction.column, distance + 1);
        }
      }
    }
  }
  getData() {
    return this.data;
  }
}
