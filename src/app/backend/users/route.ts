import { NextResponse } from "next/server";
import { getDb } from "@/database/mongodb";

export const runtime = "nodejs";

type UsernameDoc = {
  _id?: string;
  username: string;
  createdAt: Date;
};

const COLLECTION = "usernames";

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const { username } = (await req.json()) as Partial<UsernameDoc>;

    if (typeof username !== "string") {
      return NextResponse.json({ ok: false, error: "username must be a string" }, { status: 400 });
    }

    const clean = username.trim();
    if (clean.length < 3 || clean.length > 24 || !/^[A-Za-z0-9_]+$/.test(clean)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "username must be 3–24 characters long and can only contain letters, numbers, and underscores",
        },
        { status: 400 },
      );
    }

    await db.collection(COLLECTION).createIndex(
      { username: 1 },
      { unique: true, collation: { locale: "en", strength: 2 } }, // strength:2 = case-insensitive
    );

    const res = await db.collection<UsernameDoc>(COLLECTION).insertOne({
      username: clean,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, id: res.insertedId, username: clean }, { status: 201 });
  } catch (err: any) {
    // duplicate key error
    if (err?.code === 11000) {
      return NextResponse.json({ ok: false, error: "username already exists (case-insensitive)" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err?.message || "unknown error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const items = await db
      .collection<UsernameDoc>(COLLECTION)
      .find({})
      .project({ _id: 0 })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "unknown error" }, { status: 500 });
  }
}