
import {
  Connection,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { CpAmm, MIN_SQRT_PRICE, MAX_SQRT_PRICE } from "@meteora-ag/cp-amm-sdk";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "bn.js";
import fs from "fs";
import os from "os";
import path from "path";

const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
);

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const cpAmm = new CpAmm(connection);

const FAKE_TOKEN_MINT = new PublicKey("FAKE_TOKEN_MINT_HERE"); // replace this
const POSITION_NFT_MINT = new PublicKey("POSITION_NFT_MINT_HERE"); // new NFT mint
const DUMMY_TOKEN_MINT = new PublicKey("11111111111111111111111111111111"); // native SOL (used as dummy)

const tokenAAmount = new BN("100000000000000"); // 100B

const minSqrtPrice = MIN_SQRT_PRICE;
const maxSqrtPrice = MAX_SQRT_PRICE;
const initSqrtPrice = minSqrtPrice;

const liquidityDelta = cpAmm.preparePoolCreationSingleSide({
  tokenAAmount,
  initSqrtPrice,
  minSqrtPrice,
  maxSqrtPrice,
});

const poolFees = {
  baseFee: {
    feeSchedulerMode: 0,          // 0 = Linear, 1 = Exponential
    cliffFeeNumerator: 10_000_000, // Start at 10% fee
    numberOfPeriod: 60,            // 60 periods total
    reductionFactor: 166_666,      // Drop ~0.166% per period
    periodFrequency: 10,           // Every 10 sec → drops to 0.3% in 10 mins
  },
  dynamicFee: {
    initialized: false,
  }
};

(async () => {
  const { tx, pool, position } = await cpAmm.createCustomPool({
    payer: payer.publicKey,
    creator: payer.publicKey,
    positionNft: POSITION_NFT_MINT,
    tokenAMint: FAKE_TOKEN_MINT,
    tokenBMint: DUMMY_TOKEN_MINT,
    tokenAAmount: tokenAAmount,
    tokenBAmount: new BN(1), // required dummy value for second token
    minSqrtPrice,
    maxSqrtPrice,
    tokenADecimal: 9,
    tokenBDecimal: 0,
    poolFees,
    hasAlphaVault: false,
    collectFeeMode: 0,
    activationPoint: new BN(Math.floor(Date.now() / 1000)), // use timestamp
    activationType: 1, // 1 = timestamp based
    tokenAProgram: TOKEN_PROGRAM_ID,
    tokenBProgram: TOKEN_PROGRAM_ID,
  });

  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("✅ Pool created!");
  console.log("Tx Signature:", sig);
  console.log("Pool Address:", pool.toBase58());
  console.log("Position NFT Address:", position.toBase58());
})();
