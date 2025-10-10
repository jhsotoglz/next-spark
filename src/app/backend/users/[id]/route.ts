import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/database/mongodb";

export const runtime = "nodejs";

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("invalid id");
  return new ObjectId(id);
}

// GET /backend/users/:id
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const user = await db.collection("usernames").findOne({ _id: toObjectId(params.id) });
    if (!user) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    const status = err?.message === "invalid id" ? 400 : 500;
    return NextResponse.json({ ok: false, error: err?.message || "unknown error" }, { status });
  }
}

// PUT /backend/users/:id   Body: { username?: string }
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const body = await req.json();
    const patch: Record<string, any> = {};

    if (typeof body.username === "string") {
      if (body.username.length < 3 || body.username.length > 64) {
        return NextResponse.json(
          { ok: false, error: "username must be 3–64 chars if provided" },
          { status: 400 }
        );
      }
      patch.username = body.username;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: "nothing to update" }, { status: 400 });
    }

    // ensure unique index exists (safe to call repeatedly)
    await db.collection("usernames").createIndex({ username: 1 }, { unique: true });

    const result = await db
      .collection("usernames")
      .updateOne({ _id: toObjectId(params.id) }, { $set: { ...patch, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err?.code === 11000 ? 409 : err?.message === "invalid id" ? 400 : 500;
    const msg = err?.code === 11000 ? "username already exists" : err?.message || "unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// DELETE /backend/users/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const res = await db.collection("usernames").deleteOne({ _id: toObjectId(params.id) });
    if (res.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err?.message === "invalid id" ? 400 : 500;
    return NextResponse.json({ ok: false, error: err?.message || "unknown error" }, { status });
  }
}
