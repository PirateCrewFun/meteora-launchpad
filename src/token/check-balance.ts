import {
  Connection,
  clusterApiUrl,
  PublicKey,
} from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";
import fs from "fs";

const { tokenAccount, mint } = JSON.parse(fs.readFileSync("mint.json", "utf-8"));

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const accountInfo = await getAccount(connection, new PublicKey(tokenAccount));
  const mintInfo = await getMint(connection, new PublicKey(mint));

  const balance = Number(accountInfo.amount) / 10 ** mintInfo.decimals;

  console.log(`Token balance: ${balance}`);
})();

