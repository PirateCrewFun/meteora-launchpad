import {
  Connection,
  Keypair,
  clusterApiUrl,
  PublicKey
} from "@solana/web3.js";
import { mintTo } from "@solana/spl-token";
import fs from "fs";
import os from "os";
import path from "path";

const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
);
const { mint, tokenAccount } = JSON.parse(fs.readFileSync("mint.json", "utf-8"));

const tokensToMint = BigInt(100_000_000_000); // 100 billion tokens
const decimals = BigInt(6);
const amount = tokensToMint * (BigInt(10) ** decimals);

console.log("Tokens to mint:", tokensToMint.toString());
console.log("Amount (raw units):", amount.toString());
console.log("Expected result: 100,000,000,000 tokens");

(async () => {
  try {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const sig = await mintTo(
      connection,
      payer,
      new PublicKey(mint),
      new PublicKey(tokenAccount),
      payer,
      amount
    );

    console.log("Minted Signature:", sig);
    console.log("Successfully minted 100 billion tokens!");

  } catch (error: any) {
    console.error("❌ Error minting tokens:", error.message);
  }
})();
