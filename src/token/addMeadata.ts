import {
  Connection,
  Keypair,
  clusterApiUrl,
  PublicKey,
} from "@solana/web3.js";
import fs from "fs";
import os from "os";
import path from "path";

const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
);

const { mint } = JSON.parse(fs.readFileSync("mint.json", "utf-8"));

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("968oQW63jQAbnh3Z6SBc2ZWwkVB4V1LcBj2sHCog6Lh2");

const METADATA = {
  name: "Fake Token",
  symbol: "Fake",
  uri: "https://gold-bitter-guan-406.mypinata.cloud/ipfs/bafkreiarsnkezuzqamzlzt44s2ehsmqxfwbipqkjl3l6ammtb7fdcababq",
  sellerFeeBasisPoints: 0,
  creators: [
    {
      address: payer.publicKey,
      verified: true,
      share: 100,
    },
  ],
};

function getMetadataPDA(mint: any) {
  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      new PublicKey(mint).toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return metadataAddress;
}

(async () => {
  try {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    console.log("Adding metadata to mint:", mint);
    console.log("Metadata:", METADATA);

    const metadataAddress = getMetadataPDA(mint);
    console.log("📍 Metadata PDA:", metadataAddress.toString());

    try {
      const existingAccount = await connection.getAccountInfo(metadataAddress);
      if (existingAccount) {
        console.log("⚠️  Metadata account already exists!");
        console.log("🔗 View token on Solscan:");
        console.log(`https://solscan.io/token/${mint}?cluster=devnet`);
        return;
      }
    } catch (error) {
    }

    // console.log("❌ Manual metadata creation is complex. Please use one of these options:");
    // console.log("1. Install UMI packages and use the first script");
    // console.log("2. Use Metaplex Sugar CLI tool");
    // console.log("3. Use a web interface like Solana Token Creator");
    //
    // console.log("\n🛠️  Recommended: Use Sugar CLI");
    // console.log("npm install -g @metaplex-foundation/sugar");
    // console.log("sugar create-metadata --keypair ~/.config/solana/id.json --mint " + mint);

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
})();
