import { GameApp } from "@/components/game/GameApp";
import { Suspense } from "react";

async function RoomGame({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <GameApp code={code} />;
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <main className="tavern flex-1">
      <Suspense
        fallback={
          <p className="px-4 py-10 text-muted">Opening the room…</p>
        }
      >
        <RoomGame params={params} />
      </Suspense>
    </main>
  );
}
