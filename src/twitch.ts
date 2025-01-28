import type { Chatter, LiveStream } from "./types";

export class TwitchLiveStream implements LiveStream {
  private accessToken: string | null;
  constructor(private clientId: string) {
    this.accessToken = this.getAccessToken();
  }
  private getAccessToken() {
    const accesToken = new URLSearchParams(location.hash.slice(1)).get(
      "access_token"
    );
    if (accesToken) {
      localStorage.setItem("twitch", accesToken);
    }
    return localStorage.getItem("twitch");
  }
  private async getTwitchRequest(url: string, params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    const search = query ? `?${query}` : "";
    const clientId = this.clientId;
    const response = await fetch(`https://api.twitch.tv/helix${url}${search}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Client-Id": clientId,
      },
    });
    return response.json();
  }
  async getUser() {
    const users = await this.getTwitchRequest("/users");
    const user = users.data[0];
    return {
      id: user.id,
      name: user.display_name,
    };
  }
  async getChatters(): Promise<Chatter[]> {
    const user = await this.getUser();
    const chatters = await this.getTwitchRequest("/chat/chatters", {
      broadcaster_id: user.id,
      moderator_id: user.id,
    });
    return chatters.data.map((chatter: any) => ({
      id: chatter.user_id,
      name: chatter.user_name,
    }));
  }
}
