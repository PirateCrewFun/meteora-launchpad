
import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.json();

  const configDir = path.join(process.cwd(), "config");
  const configPath = path.join(configDir, "temp-config.json");

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  writeFileSync(configPath, JSON.stringify(body, null, 2));

  const response: Response = await new Promise((resolve) => {
    const scriptPath = path.join(
      process.cwd(),
      "meteora-pool-setup/src/create_damm_v2_customizable_pool.ts"
    );

    const bunProcess = spawn("bun", ["run", scriptPath, "--config", configPath]);

    let output = "";

    bunProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    bunProcess.stderr.on("data", (data) => {
      output += data.toString();
    });

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

