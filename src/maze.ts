export const TOP_WALL = 1;
export const RIGHT_WALL = 2;
export const BOTTOM_WALL = 4;
export const LEFT_WALL = 8;
export const ALL_WALLS = TOP_WALL | RIGHT_WALL | BOTTOM_WALL | LEFT_WALL;
export const TOP_DOOR_INDEX = 0;
export const RIGHT_DOOR_INDEX = 1;
export const BOTTOM_DOOR_INDEX = 2;
export const LEFT_DOOR_INDEX = 3;

interface MazeCell {
  walls: number;
  distance: number;
  row: number;
  column: number;
  doors: Array<number | undefined>;
  key: number;
  isLast: boolean;
}

export class Maze {
  private data: MazeCell[][];
  private pendingDoor: number = -1;
  private keys: number = 0;
  private visited: number = 0;
  constructor(private rows: number, private columns: number) {
    this.data = Array.from({ length: rows }).map((_, row) =>
      Array.from({ length: columns }).map((_, column) => ({
        walls: ALL_WALLS,
        distance: 0,
        column,
        row,
        doors: [],
        key: -1,
        isLast: false,
      }))
    );
  }
  generate() {
    this.visited = 0;
    this.keys = 0;
    this.pendingDoor = -1;
    this.data.forEach((row) => {
      row.forEach((column) => {
        column.walls = ALL_WALLS;
        column.distance = 0;
        column.key = -1;
        column.doors = [];
        column.isLast = false;
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
    this.visited++;
    if (this.visited === this.columns * this.rows) {
      current.isLast = true;
    }
    const directions = [
      {
        row: row - 1,
        column: column,
        from: {
          wall: TOP_WALL,
          door: TOP_DOOR_INDEX,
        },
        to: {
          wall: BOTTOM_WALL,
          door: BOTTOM_DOOR_INDEX,
        },
      },
      {
        row: row,
        column: column + 1,
        from: {
          wall: RIGHT_WALL,
          door: RIGHT_DOOR_INDEX,
        },
        to: {
          wall: LEFT_WALL,
          door: LEFT_DOOR_INDEX,
        },
      },
      {
        row: row + 1,
        column: column,
        from: {
          wall: BOTTOM_WALL,
          door: BOTTOM_DOOR_INDEX,
        },
        to: {
          wall: TOP_WALL,
          door: TOP_DOOR_INDEX,
        },
      },
      {
        row: row,
        column: column - 1,
        from: {
          wall: LEFT_WALL,
          door: LEFT_DOOR_INDEX,
        },
        to: {
          wall: RIGHT_WALL,
          door: RIGHT_DOOR_INDEX,
        },
      },
    ];
    let isDeadEnd = true;
    while (directions.length) {
      const index = Math.floor(Math.random() * directions.length);
      const direction = directions.splice(index, 1)[0];
      if (direction) {
        const destination = this.data[direction.row]?.[direction.column];
        if (destination && destination.walls === ALL_WALLS) {
          if (this.pendingDoor !== -1) {
            current.doors[direction.from.door] = this.pendingDoor;
            destination.doors[direction.to.door] = this.pendingDoor;
            this.pendingDoor = -1;
          }
          current.walls &= ~direction.from.wall;
          destination.walls &= ~direction.to.wall;
          destination.distance = distance;
          this.visit(direction.row, direction.column, distance + 1);
          isDeadEnd = false;
        }
      }
    }
    if (isDeadEnd && !current.isLast) {
      current.key = this.keys;
      this.pendingDoor = this.keys;
      this.keys++;
    }
  }
  getData() {
    return this.data;
  }
  collect(row: number, column: number) {
    const cell = this.data[row]?.[column];
    const key = cell?.key ?? -1;
    if (key !== -1) {
      cell!.key = -1;
      this.data.flat().forEach((cell) => {
        const index = cell.doors.indexOf(key);
        if (index !== -1) {
          cell.doors[index] = undefined;
        }
      });
    }
  }
}
