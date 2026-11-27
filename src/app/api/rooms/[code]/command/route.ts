import { runCommand, type Command } from "@/lib/server/game-service";
import { HttpError, jsonError, playerAuthFrom } from "@/lib/server/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const auth = playerAuthFrom(request);
    if (!auth) throw new HttpError(401, "Missing session.");
    const command = (await request.json()) as Command;
    if (!command || typeof command.type !== "string") {
      throw new HttpError(400, "Missing command.");
    }
    const view = await runCommand({
      code,
      playerId: auth.playerId,
      token: auth.token,
      command,
    });
    return Response.json(view);
  } catch (error) {
    return jsonError(error);
  }
}
