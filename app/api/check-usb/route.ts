import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export async function GET() {
  const pythonScript = path.join(process.cwd(), "get_usb.py");
  try {
    const { stdout } = await execFileAsync("python", [pythonScript]);
    const data = JSON.parse(stdout.trim());
    const isDetected = data.vid !== "0000" && data.pid !== "0000" && data.vid !== "0" && data.pid !== "0";
    return NextResponse.json({ detected: isDetected });
  } catch (error) {
    return NextResponse.json({ detected: false });
  }
}
