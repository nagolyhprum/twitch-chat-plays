import { Controller } from "../controller";
import { YouTubeLiveStream } from "../youtube";
import { TwitchLiveStream } from "../twitch";
import type { User } from "../types";
import { View } from "../view";

const canvas = document.querySelector("canvas")!;

const youtube = new YouTubeLiveStream(canvas.dataset.youtubeClientId);
const twitch = new TwitchLiveStream(canvas.dataset.twitchClientId);
const controller = new Controller();
await controller.load();
const view = new View(canvas, controller);

const streams = [
  // youtube,
  twitch,
];

let users: User[] = [];

const update = async () => {
  console.log("update");
  const now = Date.now();
  const tempUsers: User[] = [];
  try {
    await Promise.all(
      streams.map(async (stream) => {
        tempUsers.push(...(await stream.getChatters()));
      })
    );
  } catch (e) {}
  users = tempUsers;
  controller.update(now, users);
  controller.save();
};

setInterval(update, 1_000);

export const main = async () => {
  requestAnimationFrame(main);
  const now = Date.now();
  controller.update(now, users);
  view.draw(now);
};

main();
