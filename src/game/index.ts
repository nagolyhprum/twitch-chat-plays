import { Controller } from "../controller";
import { YouTubeLiveStream } from "../youtube";
import { TwitchLiveStream } from "../twitch";
import type { User } from "../types";
import { View } from "../view";

const canvas = document.querySelector("canvas")!;

const youtube = new YouTubeLiveStream(canvas.dataset.youtubeClientId);
const twitch = new TwitchLiveStream(canvas.dataset.twitchClientId);
const controller = new Controller();
const view = new View(canvas, controller);
let twitchUsers: User[] = [];
let youtubeUsers: User[] = [];

setTimeout(async () => {
  twitchUsers = await twitch.getChatters();
});

setTimeout(async () => {
  youtubeUsers = await youtube.getChatters();
});

export const main = async () => {
  requestAnimationFrame(main);
  controller.update([...twitchUsers, ...youtubeUsers]);
  view.draw();
};

main();
