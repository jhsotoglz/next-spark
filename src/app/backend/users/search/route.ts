import { NextResponse } from "next/server";
import { getDb } from "@/database/mongodb";

export const runtime = "nodejs";

// GET /backend/users/search?query=jes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("query") ?? "";
  const db = await getDb();

  const results = await db
    .collection("usernames")
    .find(q ? { username: { $regex: q, $options: "i" } } : {})
    .limit(20)
    .toArray();

  return NextResponse.json({ ok: true, results });
}
