import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createInviteLink, isCollaborationConfigured } from "@/lib/collaborators-store";
import { CollaboratorRole } from "@/lib/user-itineraries-store";
import { checkRateLimit } from "@/lib/rate-limit";

const VALID_ROLES: CollaboratorRole[] = ["editor", "viewer"];

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/itineraries/[id]/invite">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isCollaborationConfigured()) {
    return NextResponse.json(
      { error: "Collaboration isn't configured on this deployment." },
      { status: 503 }
    );
  }

  const rateLimit = await checkRateLimit(request, "invite", {
    anon: { tokens: 5, window: "10 m" },
    user: { tokens: 20, window: "10 m" },
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const role = (body as Record<string, unknown> | null)?.role;
  if (typeof role !== "string" || !VALID_ROLES.includes(role as CollaboratorRole)) {
    return NextResponse.json(
      { error: `role must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  const { id } = await ctx.params;
  try {
    const token = await createInviteLink(id, session.user.id, role as CollaboratorRole);
    if (!token) {
      return NextResponse.json(
        { error: "Only this trip's owner can create invite links." },
        { status: 403 }
      );
    }
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: "Failed to create the invite link." },
      { status: 500 }
    );
  }
}
