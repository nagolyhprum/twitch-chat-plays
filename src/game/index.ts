import { Controller } from "../controller";
import { YouTubeLiveStream } from "../youtube";
import { TwitchLiveStream } from "../twitch";
import type { Message, User } from "../types";
import { View } from "../view";

const canvas = document.querySelector("canvas")!;

const youtube = new YouTubeLiveStream(canvas.dataset.youtubeClientId);
const twitch = new TwitchLiveStream(canvas.dataset.twitchClientId);
const controller = new Controller();
const view = new View(canvas, controller);

const streams = [youtube, twitch];

let users: User[] = [];
let messages: Message[] = [];

const update = async () => {
  const tempUsers: User[] = [];
  const tempMessages: Message[] = [];
  const now = Date.now();
  await Promise.all(
    streams.map(async (stream) => {
      tempUsers.push(...(await stream.getChatters()));
      tempMessages.push(
        ...(await stream.getMessages()).filter(
          (message) => now - message.publishedAt.getTime() < 1000 * 60 * 10
        )
      );
    })
  );
  users = tempUsers;
  messages = tempMessages;
};
update();

setInterval(update, 15_000);

export const main = async () => {
  requestAnimationFrame(main);
  controller.update(users, messages);
  view.draw();
};

main();
