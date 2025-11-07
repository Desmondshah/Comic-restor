/**
 * Setup validation and health check script
 */

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import dotenv from "dotenv";

// Load environment
dotenv.config();

console.log(chalk.bold.blue("\n🔧 Comic Restoration Pipeline - Setup Check\n"));
console.log(chalk.gray("━".repeat(50)));

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function check(name, condition, failMessage = "", warnOnly = false) {
  if (condition) {
    console.log(chalk.green("✓"), name);
    checks.passed++;
    return true;
  } else {
    if (warnOnly) {
      console.log(chalk.yellow("⚠"), name, chalk.gray(failMessage));
      checks.warnings++;
    } else {
      console.log(chalk.red("✗"), name, chalk.gray(failMessage));
      checks.failed++;
    }
    return false;
  }
}

// Check Node.js version
const nodeVersion = process.versions.node.split('.')[0];
check(
  "Node.js version >= 18",
  parseInt(nodeVersion) >= 18,
  `(found v${process.versions.node}, need v18+)`
);

// Check dependencies
const deps = [
  "replicate",
  "sharp",
  "pdf-lib",
  "commander",
  "chalk",
  "ora",
  "p-queue",
  "dotenv"
];

console.log(chalk.gray("\nDependencies:"));
for (const dep of deps) {
  try {
    await import(dep);
    check(`  ${dep}`, true);
  } catch (e) {
    check(`  ${dep}`, false, "(run: npm install)");
  }
}

// Check environment
console.log(chalk.gray("\nEnvironment:"));
const hasToken = check(
  "REPLICATE_API_TOKEN",
  !!process.env.REPLICATE_API_TOKEN,
  "(set in .env file)"
);

if (hasToken && process.env.REPLICATE_API_TOKEN.length < 10) {
  check(
    "Token looks valid",
    false,
    "(token seems too short)",
    true
  );
}

// Check directories
console.log(chalk.gray("\nDirectory Structure:"));
const dirs = [
  "src",
  "samples",
  "output"
];

dirs.forEach(dir => {
  check(`  ${dir}/`, fs.existsSync(dir), "(will be created automatically)", true);
});

// Check core files
console.log(chalk.gray("\nCore Files:"));
const files = [
  "src/cli.js",
  "src/restore.js",
  "src/pdf-export.js",
  "src/qa-checks.js",
  "src/batch-processor.js",
  "src/config.js",
  "src/index.js",
  "package.json",
  "README.md"
];

files.forEach(file => {
  check(`  ${file}`, fs.existsSync(file), "(missing file!)");
});

// Check configuration
console.log(chalk.gray("\nConfiguration:"));
check(
  ".env file",
  fs.existsSync(".env"),
  "(copy .env.example to .env)",
  true
);

check(
  ".env.example file",
  fs.existsSync(".env.example"),
  ""
);

// Summary
console.log(chalk.gray("\n" + "━".repeat(50)));

if (checks.failed === 0) {
  console.log(chalk.green.bold("\n✓ Setup Complete!"));
  console.log(chalk.white("\nNext steps:"));
  console.log(chalk.gray("  1. Add your Replicate API token to .env"));
  console.log(chalk.gray("  2. Place comic scans in samples/"));
  console.log(chalk.gray("  3. Run: npm start -- -i samples/page01.jpg"));
  console.log(chalk.gray("\nSee QUICKSTART.md for detailed instructions.\n"));
} else {
  console.log(chalk.red.bold("\n✗ Setup Issues Found"));
  console.log(chalk.white(`\n${checks.failed} error(s), ${checks.warnings} warning(s)`));
  console.log(chalk.gray("\nRun: npm install"));
  console.log(chalk.gray("Then fix the issues listed above.\n"));
  process.exit(1);
}

if (checks.warnings > 0) {
  console.log(chalk.yellow(`⚠  ${checks.warnings} warning(s) - review above`));
}

console.log("");
