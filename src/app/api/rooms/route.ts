import { jsonError } from "@/lib/server/http";
import { createRoom } from "@/lib/server/rooms";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const result = await createRoom(body.name ?? "");
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
