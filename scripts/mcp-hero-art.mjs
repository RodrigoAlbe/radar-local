import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envFile = path.join(projectRoot, ".env.local");
const heroArtDir = path.join(projectRoot, "public", "hero-arts");

function parseEnv(content) {
  const values = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) continue;
    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function getEnvValue(key) {
  if (process.env[key]) {
    return process.env[key];
  }
  try {
    const envContent = await fs.readFile(envFile, "utf8");
    const parsed = parseEnv(envContent);
    return parsed[key] ?? null;
  } catch {
    return null;
  }
}

async function getOpenAiKey() {
  return getEnvValue("OPENAI_API_KEY");
}

async function getGeminiKey() {
  return getEnvValue("GEMINI_API_KEY");
}

function normalizeCategory(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value) {
  return normalizeCategory(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryDirection(category) {
  const normalized = normalizeCategory(category);
  if (
    normalized.includes("assistencia tecnica") ||
    normalized.includes("conserto") ||
    normalized.includes("oficina") ||
    normalized.includes("autoeletrica") ||
    normalized.includes("mecanica")
  ) {
    return {
      mood: "editorial de servico local e bancada tecnica",
      subjects:
        "tecnico trabalhando em bancada de eletronicos, smartphone aberto, notebook, ferramentas de precisao, cabos, componentes e detalhes reais de manutencao",
      palette: "azuis suaves, metal escovado, bege quente e cinza claro",
    };
  }
  if (normalized.includes("pet") || normalized.includes("veterin")) {
    return {
      mood: "editorial acolhedor de pet shop de bairro",
      subjects: "pet feliz, elementos de banho e cuidado, ambiente claro e amigavel",
      palette: "verde sutil, creme quente, tons naturais e madeira clara",
    };
  }
  if (
    normalized.includes("restaurante") ||
    normalized.includes("lanchonete") ||
    normalized.includes("padaria")
  ) {
    return {
      mood: "fotografia editorial de gastronomia local",
      subjects: "balcao, pratos, paes ou refeicoes, clima convidativo e artesanal",
      palette: "tons de manteiga, terracota, creme e dourado",
    };
  }
  if (
    normalized.includes("barbear") ||
    normalized.includes("salao") ||
    normalized.includes("beleza")
  ) {
    return {
      mood: "editorial de beleza contemporanea e calor humano",
      subjects: "cadeira, espelho, tesouras, bancada elegante e detalhes de atendimento",
      palette: "rosa queimado, areia, bege e madeira suave",
    };
  }
  if (
    normalized.includes("clinica") ||
    normalized.includes("odontolog") ||
    normalized.includes("saude")
  ) {
    return {
      mood: "editorial de clinica local com confianca e calma",
      subjects: "recepcao limpa, detalhes de consulta, materiais discretos e ambiente profissional",
      palette: "verde agua, creme, cinza claro e branco quente",
    };
  }
  if (
    normalized.includes("loja") ||
    normalized.includes("papelaria") ||
    normalized.includes("roupas") ||
    normalized.includes("acessorios")
  ) {
    return {
      mood: "editorial de vitrine e comercio local moderno",
      subjects: "produtos bem dispostos, sacolas, araras ou prateleiras e clima de bairro",
      palette: "caramelo claro, bege, marfim e cinzas quentes",
    };
  }

  return {
    mood: "editorial de negocio local moderno e acolhedor",
    subjects: "fachada, vitrine, atendimento e elementos do bairro",
    palette: "tons quentes, creme, areia e acentos suaves",
  };
}

function buildPrompt({ category, businessName, primaryColor, style }) {
  const direction = getCategoryDirection(category);
  return [
    "Use case: photorealistic-natural",
    "Asset type: landing page hero image",
    `Primary request: generate a portrait hero art for a local Brazilian business landing page for "${businessName}" in category "${category}"`,
    `Style/medium: ${style ?? "high-end editorial lifestyle photography mixed with polished commercial composition"}`,
    "Composition/framing: vertical portrait 4:5 composition, one single cohesive image, premium landing page hero, strong focal subject, soft depth, clean negative space around the subject, no UI cards, no dashboard blocks, no mock browser frames, no app interface",
    `Scene/backdrop: ${direction.mood}, ${direction.subjects}`,
    "Lighting/mood: natural warm daylight, premium, soft shadows, trustworthy, welcoming, modern local business",
    `Color palette: ${direction.palette}, lightly harmonized with ${primaryColor ?? "#924a28"}`,
    "Materials/textures: paper, wood, glass, metal, fabric, subtle texture, realistic surfaces",
    "Constraints: no text, no letters, no labels, no logos, no watermark, no collage, no split panels, no icon-only artwork, no generic abstract placeholders",
    "Avoid: UI mockups, charts, screenshots, floating cards, interface widgets, app icons, star icons, empty white panels, fashion boutique, clothing store, apparel racks, shopping bags, mannequins",
  ].join("\n");
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function resolveOutputPath(outputName, overwrite = false) {
  await ensureDir(heroArtDir);

  const safeBase = slugify(outputName) || "hero-art";
  const basePath = path.join(heroArtDir, `${safeBase}.png`);

  if (overwrite) {
    return basePath;
  }

  try {
    await fs.access(basePath);
  } catch {
    return basePath;
  }

  for (let i = 2; i < 100; i += 1) {
    const versioned = path.join(heroArtDir, `${safeBase}-v${i}.png`);
    try {
      await fs.access(versioned);
    } catch {
      return versioned;
    }
  }

  throw new Error("Nao foi possivel encontrar um nome livre para salvar a hero art.");
}

async function generateImageWithOpenAI({
  prompt,
  apiKey,
}) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      quality: "medium",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI Images API falhou: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const encoded = data?.data?.[0]?.b64_json;

  if (!encoded) {
    throw new Error("A API nao retornou imagem em base64.");
  }

  return Buffer.from(encoded, "base64");
}

async function generateImageWithGemini({
  prompt,
  apiKey,
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Images API falhou: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const partWithImage = data?.candidates?.[0]?.content?.parts?.find(
    (part) => part?.inlineData?.data,
  );
  const encoded = partWithImage?.inlineData?.data;

  if (!encoded) {
    throw new Error("A API do Gemini nao retornou imagem em base64.");
  }

  return Buffer.from(encoded, "base64");
}

async function generateHeroArt(args) {
  const category = String(args.category ?? "").trim();
  const businessName = String(args.businessName ?? "").trim();
  const outputName =
    String(args.outputName ?? `${slugify(businessName || category || "hero-art")}`).trim();
  const primaryColor = String(args.primaryColor ?? "#924a28").trim();
  const overwrite = Boolean(args.overwrite);
  const style = typeof args.style === "string" ? args.style.trim() : undefined;
  const requestedProvider =
    typeof args.provider === "string" ? args.provider.trim().toLowerCase() : "auto";

  if (!category) {
    throw new Error("O campo 'category' e obrigatorio.");
  }

  if (!businessName) {
    throw new Error("O campo 'businessName' e obrigatorio.");
  }

  const prompt = buildPrompt({
    category,
    businessName,
    primaryColor,
    style,
  });

  const outputPath = await resolveOutputPath(outputName, overwrite);
  const geminiKey = await getGeminiKey();
  const openAiKey = await getOpenAiKey();
  const providerOrder =
    requestedProvider === "gemini"
      ? ["gemini"]
      : requestedProvider === "openai"
        ? ["openai"]
        : geminiKey
          ? ["gemini", "openai"]
          : ["openai", "gemini"];

  let imageBuffer = null;
  let providerUsed = null;
  const errors = [];

  for (const provider of providerOrder) {
    try {
      if (provider === "gemini") {
        if (!geminiKey) {
          throw new Error("GEMINI_API_KEY nao encontrada.");
        }
        imageBuffer = await generateImageWithGemini({ prompt, apiKey: geminiKey });
        providerUsed = "gemini";
        break;
      }

      if (provider === "openai") {
        if (!openAiKey) {
          throw new Error("OPENAI_API_KEY nao encontrada.");
        }
        imageBuffer = await generateImageWithOpenAI({ prompt, apiKey: openAiKey });
        providerUsed = "openai";
        break;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido de provider.";
      errors.push(`${provider}: ${message}`);
    }
  }

  if (!imageBuffer || !providerUsed) {
    throw new Error(
      `Nao foi possivel gerar a hero art. Tentativas: ${errors.join(" | ")}`,
    );
  }

  await fs.writeFile(outputPath, imageBuffer);

  return {
    outputPath,
    relativePath: path.relative(projectRoot, outputPath).replace(/\\/g, "/"),
    prompt,
    providerUsed,
  };
}

async function generateHeroArtBatch(args) {
  const items = Array.isArray(args.items) ? args.items : [];
  if (items.length === 0) {
    throw new Error("Envie pelo menos um item em 'items'.");
  }

  const results = [];
  for (const item of items) {
    const result = await generateHeroArt(item);
    results.push(result);
  }
  return results;
}

function writeMessage(message) {
  const json = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}

function createResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function createError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleRequest(request) {
  const { id, method, params } = request;

  if (method === "initialize") {
    return createResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "hero-art-openai",
        version: "0.1.0",
      },
    });
  }

  if (method === "notifications/initialized") {
    return null;
  }

  if (method === "ping") {
    return createResponse(id, {});
  }

  if (method === "tools/list") {
    return createResponse(id, {
      tools: [
        {
          name: "generate_hero_art",
          description:
            "Gera uma hero art raster vertical para LPs e salva em public/hero-arts.",
          inputSchema: {
            type: "object",
            properties: {
              category: { type: "string" },
              businessName: { type: "string" },
              primaryColor: { type: "string" },
              outputName: { type: "string" },
              overwrite: { type: "boolean" },
              style: { type: "string" },
              provider: { type: "string", enum: ["auto", "gemini", "openai"] },
            },
            required: ["category", "businessName"],
          },
        },
        {
          name: "generate_hero_art_batch",
          description:
            "Gera varias hero arts em lote para categorias diferentes.",
          inputSchema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    businessName: { type: "string" },
                    primaryColor: { type: "string" },
                    outputName: { type: "string" },
                    overwrite: { type: "boolean" },
                    style: { type: "string" },
                    provider: { type: "string", enum: ["auto", "gemini", "openai"] },
                  },
                  required: ["category", "businessName"],
                },
              },
            },
            required: ["items"],
          },
        },
      ],
    });
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments ?? {};

    try {
      if (toolName === "generate_hero_art") {
        const result = await generateHeroArt(args);
        return createResponse(id, {
          content: [
            {
              type: "text",
              text: `Hero art gerada em ${result.relativePath}`,
            },
          ],
          structuredContent: result,
        });
      }

      if (toolName === "generate_hero_art_batch") {
        const results = await generateHeroArtBatch(args);
        return createResponse(id, {
          content: [
            {
              type: "text",
              text: `Hero arts geradas: ${results.map((item) => item.relativePath).join(", ")}`,
            },
          ],
          structuredContent: { results },
        });
      }

      return createError(id, -32601, `Ferramenta desconhecida: ${toolName}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido ao executar ferramenta.";
      return createError(id, -32000, message);
    }
  }

  return createError(id, -32601, `Metodo nao suportado: ${method}`);
}

let buffer = Buffer.alloc(0);

process.stdin.on("data", async (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (true) {
    const separatorIndex = buffer.indexOf("\r\n\r\n");
    if (separatorIndex === -1) break;

    const headerBlock = buffer.slice(0, separatorIndex).toString("utf8");
    const contentLengthMatch = headerBlock.match(/Content-Length:\s*(\d+)/i);
    if (!contentLengthMatch) {
      buffer = Buffer.alloc(0);
      break;
    }

    const contentLength = Number(contentLengthMatch[1]);
    const messageStart = separatorIndex + 4;
    const messageEnd = messageStart + contentLength;

    if (buffer.length < messageEnd) break;

    const rawMessage = buffer.slice(messageStart, messageEnd).toString("utf8");
    buffer = buffer.slice(messageEnd);

    try {
      const request = JSON.parse(rawMessage);
      const response = await handleRequest(request);
      if (response) {
        writeMessage(response);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao processar mensagem MCP.";
      writeMessage(createError(null, -32700, message));
    }
  }
});

process.stdin.resume();
