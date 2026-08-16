import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteUserItinerary } from "@/lib/user-itineraries-store";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/itineraries/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    await deleteUserItinerary(session.user.id, id);
  } catch {
    return NextResponse.json(
      { error: "Failed to delete the itinerary." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
