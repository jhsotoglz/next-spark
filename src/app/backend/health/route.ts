import { NextResponse } from "next/server";
import { getDb } from "@/database/mongodb";

export const runtime = "nodejs"

export async function GET() {
    const db = await getDb()
    await db.command({ ping: 1 })
    return NextResponse.json({ ok: true })
}