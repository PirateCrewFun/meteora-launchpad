import {
  Connection,
  Keypair,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import fs from "fs";
import os from "os";
import path from "path";

const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");

const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
);

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const mint = await createMint(connection, payer, payer.publicKey, null, 6);
  console.log("Mint address:", mint.toBase58());

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );
  console.log("Token account:", tokenAccount.address.toBase58());

  fs.writeFileSync("mint.json", JSON.stringify({
    mint: mint.toBase58(),
    tokenAccount: tokenAccount.address.toBase58(),
  }, null, 2));
})();
