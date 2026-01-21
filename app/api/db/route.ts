//it is used to test the database connection health
import { NextResponse } from "next/server";
import { ping } from "../../../lib/db";

export async function GET() {
  try {
    const res = await ping();
    return NextResponse.json({ ok: true, now: res.now });
  } catch (err) {
    const error = err as Error;
    console.error("DB health-check error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB connection failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
