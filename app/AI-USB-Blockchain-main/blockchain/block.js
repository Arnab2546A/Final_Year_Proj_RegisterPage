import crypto from "crypto";

export default class Block {
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.signature = null;
  }

  calculateHash() {
    const str = this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash;
    return crypto.createHash("sha256").update(str).digest("hex");
  }

  signBlock(privateKey) {
    const signer = crypto.createSign("SHA256");
    signer.update(this.hash);
    signer.end();
    this.signature = signer.sign(privateKey, "hex");
  }

  isValid(publicKey) {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(this.hash);
    verifier.end();
    return verifier.verify(publicKey, this.signature, "hex");
  }
}
