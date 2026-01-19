import fs from "fs";
import crypto from "crypto";
import os from "os";
import { execSync } from "child_process";
import Block from "./block.js";

export default class Blockchain {
  constructor(publicKey, privateKey) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.chain = [this.createGenesisBlock(privateKey)];
  }

  createGenesisBlock(privateKey) {
    const block = new Block(0, new Date().toISOString(), { message: "Genesis Block" }, "0");
    block.signBlock(privateKey);
    return block;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(
      this.chain.length,
      new Date().toISOString(),
      data,
      previousBlock.hash
    );
    newBlock.signBlock(this.privateKey);

    if (!newBlock.isValid(this.publicKey)) throw new Error("❌ Invalid Signature!");
    this.chain.push(newBlock);
    this.saveToFile(); // secure auto-save
    return newBlock;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
      if (!current.isValid(this.publicKey)) return false;
    }
    return true;
  }

  // --- Secure save with signature + file lock ---
  async saveToFile(filename = "chain.json") {
  const chainData = JSON.stringify(this.chain, null, 2);
  const signature = crypto
    .sign("sha256", Buffer.from(chainData), this.privateKey)
    .toString("base64");

  const fileData = { chain: this.chain, signature };

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 300; // ms

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      if (os.platform() !== "win32") {
        if (fs.existsSync(filename)) execSync(`chmod 600 ${filename}`);
        fs.writeFileSync(filename, JSON.stringify(fileData, null, 2));
        execSync(`chmod 400 ${filename}`);
      } else {
        if (fs.existsSync(filename)) fs.chmodSync(filename, 0o600);
        fs.writeFileSync(filename, JSON.stringify(fileData, null, 2));
        fs.chmodSync(filename, 0o444);
      }

      //  Successfully written, exit loop
      return;
    } catch (err) {
      const errorMsg = err.message?.toLowerCase() || "";
      if (
        errorMsg.includes("lock") ||
        errorMsg.includes("permission") ||
        errorMsg.includes("access")
      ) {
        // Clear, user-friendly security message
        if (i === MAX_RETRIES - 1) {
          console.error("⚠️ Chain file tampered or locked! Refusing to modify — please restore or reset.");
          throw new Error("⚠️ Chain file tampered or locked! Refusing to modify — please restore or reset.");
        }
      } else {
        // Some other error (disk, path, etc.)
        if (i === MAX_RETRIES - 1) {
          console.error("❌ Failed to save chain after multiple retries:", err);
          throw new Error("Unexpected save error — check file system permissions.");
        }
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
}


  // --- Secure load with signature verification ---
  static loadFromFile(filename, publicKey, privateKey) {
    if (!fs.existsSync(filename)) {
      const bc = new Blockchain(publicKey, privateKey);
      bc.saveToFile(filename);
      return bc;
    }

    const fileContent = JSON.parse(fs.readFileSync(filename));
    const { chain, signature } = fileContent;

    const chainData = JSON.stringify(chain, null, 2);
    const isValid = crypto.verify(
      "sha256",
      Buffer.from(chainData),
      publicKey,
      Buffer.from(signature, "base64")
    );

    if (!isValid) {
      throw new Error("🚨 Chain file has been tampered with! Refusing to load.");
    }

    const bc = new Blockchain(publicKey, privateKey);
    bc.chain = chain;
    return bc;
  }
}
