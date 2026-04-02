#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const PLACEHOLDER_LINKS = new Set(["URL", "./a.png"]);

function parseArgs(argv) {
  const args = {
    dir: path.resolve("skills"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--dir") {
      args.dir = path.resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (current === "--help" || current === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/verify-skill-package.mjs [--dir ./skills]

Checks:
  1. The package contains exactly one installable SKILL.md at the root
  2. Mirrored child skills use GUIDE.md instead of nested SKILL.md
  3. Relative markdown links resolve correctly`);
}

async function walkFiles(dirPath) {
  const results = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await walkFiles(fullPath)));
      continue;
    }

    results.push(fullPath);
  }

  return results;
}

function isIgnoredLink(rawTarget) {
  return (
    !rawTarget ||
    PLACEHOLDER_LINKS.has(rawTarget) ||
    /^(https?:|mailto:|#|javascript:|data:)/i.test(rawTarget)
  );
}

async function main() {
  const { dir } = parseArgs(process.argv.slice(2));
  const failures = [];
  const allFiles = await walkFiles(dir);
  const skillFiles = allFiles.filter((filePath) => path.basename(filePath) === "SKILL.md");
  const rootSkillPath = path.join(dir, "SKILL.md");

  if (skillFiles.length !== 1 || skillFiles[0] !== rootSkillPath) {
    failures.push(
      `Expected exactly one root SKILL.md, found ${skillFiles.length}: ${skillFiles
        .map((filePath) => path.relative(dir, filePath))
        .join(", ")}`
    );
  }

  const guideFiles = allFiles.filter((filePath) => path.basename(filePath) === "GUIDE.md");
  if (guideFiles.length === 0) {
    failures.push("Expected mirrored subskills to contain GUIDE.md files, but none were found.");
  }

  const markdownFiles = allFiles.filter((filePath) => filePath.endsWith(".md"));
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const filePath of markdownFiles) {
    const content = await fs.readFile(filePath, "utf8");

    for (const match of content.matchAll(linkPattern)) {
      const rawTarget = match[1].trim();
      if (isIgnoredLink(rawTarget)) {
        continue;
      }

      const cleanTarget = rawTarget.split("#")[0].split("?")[0];
      const resolved = path.resolve(path.dirname(filePath), cleanTarget);

      try {
        await fs.access(resolved);
      } catch {
        failures.push(`${path.relative(dir, filePath)} -> ${rawTarget}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("Verification failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    `Verified ${markdownFiles.length} markdown files, ${guideFiles.length} GUIDE.md files, and one root SKILL.md in ${dir}`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
