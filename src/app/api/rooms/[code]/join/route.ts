import { jsonError } from "@/lib/server/http";
import { joinRoom } from "@/lib/server/rooms";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as { name?: string };
    const result = await joinRoom(code, body.name ?? "");
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
