export interface User {
  id: string;
  name: string;
}

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  character: number;
}

export interface LiveStream {
  getChatters(): Promise<User[]>;
  getMessages(): Promise<Message[]>;
}

export interface Details {
  id: string;
  name: string;
}

export interface Message {
  text: string;
  userId: string;
  publishedAt: Date;
}

export interface UserWithMessages extends User {
  messages: Message[];
}
