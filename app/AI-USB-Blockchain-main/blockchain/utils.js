import fs from "fs";

export function loadKeys() {
  const privateKey = fs.readFileSync("./keys/private.pem", "utf8");
  const publicKey = fs.readFileSync("./keys/public.pem", "utf8");
  return { privateKey, publicKey };
}
