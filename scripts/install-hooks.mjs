import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import husky from "husky";

function getHooksPath() {
  try {
    return execFileSync(
      "git",
      ["config", "--path", "--get", "core.hooksPath"],
      {
        encoding: "utf8",
      },
    ).trim();
  } catch (error) {
    if (error.status !== 1) throw error;
    return "";
  }
}

function getDefaultHooksPath() {
  const directory = execFileSync("git", ["rev-parse", "--git-path", "hooks"], {
    encoding: "utf8",
  }).trim();

  if (!existsSync(directory)) return "";
  return readdirSync(directory).some((name) => !name.endsWith(".sample"))
    ? directory
    : "";
}

const hooksPath = getHooksPath();
const existingHooksPath = hooksPath || getDefaultHooksPath();
if (
  !existingHooksPath ||
  path.resolve(existingHooksPath) === path.resolve(".husky/_")
) {
  const result = husky();
  if (result && process.env.HUSKY !== "0") throw new Error(result);
} else if (/(^|[\\/])vault-radar[\\/]hooks$/.test(hooksPath)) {
  console.log("Vault Radar runs the executable .husky/pre-commit hook.");
} else {
  console.error(
    `Keeping the existing Git hook path (${existingHooksPath}). Configure it to run .husky/pre-commit, or run yarn check manually.`,
  );
  process.exitCode = 1;
}
