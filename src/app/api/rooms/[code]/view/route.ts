import { getView } from "@/lib/server/game-service";
import { HttpError, jsonError, playerAuthFrom } from "@/lib/server/http";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const auth = playerAuthFrom(request);
    if (!auth) throw new HttpError(401, "Missing session.");
    const view = await getView({
      code,
      playerId: auth.playerId,
      token: auth.token,
    });
    return Response.json(view);
  } catch (error) {
    return jsonError(error);
  }
}
