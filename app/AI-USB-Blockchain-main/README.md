# 🔒 AI-USB-Blockchain

An **AI-powered Blockchain-based USB Authentication System** that ensures secure access control across multiple nodes.  
Each node maintains its own verified blockchain ledger (`chain-Node-X.json`) and automatically syncs with peers to maintain integrity and tamper-proof audit trails.

---

## 🚀 Features

- ✅ **Distributed Blockchain Network** — Each node maintains its own copy of the ledger.
- 🔐 **RSA Key-Pair Signing** — Blocks are signed using private keys and verified with public keys.
- 🧱 **Automatic Peer Synchronization** — New blocks are broadcast to all connected nodes.
- ⚡ **File Locking with `proper-lockfile`** — Prevents simultaneous writes to the blockchain file.
- 🛡️ **Tamper Detection** — If any chain file is manually modified, it is detected and auto-repaired.
- ♻️ **Node Reset API** — Easily reset a node’s blockchain with one command.

---

## 📂 Project Structure
```bash
ai-usb-blockchain/
│
├── 📄 server.js                    
├── 📄 package.json                 
├── 📄 .env.node1                    # Environment for Node-1
├── 📄 README.md                     # Full project documentation
│
├── 📂 blockchain/                   # Core blockchain logic
│   │
│   ├── 📄 block.js                  # Defines Block class (hashing, signing, validation)
│   ├── 📄 blockchain.js             # Blockchain class (add, validate, sync, save, load)
│   ├── 📄 utils.js                  # Utility functions (RSA key loading, signing helpers)
│   ├── 📄 keygen.js                 # RSA key pair generator script (private/public keys)
│   │
│   └── 📂 keys/                     # Stores generated RSA keys
│       ├── 📄 private.pem           # Private key (used to sign blocks)
│       └── 📄 public.pem            # Public key (used to verify signatures)
│
│
├── 📄 chain-Node-1.json             # Local blockchain ledger for Node-1
├── 📄 chain-Node-2.json             # Local blockchain ledger for Node-2
├── 📄 chain-Node-3.json             # Local blockchain ledger for Node-3

```

---

## ⚙️ Setup Instructions

### 1️⃣ Install Dependencies
```bash
npm install express axios dotenv proper-lockfile
```
2️⃣ Create RSA Keys
Keys are loaded using the helper in utils.js:

js
```bash
const { privateKey, publicKey } = loadKeys();
```
You can generate your own key pair:

```bash

node blockchain/keygen.js

```
Place them in blockchain/keys/.

🌐 Environment Configuration
Each node should have its own .env file:

Example .env.node1

env
```bash
NODE_NAME=Node-1
PORT=5001
PEER_NODES=http://localhost:5002,http://localhost:5003
```
Example .env.node2

env
```bash
NODE_NAME=Node-2
PORT=5002
PEER_NODES=http://localhost:5001
```
▶️ Run Nodes
Start Node 1
bash
```bash
cp .env.node1 .env
node server.js
```
Start Node 2
bash
```bash
cp .env.node2 .env
node server.js
```
Each node will automatically create its own chain file:

pgsql
```bash
chain-Node-1.json
chain-Node-2.json
```
📡 API Endpoints
🧱 1. Get Full Blockchain
bash
```bash
GET /chain
```
➕ 2. Add New Block
bash
```bash
POST /add-block
Content-Type: application/json
Body:
{
  "device_id": "USB12365",
  "user_id": "U001",
  "auth_status": "Success",
  "ai_score": 0.33,
  "signature_valid": true
}
```
🔄 3. Sync Block (Internal Use)
bash
```bash
POST /sync-block
```
✅ 4. Validate Chain
bash
```bash
GET /validate
```
♻️ 5. Reset Node
bash
```bash
POST /reset
```
Resets the node’s local blockchain file and creates a fresh Genesis Block.

🔐 Security & Tamper Protection
The blockchain file (e.g., chain-Node-1.json) is write-locked using proper-lockfile.

Manual edits to the chain file trigger an integrity failure.

If tampering is detected:

The corrupted file is backed up as chain-Node-1.json.corrupted_<timestamp>.bak

A new clean blockchain is created automatically.

Only the server process can write to the blockchain file.

🧰 Resetting a Node
Option 1: API Method
bash
```bash
Invoke-RestMethod -Uri "http://localhost:5001/reset" -Method POST
```
Option 2: Manual Reset
bash
```bash
Remove-Item chain-Node-(node no.).json -Force
node server.js
```
The node will automatically recreate a new Genesis block on startup.

🔄 Handling Chain Corruption
If a node detects corruption (manual edit or invalid hash sequence):

It will automatically back up the corrupted file.

Optionally, it can restore from a peer node’s valid chain.

If no peers are reachable, it will rebuild a fresh Genesis chain.

🧠 Future Enhancements
🔗 Cross-node consensus algorithm (Proof of Authority / Byzantine Fault Tolerance)

🤖 Integration with on-device AI for USB anomaly detection

🧩 Encrypted chain synchronization between geographically distributed nodes

🧑‍💻 Author
Abir Paul
BTech IT, Techno Main Salt Lake
