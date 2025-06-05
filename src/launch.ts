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
  const activeBinPriceLamport = activeBin.price;
  const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
    Number(activeBin.price)
  );
  const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
  const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

  const totalXAmount = new BN(10_000_000_000).mul(new BN(10).pow(new BN(goldMint.decimals))); // 10B tokens
  const totalYAmount = new BN(3_000_000_000); // 3 SOL
  const newImbalancePosition = new Keypair();

  const createPositionTx =
    await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: newImbalancePosition.publicKey,
      user: user.publicKey,
      totalXAmount,
      totalYAmount,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: StrategyType.Spot, // can be StrategyType.Spot, StrategyType.BidAsk, StrategyType.Curve
      },
    });
  const txSig = await sendAndConfirmTransaction(connection, createPositionTx, [
    user,
    newImbalancePosition,
  ]);

  console.log(`$GOLD single-sided position created! Tx: ${txSig}`);
};

main().catch(console.error);
