import 'dotenv/config';
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import DLMM, { StrategyType } from '@meteora-ag/dlmm';
import { BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';

const main = async () => {
  const connection = new Connection(process.env.RPC_URL!, 'confirmed');
  console.log("connection", connection);

  const user = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));

  const POOL_ADDRESS = new PublicKey(process.env.POOL_ADDRESS!);
  console.log("pool ka address", POOL_ADDRESS);

  const FAKE_MINT = new PublicKey(process.env.FAKE_MINT!);

  const goldMint = await getMint(connection, FAKE_MINT);

  const dlmmPool = await DLMM.create(connection, POOL_ADDRESS);
  const activeBin = await dlmmPool.getActiveBin();

  const TOTAL_RANGE_INTERVAL = 10;
  const minBinId = activeBin.binId;
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL * 2;

  const totalXAmount = new BN(2000000000 * 10 ** goldMint.decimals);
  const totalYAmount = new BN(0);

  const newPosition = new Keypair();

  const tx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
    positionPubKey: newPosition.publicKey,
    user: user.publicKey,
    totalXAmount,
    totalYAmount,
    strategy: {
      minBinId,
      maxBinId,
      strategyType: StrategyType.Spot,
    },
  });

  const txSig = await sendAndConfirmTransaction(connection, tx, [
    user,
    newPosition,
  ]);

  console.log(`$GOLD single-sided position created! Tx: ${txSig}`);
};

main().catch(console.error);
