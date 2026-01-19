import fs from "fs";
import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "secp256k1",
});

fs.mkdirSync("./keys", { recursive: true });
fs.writeFileSync("./keys/private.pem", privateKey.export({ type: "pkcs8", format: "pem" }));
fs.writeFileSync("./keys/public.pem", publicKey.export({ type: "spki", format: "pem" }));

console.log("✅ Keys generated: ./keys/private.pem and ./keys/public.pem");
