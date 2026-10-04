const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const tag =
  process.argv.find((arg) => arg.startsWith("v")) || `v${pkg.version}`;
if (tag !== `v${pkg.version}`)
  throw new Error(`Tag ${tag} does not match package version ${pkg.version}`);
const text = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
const heading = `## [${pkg.version}] - `;
const lines = text.split("\n");
const start = lines.findIndex((line) => line.startsWith(heading));
if (
  start < 0 ||
  !/^\d{4}-\d{2}-\d{2}$/.test(lines[start].slice(heading.length))
)
  throw new Error("Dated changelog section required");
const end = lines.findIndex(
  (line, index) =>
    index > start &&
    (line.startsWith("## ") || line.startsWith("[Unreleased]:")),
);
const notes = lines
  .slice(start + 1, end < 0 ? undefined : end)
  .join("\n")
  .trim();
if (!notes) throw new Error("Non-empty changelog section required");
if (process.argv.includes("--check"))
  console.log(`Release metadata verified: ${tag}`);
else
  process.stdout.write(
    `# FocusFlow ${tag}${pkg.version.startsWith("0.") ? " (Preview)" : ""}\n\n${notes}\n\nInstall the amd64 .deb with apt. Verify SHA256SUMS before installation. See README for install, backup, upgrade and uninstall instructions.\n`,
  );
