#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    source: "",
    output: path.resolve("skills"),
    repo: "https://github.com/larksuite/cli.git",
    ref: "main",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--source") {
      args.source = path.resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (current === "--output") {
      args.output = path.resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (current === "--repo") {
      args.repo = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (current === "--ref") {
      args.ref = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (current === "--help" || current === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!args.source && !args.repo) {
    throw new Error("Either --source <raw-skills-dir> or --repo <git-url> is required.");
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/sync-upstream-skills.mjs [--repo https://github.com/larksuite/cli.git] [--ref main] [--output ./skills]
  node scripts/sync-upstream-skills.mjs --source /path/to/raw/skills [--output ./skills]

Description:
  Rebuild the aggregate package from upstream raw skills and verify the result.
  By default this script clones larksuite/cli and reads its skills/ directory.`);
}

function runCommand(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${path.basename(command)} exited with code ${code ?? "unknown"}`));
    });

    child.on("error", reject);
  });
}

async function resolveSourceDir({ source, repo, ref }) {
  if (source) {
    return {
      cleanup: async () => {},
      sourceDir: source,
    };
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "larksuite-tools-"));
  const checkoutDir = path.join(tempRoot, "upstream");

  await runCommand("git", ["clone", "--depth=1", "--branch", ref, repo, checkoutDir]);

  return {
    cleanup: async () => {
      await fs.rm(tempRoot, { recursive: true, force: true });
    },
    sourceDir: path.join(checkoutDir, "skills"),
  };
}

async function main() {
  const { source, output, repo, ref } = parseArgs(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  const buildScript = path.join(repoRoot, "scripts", "build-aggregate-skill.mjs");
  const verifyScript = path.join(repoRoot, "scripts", "verify-skill-package.mjs");
  const { cleanup, sourceDir } = await resolveSourceDir({ source, repo, ref });

  try {
    await runCommand(process.execPath, [buildScript, "--source", sourceDir, "--output", output]);
    await runCommand(process.execPath, [verifyScript, "--dir", output]);
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
