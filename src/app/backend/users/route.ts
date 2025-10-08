import { NextResponse } from "next/server";
import { getDb } from "@/database/mongodb";

export const runtime = "nodejs";

type UsernameDoc = {
  _id?: string;
  username: string;
  createdAt: Date;
};

const COLLECTION = "usernames";

// POST /backend/users
export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    const username = body?.username;

    // Size validation
    if (typeof username !== "string" || username.length === 3 || username.length > 64) {
      return NextResponse.json(
        { ok: false, error: "username must be a non-empty string up to 64 chars" },
        { status: 400 }
      );
    }

    // Not duplicate username validation
    await db.collection(COLLECTION).createIndex({ username: 1 }, { unique: true });

    const res = await db.collection<UsernameDoc>(COLLECTION).insertOne({
      username,               // store as-is
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, id: res.insertedId, username }, { status: 201 });
  } catch (err: any) {
    if (err?.code === 11000) {
      // exact duplicate prompt
      return NextResponse.json({ ok: false, error: "username already exists" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err?.message || "unknown error" }, { status: 500 });
  }
}

// GET /backend/users
export async function GET() {
  try {
    const db = await getDb();
    const items = await db
      .collection<UsernameDoc>(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "unknown error" }, { status: 500 });
  }
}
