import type { Chatter, Details, LiveStream, User } from "./types";

("https://www.googleapis.com/youtube/v3/liveBroadcasts");

export class YouTubeLiveStream implements LiveStream {
  private accessToken: string | null;
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
  private async getLiveBroadcast(): Promise<Details> {
    const json = await this.getRequest("youtube/v3/liveBroadcasts", {
      broadcastStatus: "active",
    });
    const snippet = json.items[0].snippet;
    return {
      id: snippet.liveChatId,
      name: snippet.title,
    };
  }
  private async getLiveChat(liveChatId: string) {
    const json = await this.getRequest("youtube/v3/liveChat/messages", {
      liveChatId: liveChatId,
      part: ["authorDetails", "snippet"].join(","),
    });
    const ids = new Set<string>();
    return json.items
      .map(
        (item: any): User => ({
          id: item.authorDetails.channelId,
          name: item.authorDetails.displayName,
        })
      )
      .filter((user: User) => {
        const has = ids.has(user.id);
        ids.add(user.id);
        return !has;
      });
  }

  async getChatters(): Promise<Chatter[]> {
    const stream = await this.getLiveBroadcast();
    return this.getLiveChat(stream.id);
    return [];
  }
}
