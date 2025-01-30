import type { LiveStream, StreamDetails, User } from "./types";

export class YouTubeLiveStream implements LiveStream {
  private accessToken: string | null;
  private users: Record<string, User> = {};
  private lastUpdatedAt = Date.now();
  constructor(private clientId: string) {
    this.accessToken = this.getAccessToken();
  }
  private getAccessToken() {
    const search = new URLSearchParams(location.search.slice(1));
    const hash = new URLSearchParams(location.hash.slice(1));
    if (search.get("service") === "youtube") {
      const accesToken = hash.get("access_token");
      if (accesToken) {
        localStorage.setItem("youtube", accesToken);
      }
    }
    return localStorage.getItem("youtube");
  }
  private async getRequest(path: string, params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    const search = query ? `?${query}` : "";
    const response = await fetch(
      `https://www.googleapis.com/${path}${search}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );
    return response.json();
  }
  private async getLiveBroadcast(): Promise<StreamDetails> {
    const json = await this.getRequest("youtube/v3/liveBroadcasts", {
      broadcastStatus: "active",
    });
    const snippet = json.items[0]?.snippet;
    return {
      userId: snippet.channelId,
      broadcastId: snippet.liveChatId,
      name: snippet.title,
    };
  }
  private async getLiveChat(liveChatId: string) {
    const json = await this.getRequest("youtube/v3/liveChat/messages", {
      liveChatId: liveChatId,
      part: ["authorDetails", "snippet"].join(","),
    });
    json.items?.forEach((item: any): User => {
      const id = item.authorDetails.channelId;
      const user: User = this.users[id] || {
        id,
        name: item.authorDetails.displayName,
        source: "youtube",
        messages: [],
      };
      const message = user.messages.find((message) => message.id === item.id);
      if (!message) {
        user.messages.push({
          id: item.id,
          userId: id,
          text: item.snippet.textMessageDetails.messageText,
          publishedAt: new Date(item.snippet.publishedAt).getTime(),
        });
      }
      this.users[id] = user;
      return user;
    });
  }
  async getChatters() {
    const now = Date.now();
    if (now - this.lastUpdatedAt >= 10_000) {
      const stream = await this.getLiveBroadcast();
      await this.getLiveChat(stream.broadcastId);
      this.lastUpdatedAt = now;
    }
    return Object.values(this.users);
  }
}
