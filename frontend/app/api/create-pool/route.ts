
import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { spawn } from "child_process";
import path from "path";
import { Buffer } from "buffer";

export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.json();

  const baseDir = process.cwd();
  const configDir = path.join(baseDir, "config");
  const secretsDir = path.join(baseDir, "secrets");
  const configPath = path.join(configDir, "temp-config.json");
  const keypairPath = path.join(secretsDir, "id.json");

  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });
  if (!existsSync(secretsDir)) mkdirSync(secretsDir, { recursive: true });

  const keypairBase64 = process.env.KEYPAIR_B64;
  if (!keypairBase64) {
    return NextResponse.json({ message: "Missing KEYPAIR_B64 env var" }, { status: 500 });
  }

  const decodedKeypair = Buffer.from(keypairBase64, "base64").toString("utf-8");
  writeFileSync(keypairPath, decodedKeypair);

  const fullConfig = { ...body, keypairFilePath: keypairPath };
  writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));

  const scriptPath = path.join(baseDir, "meteora-pool-setup/src/create_damm_v2_customizable_pool.ts");

  const response: Response = await new Promise((resolve) => {
    const bunProcess = spawn("bun", ["run", scriptPath, "--config", configPath]);

    let output = "";

    bunProcess.stdout.on("data", (data) => (output += data.toString()));
    bunProcess.stderr.on("data", (data) => (output += data.toString()));

    bunProcess.on("close", (code) => {
      resolve(
        NextResponse.json({
          message: `Script exited with code ${code}`,
          output,
        })
      );
    });
  });

  return response;
}
