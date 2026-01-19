import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Blockchain from "./blockchain/blockchain.js";
import { loadKeys } from "./blockchain/utils.js";
import fs from "fs";
import lockfile from "proper-lockfile";

dotenv.config();

const { privateKey, publicKey } = loadKeys();

// ✅ Dynamically create a unique chain file for each node
const NODE_NAME = process.env.NODE_NAME || "Node-1";
const CHAIN_FILE = `chain-${NODE_NAME}.json`;

// Safe load with lock
async function loadBlockchain() {
  try {
    const release = await lockfile.lock(CHAIN_FILE);
    const blockchain = Blockchain.loadFromFile(CHAIN_FILE, publicKey, privateKey);
    await release();
    return blockchain;
  } catch (err) {
    console.log(`⚠️ ${CHAIN_FILE} not found, creating new one...`);
    const blockchain = new Blockchain(publicKey, privateKey);
    blockchain.saveToFile(CHAIN_FILE);
    return blockchain;
  }
}

// Safe save with lock
async function saveBlockchain(blockchain) {
  const release = await lockfile.lock(CHAIN_FILE);
  blockchain.saveToFile(CHAIN_FILE);
  await release();
}

// Initialize
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;
const PEER_NODES = process.env.PEER_NODES ? process.env.PEER_NODES.split(",") : [];

let blockchain = await loadBlockchain();

console.log(`🚀 ${NODE_NAME} running on port ${PORT}`);

// 🧱 Get full blockchain
app.get("/chain", async (req, res) => {
  blockchain = await loadBlockchain();
  res.json(blockchain.chain);
});

// ➕ Add new block
app.post("/add-block", async (req, res) => {
  try {
    blockchain = await loadBlockchain();
    const data = req.body;
    const block = blockchain.addBlock(data);
    await saveBlockchain(blockchain);

    // Broadcast to peers
    for (const peer of PEER_NODES) {
      try {
        await axios.post(`${peer}/sync-block`, block);
      } catch {
        console.log(`⚠️ Failed to sync with ${peer}`);
      }
    }

    res.json({ message: "Block added", block });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🔄 Sync block (from peers)
app.post("/sync-block", async (req, res) => {
  const block = req.body;
  blockchain = await loadBlockchain();
  const latest = blockchain.getLatestBlock();

  if (latest.hash === block.previousHash) {
    blockchain.chain.push(block);
    await saveBlockchain(blockchain);
    res.json({ message: "Synced successfully" });
  } else {
    res.status(400).json({ error: "Invalid chain sequence" });
  }
});

// ✅ Validate chain
app.get("/validate", async (req, res) => {
  blockchain = await loadBlockchain();
  res.json({ valid: blockchain.isChainValid() });
});

app.post("/reset", async (req, res) => {
  try {
    const file = `chain_${NODE_NAME}.json`;
    if (fs.existsSync(file)) {
      fs.renameSync(file, `${file}.backup_${Date.now()}.bak`);
    }

    const newChain = new Blockchain(publicKey, privateKey);
    newChain.saveToFile(file);

    res.json({ message: `✅ ${NODE_NAME} reset successfully`, file });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ ${NODE_NAME} listening on port ${PORT}`));
