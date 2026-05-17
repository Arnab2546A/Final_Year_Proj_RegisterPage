//backend API route to handle user registration
import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { pool } from "../../../lib/db";
import nodemailer from "nodemailer";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function generateKeys() {
  const keygenPath = path.join(
    process.cwd(),
    "app",
    "AI-USB-Blockchain-main",
    "blockchain",
    "keygen.js"
  );

  await execFileAsync("node", [keygenPath], {
    cwd: process.cwd(),
  });
  
  const keysDir = path.join(process.cwd(), "keys");
  const publicKeyPem = await fs.readFile(path.join(keysDir, "public.pem"), "utf-8");
  const privateKeyPem = await fs.readFile(path.join(keysDir, "private.pem"), "utf-8");
  
  return { publicKeyPem, privateKeyPem };
}

async function checkUsernameExists(username: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT id FROM users WHERE username = $1;`,
    [username]
  );
  return result.rows.length > 0;
}

// Function to check if the USB VID or PID is already registered in the DB
async function checkUsbExists(usbVid: string, usbPid: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT id FROM users WHERE usb_vid = $1 OR usb_pid = $2;`,
    [usbVid, usbPid]
  );
  return result.rows.length > 0;
}

async function saveToDatabase(
  username: string,
  password: string,
  usbVid: string,
  usbPid: string,
  publicKeyPem: string
) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(50) NOT NULL,
      usb_vid VARCHAR(10) UNIQUE NOT NULL,
      usb_pid VARCHAR(10) UNIQUE NOT NULL,
      public_key_pem TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const result = await pool.query(
    `INSERT INTO users (username, password, usb_vid, usb_pid, public_key_pem) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, username, usb_vid, usb_pid, public_key_pem;`,
    [username, password, usbVid, usbPid, publicKeyPem]
  );
  
  return result.rows[0];
}

async function sendEmailWithPrivateKey(username: string, privateKey: string) {
  const tempDir = path.join(process.cwd(), ".temp");
  await fs.mkdir(tempDir, { recursive: true });
  
  const fileName = path.join(tempDir, `${username}_private.pem`);
  await fs.writeFile(fileName, privateKey);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "adcollege123456@gmail.com",
    subject: `New Registration - ${username}`,
    html: `
      <p>To the admin,</p>
      <p>New user registration:</p>
      <p><strong>Username:</strong> ${username}</p>
      <p>The private key is attached below.</p>
    `,
    attachments: [
      {
        filename: `${username}_private.pem`,
        path: fileName,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  await fs.unlink(fileName);
}

async function getUsbInfo(): Promise<{vid: string, pid: string}> {
  const pythonScript = path.join(process.cwd(), "get_usb.py");
  try {
    const { stdout } = await execFileAsync("python", [pythonScript]);
    const data = JSON.parse(stdout.trim());
    return { vid: data.vid || "0", pid: data.pid || "0" };
  } catch (error) {
    console.error("Failed to fetch USB info:", error);
    return { vid: "0", pid: "0" };
  }
}

export async function POST(req: Request) {
  try {
    const { username, password, confirmPassword } = await req.json();

    // Fetch the USB VID and PID automatically
    const usbInfo = await getUsbInfo();
    const usbVid = usbInfo.vid;
    const usbPid = usbInfo.pid;

    if (usbVid === "0000" || usbPid === "0000" || usbVid === "0" || usbPid === "0") {
      return NextResponse.json(
        { error: "No external USB storage drive detected. Please connect your USB drive and try again." },
        { status: 400 }
      );
    }

    // Validate inputs
    if (!username || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    // Validate required environment variables
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasPgDiscrete = !!(
      process.env.PGHOST &&
      process.env.PGPORT &&
      process.env.PGDATABASE &&
      process.env.PGUSER &&
      process.env.PGPASSWORD
    );
    if (!hasDatabaseUrl && !hasPgDiscrete) {
      console.error("Missing DB env: provide DATABASE_URL or PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD");
      return NextResponse.json(
        { error: "Server configuration error: database env not set" },
        { status: 500 }
      );
    }
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Missing env: EMAIL_USER/EMAIL_PASS");
      return NextResponse.json({ error: "Server configuration error: EMAIL credentials are not set" }, { status: 500 });
    }

    // Check if username already exists
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      return NextResponse.json(
        { error: "Username already taken. Please choose a different username." },
        { status: 400 }
      );
    }

    // Check if USB VID or PID is already registered
    const usbExists = await checkUsbExists(usbVid, usbPid);
    if (usbExists) {
      return NextResponse.json(
        { error: "This USB drive is already registered to another user. Please use a different USB drive." },
        { status: 400 }
      );
    }

    // Generate keys and read from public.pem and private.pem
    const { publicKeyPem, privateKeyPem } = await generateKeys();

    // Save to database (ONLY public key, NOT private key)
    const userData = await saveToDatabase(username, password, usbVid, usbPid, publicKeyPem);

    // Send email with private key
    await sendEmailWithPrivateKey(username, privateKeyPem);

    return NextResponse.json({
      success: true,
      message: "Registration successful! Private key sent to email.",
      user: userData,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Registration failed" }, 
      { status: 500 }
    );
  }
}
