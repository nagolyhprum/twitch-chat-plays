export type UserSource = "twitch" | "youtube";

export interface User {
  id: string;
  name: string;
  source: UserSource;
}

export type Direction = "up" | "right" | "down" | "left";

const DIRECTIONS = ["up", "right", "down", "left"];

export const isDirection = (
  input: string | null | undefined
): input is Direction => !!input && DIRECTIONS.includes(input);

export interface Player {
  id: string;
  name: string;
  column: number;
  row: number;
  width: number;
  height: number;
  fill: string;
  character: number;
  source: UserSource;
  direction: Direction;
  lastMovedAt: number;
}

export interface LiveStream {
  getChatters(): Promise<User[]>;
  getMessages(): Promise<Message[]>;
}

export interface StreamDetails {
  broadcastId: string;
  userId: string;
  name: string;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  publishedAt: number;
}

export interface UserWithMessages extends User {
  messages: Message[];
}
