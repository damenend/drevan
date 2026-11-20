import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";

const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "resolutions",
];

function readManifest(gitPath) {
  const manifest = JSON.parse(
    execFileSync("git", ["show", gitPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  for (const key of dependencyFields) delete manifest[key];
  return manifest;
}

try {
  const before = readManifest("HEAD:package.json");
  const staged = readManifest(":package.json");
  process.exitCode = isDeepStrictEqual(before, staged) ? 0 : 1;
} catch {
  // A new or removed manifest still warrants an audit.
  process.exitCode = 1;
}
