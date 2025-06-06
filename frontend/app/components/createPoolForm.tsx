"use client";
import { useState } from "react";

export default function CreatePoolForm() {
  const [form, setForm] = useState({
    rpcUrl: "https://api.devnet.solana.com",
    dryRun: false,
    keypairFilePath: "/home/maz/.config/solana/id.json",
    computeUnitPriceMicroLamports: 100000,
    baseMint: "",
    quoteSymbol: "SOL",
    dynamicAmmV2: {
      creator: "",
      baseAmount: 0,
      quoteAmount: null,
      initPrice: 0,
      maxPrice: 0,
      poolFees: {
        maxBaseFeeBps: 5000,
        minBaseFeeBps: 100,
        numberOfPeriod: 1,
        totalDuration: 86400,
        feeSchedulerMode: 0,
        useDynamicFee: true,
        dynamicFeeConfig: null,
      },
      hasAlphaVault: false,
      collectFeeMode: 0,
      activationType: "timestamp",
      activationPoint: null,
    },
  });

  const handleChange = (path: string, value: any) => {
    const keys = path.split(".");
    const newForm = { ...form };
    let current: any = newForm;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setForm(newForm);
  };

  const handleSubmit = async () => {
    const res = await fetch("/api/create-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    alert(result.message);
    console.log(result.output);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Create DAMM v2 Pool</h1>

      <label className="block">
        RPC URL
        <input
          className="border p-2 w-full"
          value={form.rpcUrl}
          onChange={(e) => handleChange("rpcUrl", e.target.value)}
        />
      </label>

      <label className="block">
        Dry Run
        <input
          type="checkbox"
          checked={form.dryRun}
          onChange={(e) => handleChange("dryRun", e.target.checked)}
        />
      </label>

      <label className="block">
        Keypair File Path
        <input
          className="border p-2 w-full"
          value={form.keypairFilePath}
          onChange={(e) => handleChange("keypairFilePath", e.target.value)}
        />
      </label>

      <label className="block">
        Compute Unit Price (μLamports)
        <input
          type="number"
          className="border p-2 w-full"
          value={form.computeUnitPriceMicroLamports}
          onChange={(e) => handleChange("computeUnitPriceMicroLamports", Number(e.target.value))}
        />
      </label>

      <label className="block">
        Base Mint
        <input
          className="border p-2 w-full"
          value={form.baseMint}
          onChange={(e) => handleChange("baseMint", e.target.value)}
        />
      </label>

      <label className="block">
        Quote Symbol
        <input
          className="border p-2 w-full"
          value={form.quoteSymbol}
          onChange={(e) => handleChange("quoteSymbol", e.target.value)}
        />
      </label>

      <hr />
      <h2 className="text-lg font-semibold">dynamicAmmV2</h2>

      <label className="block">
        Creator
        <input
          className="border p-2 w-full"
          value={form.dynamicAmmV2.creator}
          onChange={(e) => handleChange("dynamicAmmV2.creator", e.target.value)}
        />
      </label>

      <label className="block">
        Base Amount
        <input
          type="number"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.baseAmount}
          onChange={(e) => handleChange("dynamicAmmV2.baseAmount", Number(e.target.value))}
        />
      </label>

      <label className="block">
        Quote Amount (optional)
        <input
          type="number"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.quoteAmount ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            handleChange("dynamicAmmV2.quoteAmount", value === "" ? null : Number(value));
          }}
        />
      </label>

      <label className="block">
        Init Price
        <input
          type="number"
          step="any"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.initPrice}
          onChange={(e) => handleChange("dynamicAmmV2.initPrice", parseFloat(e.target.value))}
        />
      </label>

      <label className="block">
        Max Price
        <input
          type="number"
          step="any"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.maxPrice}
          onChange={(e) => handleChange("dynamicAmmV2.maxPrice", parseFloat(e.target.value))}
        />
      </label>

      <hr />
      <h2 className="text-md font-semibold">Pool Fees</h2>

      <label className="block">
        Max Base Fee (bps)
        <input
          type="number"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.poolFees.maxBaseFeeBps}
          onChange={(e) => handleChange("dynamicAmmV2.poolFees.maxBaseFeeBps", Number(e.target.value))}
        />
      </label>

      <label className="block">
        Min Base Fee (bps)
        <input
          type="number"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.poolFees.minBaseFeeBps}
          onChange={(e) => handleChange("dynamicAmmV2.poolFees.minBaseFeeBps", Number(e.target.value))}
        />
      </label>

      <label className="block">
        Number of Period
        <input
          type="number"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.poolFees.numberOfPeriod}
          onChange={(e) => handleChange("dynamicAmmV2.poolFees.numberOfPeriod", Number(e.target.value))}
        />
      </label>

      <label className="block">
        Total Duration (seconds)
        <input
          type="number"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.poolFees.totalDuration}
          onChange={(e) => handleChange("dynamicAmmV2.poolFees.totalDuration", Number(e.target.value))}
        />
      </label>

      <label className="block">
        Fee Scheduler Mode
        <input
          type="number"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.poolFees.feeSchedulerMode}
          onChange={(e) => handleChange("dynamicAmmV2.poolFees.feeSchedulerMode", Number(e.target.value))}
        />
      </label>

      <label className="block">
        Use Dynamic Fee
        <input
          type="checkbox"
          checked={form.dynamicAmmV2.poolFees.useDynamicFee}
          onChange={(e) => handleChange("dynamicAmmV2.poolFees.useDynamicFee", e.target.checked)}
        />
      </label>

      <label className="block">
        Has Alpha Vault
        <input
          type="checkbox"
          checked={form.dynamicAmmV2.hasAlphaVault}
          onChange={(e) => handleChange("dynamicAmmV2.hasAlphaVault", e.target.checked)}
        />
      </label>

      <label className="block">
        Collect Fee Mode
        <input
          type="number"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.collectFeeMode}
          onChange={(e) => handleChange("dynamicAmmV2.collectFeeMode", Number(e.target.value))}
        />
      </label>

      <label className="block">
        Activation Type
        <input
          className="border p-2 w-full"
          value={form.dynamicAmmV2.activationType}
          onChange={(e) => handleChange("dynamicAmmV2.activationType", e.target.value)}
        />
      </label>

      <label className="block">
        Activation Point (optional)
        <input
          type="number"
          className="border p-2 w-full"
          value={form.dynamicAmmV2.activationPoint ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            handleChange("dynamicAmmV2.activationPoint", value === "" ? null : Number(value));
          }}
        />
      </label>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        Submit & Create Pool
      </button>
    </div>
  );
}

