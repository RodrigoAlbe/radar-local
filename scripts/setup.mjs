import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const envTarget = path.join(projectRoot, ".env.local");
const envSources = [
  path.join(projectRoot, ".env.local.example"),
  path.join(projectRoot, ".env.example"),
];

const localDirectories = [
  path.join(projectRoot, "data"),
  path.join(projectRoot, "data", "sites"),
  path.join(projectRoot, "public", "hero-arts"),
];

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectories() {
  for (const dir of localDirectories) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function resolveEnvSource() {
  for (const source of envSources) {
    if (await pathExists(source)) {
      return source;
    }
  }

  throw new Error("Nao encontrei .env.local.example nem .env.example para iniciar o projeto.");
}

async function ensureEnvFile({ force }) {
  const envSource = await resolveEnvSource();
  const targetExists = await pathExists(envTarget);

  if (targetExists && !force) {
    return {
      created: false,
      source: envSource,
    };
  }

  await fs.copyFile(envSource, envTarget);
  return {
    created: true,
    source: envSource,
  };
}

async function main() {
  const force = process.argv.includes("--force");

  await ensureDirectories();
  const envStatus = await ensureEnvFile({ force });

  console.log("");
  console.log("Radar Local preparado para uso local.");
  console.log("");

  if (envStatus.created) {
    console.log(`- Arquivo .env.local criado a partir de ${path.basename(envStatus.source)}.`);
  } else {
    console.log("- Arquivo .env.local ja existia e foi preservado.");
  }

  console.log("- Pastas locais garantidas: data/, data/sites/ e public/hero-arts/.");
  console.log("");
  console.log("Proximos passos:");
  console.log("1. Revise .env.local se quiser ligar servicos externos.");
  console.log("2. Rode npm run dev.");
  console.log("");
  console.log("Modo local:");
  console.log("- O app abre sem Supabase e sem Google Places, com persistencia no navegador.");
  console.log("- Para busca real, configure GOOGLE_PLACES_API_KEY.");
  console.log("- Para persistencia real, configure as chaves do Supabase.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Falha desconhecida no setup.";
  console.error(message);
  process.exit(1);
});
