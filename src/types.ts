export interface User {
  id: string;
  name: string;
}

export interface Player {
  id: string;
  name: string;
  column: number;
  row: number;
  width: number;
  height: number;
  fill: string;
  character: number;
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
  publishedAt: Date;
}

export interface UserWithMessages extends User {
  messages: Message[];
}
