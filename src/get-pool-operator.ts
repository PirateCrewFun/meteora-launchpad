import { Connection, PublicKey } from "@solana/web3.js";
import DLMM from "@meteora-ag/dlmm";

const connection = new Connection("https://api.devnet.solana.com");
const POOL_ADDRESS = new PublicKey("<YOUR_POOL_ADDRESS>");

(async () => {
  const pool = await DLMM.create(connection, POOL_ADDRESS);
  const poolState = await pool.getPoolState();
  console.log("On-chain operator:", poolState.operator.toBase58());
})();
