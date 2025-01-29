import type {
  LiveStream,
  Message,
  StreamDetails,
  User,
  UserWithMessages,
} from "./types";

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
  private async getLiveChat(liveChatId: string): Promise<UserWithMessages[]> {
    const json = await this.getRequest("youtube/v3/liveChat/messages", {
      liveChatId: liveChatId,
      part: ["authorDetails", "snippet"].join(","),
    });
    const ids = new Set<string>();
    const usersById: Record<string, UserWithMessages> = {};
    return json.items
      .map((item: any): UserWithMessages => {
        const id = item.authorDetails.channelId;
        const user: UserWithMessages = usersById[id] || {
          id,
          name: item.authorDetails.displayName,
          source: "youtube",
          messages: [],
        };
        user.messages.push({
          id: item.id,
          userId: id,
          text: item.snippet.textMessageDetails.messageText,
          publishedAt: new Date(item.snippet.publishedAt),
        });
        usersById[id] = user;
        return user;
      })
      .filter((user: User) => {
        const has = ids.has(user.id);
        ids.add(user.id);
        return !has;
      });
  }
  async getChatters(): Promise<User[]> {
    const stream = await this.getLiveBroadcast();
    const users = await this.getLiveChat(stream.broadcastId);
    return users;
  }
  async getMessages(): Promise<Message[]> {
    const stream = await this.getLiveBroadcast();
    const users = await this.getLiveChat(stream.broadcastId);
    return users.flatMap((user) => user.messages);
  }
}
