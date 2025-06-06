import {
	Cluster,
	Connection,
	Keypair,
	PublicKey,
	sendAndConfirmTransaction
} from "@solana/web3.js"
import {
	MeteoraConfig,
	getAmountInLamports,
	getQuoteDecimals,
	runSimulateTransaction,
	modifyComputeUnitPriceIx,
	getDammV2ActivationType,
	getDecimalizedAmount,
	DEFAULT_SEND_TX_MAX_RETRIES
} from "../"
import { Wallet, BN } from "@coral-xyz/anchor"
import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import {
	BaseFee,
	CpAmm,
	getDynamicFeeParams,
	getBaseFeeParams,
	getPriceFromSqrtPrice,
	getSqrtPriceFromPrice,
	MAX_SQRT_PRICE,
	MIN_SQRT_PRICE,
	PoolFeesParams,
	BIN_STEP_BPS_DEFAULT,
	BIN_STEP_BPS_U128_DEFAULT,
	getLiquidityDeltaFromAmountA,
	calculateTransferFeeIncludedAmount
} from "@meteora-ag/cp-amm-sdk"

export async function createDammV2CustomizablePool(
	config: MeteoraConfig,
	connection: Connection,
	wallet: Wallet,
	baseTokenMint: PublicKey,
	quoteTokenMint: PublicKey,
	opts?: {
		cluster?: Cluster
		programId?: PublicKey
	}
) {
	if (!config.dynamicAmmV2) {
		throw new Error("Missing dynamic amm v2 configuration")
	}
	console.log("\n> Initializing customize Dynamic AMM V2 pool...")

	const quoteDecimals = await getQuoteDecimals(
		connection,
		config.quoteSymbol,
		config.quoteMint
	)

	let baseTokenInfo = null
	let baseTokenProgram = TOKEN_PROGRAM_ID

	const baseMintAccountInfo = await connection.getAccountInfo(
		new PublicKey(baseTokenMint),
		connection.commitment
	)

	const baseMint = await getMint(
		connection,
		baseTokenMint,
		connection.commitment,
		baseMintAccountInfo.owner
	)

	if (baseMintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
		const epochInfo = await connection.getEpochInfo()
		baseTokenInfo = {
			mint: baseMint,
			currentEpoch: epochInfo.epoch
		}
		baseTokenProgram = TOKEN_2022_PROGRAM_ID
	}

	const baseDecimals = baseMint.decimals

	// create cp amm instance
	const cpAmmInstance = new CpAmm(connection)
	const {
		initPrice,
		maxPrice,
		poolFees,
		baseAmount,
		quoteAmount,
		hasAlphaVault,
		activationPoint,
		activationType,
		collectFeeMode
	} = config.dynamicAmmV2

	const {
		maxBaseFeeBps,
		minBaseFeeBps,
		feeSchedulerMode,
		totalDuration,
		numberOfPeriod,
		useDynamicFee
	} = poolFees
	// setup pool params

	let tokenAAmount = getAmountInLamports(baseAmount, baseDecimals)
	let tokenBAmount = new BN(0)
	// transfer fee if token2022
	if (baseTokenInfo) {
		tokenAAmount = tokenAAmount.sub(
			calculateTransferFeeIncludedAmount(
				tokenAAmount,
				baseTokenInfo.mint,
				baseTokenInfo.currentEpoch
			).transferFee
		)
	}

	const maxSqrtPrice = maxPrice
		? getSqrtPriceFromPrice(maxPrice.toString(), baseDecimals, quoteDecimals)
		: MAX_SQRT_PRICE

	let initSqrtPrice = getSqrtPriceFromPrice(
		initPrice.toString(),
		baseDecimals,
		quoteDecimals
	)
	let minSqrtPrice = initSqrtPrice

	let liquidityDelta = getLiquidityDeltaFromAmountA(
		tokenAAmount,
		initSqrtPrice,
		maxSqrtPrice
	)

	if (quoteAmount) {
		tokenBAmount = getAmountInLamports(quoteAmount, quoteDecimals)
		// L = Δb / (√P_upper - √P_lower)
		// √P_lower = √P_upper - Δb / L
		const numerator = tokenBAmount.shln(128).div(liquidityDelta)
		minSqrtPrice = initSqrtPrice.sub(numerator)
	}
	console.log(
		`- Using base token with amount = ${getDecimalizedAmount(tokenAAmount, baseDecimals)}`
	)
	console.log(
		`- Init price ${getPriceFromSqrtPrice(initSqrtPrice, baseDecimals, quoteDecimals)}`
	)

	console.log(
		`- Price range [${getPriceFromSqrtPrice(minSqrtPrice, baseDecimals, quoteDecimals)}, ${getPriceFromSqrtPrice(maxSqrtPrice, baseDecimals, quoteDecimals)}]`
	)

	const activationTypeValue = getDammV2ActivationType(activationType)

	let dynamicFee = null
	if (useDynamicFee) {
		const dynamicFeeConfig = config.dynamicAmmV2.poolFees.dynamicFeeConfig
		if (dynamicFeeConfig) {
			dynamicFee = {
				binStep: BIN_STEP_BPS_DEFAULT,
				binStepU128: BIN_STEP_BPS_U128_DEFAULT,
				filterPeriod: dynamicFeeConfig.filterPeriod,
				decayPeriod: dynamicFeeConfig.decayPeriod,
				reductionFactor: dynamicFeeConfig.reductionFactor,
				variableFeeControl: dynamicFeeConfig.variableFeeControl,
				maxVolatilityAccumulator: dynamicFeeConfig.maxVolatilityAccumulator
			}
		} else {
			dynamicFee = getDynamicFeeParams(config.dynamicAmmV2.poolFees.minBaseFeeBps)
		}
	}

	const baseFee: BaseFee = getBaseFeeParams(
		maxBaseFeeBps,
		minBaseFeeBps,
		feeSchedulerMode,
		numberOfPeriod,
		totalDuration
	)

	const poolFeesParams: PoolFeesParams = {
		baseFee,
		protocolFeePercent: 20,
		partnerFeePercent: 0,
		referralFeePercent: 20,
		dynamicFee
	}
	const positionNft = Keypair.generate()

	const {
		tx: initCustomizePoolTx,
		pool,
		position
	} = await cpAmmInstance.createCustomPool({
		payer: wallet.publicKey,
		creator: new PublicKey(config.dynamicAmmV2.creator),
		positionNft: positionNft.publicKey,
		tokenAMint: baseTokenMint,
		tokenBMint: quoteTokenMint,
		tokenAAmount: tokenAAmount,
		tokenBAmount: tokenBAmount,
		sqrtMinPrice: minSqrtPrice,
		sqrtMaxPrice: maxSqrtPrice,
		liquidityDelta: liquidityDelta,
		initSqrtPrice,
		poolFees: poolFeesParams,
		hasAlphaVault: hasAlphaVault,
		activationType: activationTypeValue,
		collectFeeMode: collectFeeMode,
		activationPoint: activationPoint ? new BN(activationPoint) : null,
		tokenAProgram: baseTokenProgram,
		tokenBProgram: TOKEN_PROGRAM_ID
	})

	modifyComputeUnitPriceIx(initCustomizePoolTx, config.computeUnitPriceMicroLamports)

	console.log(`\n> Pool address: ${pool}`)
	console.log(`\n> Position address: ${position}`)

	if (config.dryRun) {
		console.log(`> Simulating init pool tx...`)
		await runSimulateTransaction(
			connection,
			[wallet.payer, positionNft],
			wallet.publicKey,
			[initCustomizePoolTx]
		)
	} else {
		console.log(`>> Sending init pool transaction...`)
		const initPoolTxHash = await sendAndConfirmTransaction(
			connection,
			initCustomizePoolTx,
			[wallet.payer, positionNft],
			{
				commitment: connection.commitment,
				maxRetries: DEFAULT_SEND_TX_MAX_RETRIES
			}
		).catch((err) => {
			console.error(err)
			throw err
		})
		console.log(`>>> Pool initialized successfully with tx hash: ${initPoolTxHash}`)
	}
}
