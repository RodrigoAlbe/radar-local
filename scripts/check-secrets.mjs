import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".sql",
  ".css",
  ".txt",
  ".cmd",
  ".example",
]);

const ignoredFiles = new Set([
  "package-lock.json",
]);

const directPatterns = [
  { name: "OpenAI API key", regex: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Generic OpenAI key", regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{20,}\b/g },
  { name: "GitHub personal token", regex: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { name: "GitHub fine-grained token", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { name: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
  { name: "JWT-like token", regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
];

const secretAssignmentPattern =
  /^\s*([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Z0-9_]*)\s*=\s*(.+?)\s*$/;

function isPlaceholderValue(value) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) return true;

  return [
    "example",
    "placeholder",
    "changeme",
    "seu-",
    "sua-",
    "your-",
    "<",
    "xxxx",
    "todo",
  ].some((marker) => normalized.includes(marker));
}

function shouldInspect(filePath) {
  if (ignoredFiles.has(filePath)) return false;

  const extension = path.extname(filePath).toLowerCase();
  return allowedExtensions.has(extension) || filePath.endsWith(".env.example") || filePath.endsWith(".env.local.example");
}

function listTrackedFiles() {
  try {
    const output = execFileSync("git", ["ls-files"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function inspectFile(filePath) {
  const absolutePath = path.join(projectRoot, filePath);
  const content = await fs.readFile(absolutePath, "utf8");
  const issues = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const pattern of directPatterns) {
      if (pattern.regex.test(line)) {
        issues.push({
          filePath,
          lineNumber: index + 1,
          name: pattern.name,
        });
      }
      pattern.regex.lastIndex = 0;
    }

    const assignmentMatch = line.match(secretAssignmentPattern);
    if (!assignmentMatch) return;

    const [, key, rawValue] = assignmentMatch;
    if (isPlaceholderValue(rawValue)) return;

    issues.push({
      filePath,
      lineNumber: index + 1,
      name: `Possible hardcoded value for ${key}`,
    });
  });

  return issues;
}

async function main() {
  const trackedFiles = listTrackedFiles().filter(shouldInspect);
  const allIssues = [];

  for (const filePath of trackedFiles) {
    const issues = await inspectFile(filePath);
    allIssues.push(...issues);
  }

  if (allIssues.length > 0) {
    console.error("");
    console.error("Possiveis segredos encontrados em arquivos rastreados:");
    for (const issue of allIssues) {
      console.error(`- ${issue.filePath}:${issue.lineNumber} -> ${issue.name}`);
    }
    console.error("");
    console.error("Revise os arquivos acima antes de publicar o repositorio.");
    process.exit(1);
  }

  console.log("Nenhum segredo aparente encontrado nos arquivos rastreados.");
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Falha desconhecida na verificacao de segredos.";
  console.error(message);
  process.exit(1);
});
