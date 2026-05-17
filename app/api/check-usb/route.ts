import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export async function GET() {
  const pythonScript = path.join(process.cwd(), "get_usb.py");
  try {
    const { stdout } = await execFileAsync("python", [pythonScript]);
    // Extract JSON in case there is some stray output
    const match = stdout.match(/\{.*\}/);
    const jsonStr = match ? match[0] : '{"vid":"0000","pid":"0000"}';

    const data = JSON.parse(jsonStr);
    const isDetected = data.vid !== "0000" && data.pid !== "0000" && data.vid !== "0" && data.pid !== "0";
    return NextResponse.json({ detected: isDetected });
  } catch (error) {
    // If the python script fails, do not throw an error, just return false it's not detected
    return NextResponse.json({ detected: false });
  }
}
