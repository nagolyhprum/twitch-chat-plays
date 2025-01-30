import type { LiveStream, User } from "./types";

const STREAM_ELEMENTS_ID = "100135110";

export class TwitchLiveStream implements LiveStream {
  private users: Record<string, User> = {};
  private accessToken: string | null;
  constructor(private clientId: string) {
    this.accessToken = this.getAccessToken();
    const websocket = new WebSocket("wss://eventsub.wss.twitch.tv/ws");
    let sessionId = "";
    websocket.onmessage = async (message) => {
      const user = await this.getUser();
      const data = JSON.parse(message.data);
      if (data.metadata.message_type === "session_welcome") {
        sessionId = data.payload.session.id;
        this.getRequest(
          "/eventsub/subscriptions",
          {},
          {
            method: "POST",
            body: JSON.stringify({
              type: "channel.chat.message",
              version: "1",
              condition: {
                user_id: user.id,
                broadcaster_user_id: user.id,
              },
              transport: {
                method: "websocket",
                session_id: sessionId,
              },
            }),
          }
        );
      } else if (data.metadata.message_type === "notification") {
        const name = data.payload.event.chatter_user_name;
        const text = data.payload.event.message.text;
        const userId = data.payload.event.chatter_user_id;
        const message_timestamp = data.metadata.message_timestamp;
        const id = data.metadata.message_id;
        const user: User = this.users[userId] || {
          id: userId,
          name,
          messages: [],
          source: "twitch",
        };
        user.messages.push({
          id,
          text,
          userId,
          publishedAt: new Date(message_timestamp).getTime(),
        });
        this.users[userId] = user;
      }
    };
  }
  private getAccessToken() {
    const hash = new URLSearchParams(location.hash.slice(1));
    const search = new URLSearchParams(location.search.slice(1));
    if (search.get("service") === "twitch") {
      const accesToken = hash.get("access_token");
      if (accesToken) {
        localStorage.setItem("twitch", accesToken);
      }
    }
    return localStorage.getItem("twitch");
  }
  private async getRequest(
    path: string,
    params?: Record<string, string>,
    init?: RequestInit
  ) {
    const query = new URLSearchParams(params).toString();
    const search = query ? `?${query}` : "";
    const clientId = this.clientId;
    const response = await fetch(
      `https://api.twitch.tv/helix${path}${search}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Client-Id": clientId,
          "Content-Type": "application/json",
          ...init?.headers,
        },
      }
    );
    return response.json();
  }
  private async getUser() {
    const users = await this.getRequest("/users");
    const user = users.data[0];
    return {
      id: user.id,
      name: user.display_name,
    };
  }
  async getChatters(): Promise<User[]> {
    return Object.values(this.users).filter(
      (chatter: any) => chatter.id !== STREAM_ELEMENTS_ID
    );
  }
}
