import { ProgramTestContext } from "solana-bankrun";
import {
  createDynamicConfig,
  processTransactionMaybeThrow,
  setupTestContext,
  startTest,
} from "./bankrun-utils/common";
import {
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import BN from "bn.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  BaseFee,
  CpAmm,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  PoolFeesParams,
} from "../src";
import { DECIMALS } from "./bankrun-utils";

describe("Initialize customizable pool with dynamic config", () => {
  describe("SPL-Token", () => {
    let context: ProgramTestContext;
    let payer: Keypair;
    let creator: Keypair;
    let tokenX: PublicKey;
    let tokenY: PublicKey;
    let ammInstance: CpAmm;
    let config: PublicKey;

    beforeEach(async () => {
      context = await startTest();
      const prepareContext = await setupTestContext(
        context.banksClient,
        context.payer,
        false
      );

      creator = prepareContext.poolCreator;
      payer = prepareContext.payer;
      tokenX = prepareContext.tokenAMint;
      tokenY = prepareContext.tokenBMint;
      const connection = new Connection(clusterApiUrl("devnet"));
      ammInstance = new CpAmm(connection);
      config = await createDynamicConfig(
        context.banksClient,
        ammInstance._program,
        payer,
        new BN(1),
        creator.publicKey
      );
    });

    it("Initialize customizeable pool with spl token", async () => {
      const baseFee: BaseFee = {
        cliffFeeNumerator: new BN(1_000_000), // 1%
        numberOfPeriod: 10,
        periodFrequency: new BN(10),
        reductionFactor: new BN(2),
        feeSchedulerMode: 0, // Linear
      };
      const poolFees: PoolFeesParams = {
        baseFee,
        protocolFeePercent: 20,
        partnerFeePercent: 0,
        referralFeePercent: 20,
        dynamicFee: null,
      };

      const positionNft = Keypair.generate();

      const tokenAAmount = new BN(1000 * 10 ** DECIMALS);
      const tokenBAmount = new BN(1000 * 10 ** DECIMALS);
      const { liquidityDelta: initPoolLiquidityDelta, initSqrtPrice } =
        ammInstance.preparePoolCreationParams({
          tokenAAmount,
          tokenBAmount,
          minSqrtPrice: MIN_SQRT_PRICE,
          maxSqrtPrice: MAX_SQRT_PRICE,
        });

      const params: any = {
        payer: payer.publicKey,
        creator: creator.publicKey,
        positionNft: positionNft.publicKey,
        config,
        poolCreatorAuthority: creator.publicKey,
        tokenAMint: tokenX,
        tokenBMint: tokenY,
        tokenAAmount: new BN(1000 * 10 ** DECIMALS),
        tokenBAmount: new BN(1000 * 10 ** DECIMALS),
        sqrtMinPrice: MIN_SQRT_PRICE,
        sqrtMaxPrice: MAX_SQRT_PRICE,
        liquidityDelta: initPoolLiquidityDelta,
        initSqrtPrice,
        poolFees,
        hasAlphaVault: false,
        activationType: 1, // 0 slot, 1 timestamp
        collectFeeMode: 0,
        activationPoint: null,
        tokenAProgram: TOKEN_PROGRAM_ID,
        tokenBProgram: TOKEN_PROGRAM_ID,
      };

      const { tx: transaction } =
        await ammInstance.createCustomPoolWithDynamicConfig(params);
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 400_000,
        })
      );
      transaction.recentBlockhash = (
        await context.banksClient.getLatestBlockhash()
      )[0];
      transaction.sign(payer, positionNft, creator);

      await processTransactionMaybeThrow(context.banksClient, transaction);
    });
  });

  describe("Token 2022", () => {
    let context: ProgramTestContext;
    let payer: Keypair;
    let creator: Keypair;
    let tokenX: PublicKey;
    let tokenY: PublicKey;
    let ammInstance: CpAmm;
    let config: PublicKey;

    beforeEach(async () => {
      context = await startTest();
      const extensions = [ExtensionType.TransferFeeConfig];
      const prepareContext = await setupTestContext(
        context.banksClient,
        context.payer,
        true,
        extensions
      );

      creator = prepareContext.poolCreator;
      payer = prepareContext.payer;
      tokenX = prepareContext.tokenAMint;
      tokenY = prepareContext.tokenBMint;

      const connection = new Connection(clusterApiUrl("devnet"));
      ammInstance = new CpAmm(connection);
      config = await createDynamicConfig(
        context.banksClient,
        ammInstance._program,
        payer,
        new BN(2),
        creator.publicKey
      );
    });

    it("Initialize customizeable pool with spl token", async () => {
      const baseFee: BaseFee = {
        cliffFeeNumerator: new BN(1_000_000), // 1%
        numberOfPeriod: 10,
        periodFrequency: new BN(10),
        reductionFactor: new BN(2),
        feeSchedulerMode: 0, // Linear
      };
      const poolFees: PoolFeesParams = {
        baseFee,
        protocolFeePercent: 20,
        partnerFeePercent: 0,
        referralFeePercent: 20,
        dynamicFee: null,
      };

      const positionNft = Keypair.generate();

      const tokenAAmount = new BN(1000 * 10 ** DECIMALS);
      const tokenBAmount = new BN(1000 * 10 ** DECIMALS);
      const { liquidityDelta: initPoolLiquidityDelta, initSqrtPrice } =
        ammInstance.preparePoolCreationParams({
          tokenAAmount,
          tokenBAmount,
          minSqrtPrice: MIN_SQRT_PRICE,
          maxSqrtPrice: MAX_SQRT_PRICE,
        });

      const params: any = {
        payer: payer.publicKey,
        creator: creator.publicKey,
        positionNft: positionNft.publicKey,
        config,
        poolCreatorAuthority: creator.publicKey,
        tokenAMint: tokenX,
        tokenBMint: tokenY,
        tokenAAmount: new BN(1000 * 10 ** DECIMALS),
        tokenBAmount: new BN(1000 * 10 ** DECIMALS),
        sqrtMinPrice: MIN_SQRT_PRICE,
        sqrtMaxPrice: MAX_SQRT_PRICE,
        liquidityDelta: initPoolLiquidityDelta,
        initSqrtPrice,
        poolFees,
        hasAlphaVault: false,
        activationType: 1, // 0 slot, 1 timestamp
        collectFeeMode: 0,
        activationPoint: null,
        tokenAProgram: TOKEN_2022_PROGRAM_ID,
        tokenBProgram: TOKEN_2022_PROGRAM_ID,
      };

      const { tx: transaction } =
        await ammInstance.createCustomPoolWithDynamicConfig(params);
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 400_000,
        })
      );
      transaction.recentBlockhash = (
        await context.banksClient.getLatestBlockhash()
      )[0];
      transaction.sign(payer, positionNft, creator);

      await processTransactionMaybeThrow(context.banksClient, transaction);
    });
  });
});
