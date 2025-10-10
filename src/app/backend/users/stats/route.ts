import { NextResponse } from "next/server";
import { getDb } from "@/database/mongodb";

export const runtime = "nodejs";

// GET /backend/users/stats
export async function GET() {
  const db = await getDb();
  const count = await db.collection("usernames").countDocuments();
  const latest = await db
    .collection("usernames")
    .find({}, { projection: { _id: 1, username: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  return NextResponse.json({ ok: true, count, latest: latest[0] ?? null });
}
