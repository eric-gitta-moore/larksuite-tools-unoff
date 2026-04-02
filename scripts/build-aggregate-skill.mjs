#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    output: path.resolve("skills"),
    source: "",
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

    if (current === "--help" || current === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!args.source) {
    throw new Error("Missing required argument: --source <raw-skills-dir>");
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/build-aggregate-skill.mjs --source /path/to/raw/skills [--output ./skills]

Description:
  Build the publishable larksuite-tools package from an external raw skills directory.
  The generated package keeps only one installable SKILL.md at the output root and
  rewrites mirrored child skill entry files from SKILL.md to GUIDE.md.`);
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function collectSkillDirs(sourceDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const skillDirs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (!entry.name.startsWith("lark-")) {
      continue;
    }

    const skillDir = path.join(sourceDir, entry.name);
    const sourceSkillPath = path.join(skillDir, "SKILL.md");

    if (await exists(sourceSkillPath)) {
      skillDirs.push(skillDir);
    }
  }

  return skillDirs.sort();
}

async function copyDir(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
      continue;
    }

    await fs.copyFile(sourcePath, targetPath);
  }
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

function rewriteMarkdownLinkTargets(content) {
  // Only rewrite markdown link targets so we don't corrupt prose that discusses
  // the literal `SKILL.md` filename as a concept.
  return content.replace(/\]\(([^)]+)\)/g, (fullMatch, rawTarget) => {
    if (/^(https?:|mailto:|#)/i.test(rawTarget)) {
      return fullMatch;
    }

    if (!rawTarget.includes("SKILL.md")) {
      return fullMatch;
    }

    const nextTarget = rawTarget.replace(/SKILL\.md(?=($|[#?]))/g, "GUIDE.md");
    return `](${nextTarget})`;
  });
}

async function rewriteMarkdownFiles(rootDir) {
  const filePaths = await walkFiles(rootDir);

  for (const filePath of filePaths) {
    if (!filePath.endsWith(".md")) {
      continue;
    }

    const current = await fs.readFile(filePath, "utf8");
    const next = rewriteMarkdownLinkTargets(current);

    if (next !== current) {
      await fs.writeFile(filePath, next, "utf8");
    }
  }
}

async function applyKnownDocFixes(outputDir) {
  // Upstream docs currently contain a small number of broken relative links.
  // We repair them during build so the published aggregate package remains
  // self-consistent without requiring manual cleanup after every sync.
  const replacements = [
    {
      filePath: path.join(
        outputDir,
        "references",
        "lark-base",
        "references",
        "lark-base-workflow-list.md"
      ),
      from: "[lark-base-workflow-enable-disable](lark-base-workflow-enable-disable.md) — 启用/禁用工作流",
      to: [
        "[lark-base-workflow-enable](lark-base-workflow-enable.md) — 启用工作流",
        "[lark-base-workflow-disable](lark-base-workflow-disable.md) — 禁用工作流",
      ].join("\n"),
    },
    {
      filePath: path.join(outputDir, "references", "lark-whiteboard", "references", "connectors.md"),
      from: "[organization.md](scenes/organization.md)",
      to: "[organization.md](../scenes/organization.md)",
    },
  ];

  for (const replacement of replacements) {
    const current = await fs.readFile(replacement.filePath, "utf8");
    const next = current.replace(replacement.from, replacement.to);

    if (next !== current) {
      await fs.writeFile(replacement.filePath, next, "utf8");
    }
  }
}

async function main() {
  const { source, output } = parseArgs(process.argv.slice(2));
  const referencesDir = path.join(output, "references");

  if (!(await exists(source))) {
    throw new Error(`Source directory does not exist: ${source}`);
  }

  const skillDirs = await collectSkillDirs(source);
  if (skillDirs.length === 0) {
    throw new Error(`No raw lark-* skills with SKILL.md were found under: ${source}`);
  }

  await fs.mkdir(output, { recursive: true });
  await fs.rm(referencesDir, { recursive: true, force: true });
  await fs.mkdir(referencesDir, { recursive: true });

  for (const skillDir of skillDirs) {
    const skillName = path.basename(skillDir);
    const targetDir = path.join(referencesDir, skillName);

    await copyDir(skillDir, targetDir);

    const guidePath = path.join(targetDir, "GUIDE.md");
    await fs.rename(path.join(targetDir, "SKILL.md"), guidePath);
  }

  // Rewrite cross-links after the copy so all mirrored child entry files point
  // at GUIDE.md instead of recreating nested installable skills.
  await rewriteMarkdownFiles(output);
  await applyKnownDocFixes(output);

  console.log(`Built ${skillDirs.length} mirrored subskills into ${output}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
