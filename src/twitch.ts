import type { Chatter, LiveStream } from "./types";

export class TwitchLiveStream implements LiveStream {
  private accessToken: string | null;
  constructor(private clientId: string) {
    this.accessToken = this.getAccessToken();
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
  private async getRequest(path: string, params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    const search = query ? `?${query}` : "";
    const clientId = this.clientId;
    const response = await fetch(
      `https://api.twitch.tv/helix${path}${search}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Client-Id": clientId,
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
  async getChatters(): Promise<Chatter[]> {
    const user = await this.getUser();
    const chatters = await this.getRequest("/chat/chatters", {
      broadcaster_id: user.id,
      moderator_id: user.id,
    });
    return chatters.data.map((chatter: any) => ({
      id: chatter.user_id,
      name: chatter.user_name,
    }));
  }
  async getMessages(): Promise<Message[]> {
    const user = await this.getUser();
    const json = await this.getRequest("/shared_chat/session", {
      broadcaster_id: user.id,
    });
    console.log(json);
  }
}

// TODO get session messages https://dev.twitch.tv/docs/chat/send-receive-messages/
