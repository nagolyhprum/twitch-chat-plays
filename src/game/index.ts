import { Controller } from "../controller";
import { TwitchLiveStream } from "../twitch";
import { View } from "../view";

const canvas = document.querySelector("canvas")!;

const twitch = new TwitchLiveStream(canvas.dataset.clientId);
const controller = new Controller();
const view = new View(canvas, controller);
const users = await twitch.getChatters();

export const main = async () => {
  requestAnimationFrame(main);
  controller.update(users);
  view.draw();
};

main();
