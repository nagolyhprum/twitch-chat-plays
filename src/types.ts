export interface User {
  id: string;
  name: string;
}

export interface Chatter {
  id: string;
  name: string;
}

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  fill: string;
  character: number;
}

export interface LiveStream {
  getUser(): Promise<User>;
  getChatters(): Promise<Chatter[]>;
}
