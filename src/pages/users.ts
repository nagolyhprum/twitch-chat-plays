import type { APIRoute } from "astro";
import fs from "fs/promises";
import yaml from "yaml";

const FILENAME = "users.yaml";

const save = async (input: unknown) => {
  await fs.writeFile(FILENAME, yaml.stringify(input), "utf-8");
};

const EMPTY = {
  players: {},
  processedMessages: [],
};

const load = async () => {
  try {
    const text = await fs.readFile(FILENAME, "utf-8");
    return yaml.parse(text) || EMPTY;
  } catch (e) {
    return EMPTY;
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      data: await load(),
    })
  );
};

export const POST: APIRoute = async ({ request }) => {
  const json = await request.json();
  await save(json);
  return new Response(
    JSON.stringify({
      success: true,
    })
  );
};
