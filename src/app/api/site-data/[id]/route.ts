import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data", "sites");
const SHORT_URLS_PATH = path.join(process.cwd(), "data", "short-urls.json");

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

function generateShortCode(): string {
  return crypto.randomBytes(4).toString("base64url").slice(0, 6);
}

async function loadShortUrls(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(SHORT_URLS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveShortUrls(map: Record<string, string>): Promise<void> {
  await fs.writeFile(SHORT_URLS_PATH, JSON.stringify(map, null, 2), "utf-8");
}

async function getOrCreateShortCode(fullId: string): Promise<string> {
  const map = await loadShortUrls();

  const existing = Object.entries(map).find(([, v]) => v === fullId);
  if (existing) return existing[0];

  let code = generateShortCode();
  while (map[code]) {
    code = generateShortCode();
  }

  map[code] = fullId;
  await saveShortUrls(map);
  return code;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const safeId = sanitizeId(id);
  if (!safeId) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const filePath = path.join(DATA_DIR, `${safeId}.json`);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const lead = JSON.parse(raw);
    const shortCode = await getOrCreateShortCode(safeId);
    return NextResponse.json({ lead, found: true, shortCode });
  } catch {
    return NextResponse.json({ lead: null, found: false }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const safeId = sanitizeId(id);
  if (!safeId) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { lead } = body;

    if (!lead?.business?.id) {
      return NextResponse.json({ error: "Lead inválido" }, { status: 400 });
    }

    await fs.mkdir(DATA_DIR, { recursive: true });

    const filePath = path.join(DATA_DIR, `${safeId}.json`);
    await fs.writeFile(filePath, JSON.stringify(lead, null, 2), "utf-8");

    const shortCode = await getOrCreateShortCode(safeId);

    return NextResponse.json({ ok: true, id: safeId, shortCode });
  } catch (error) {
    console.error("Erro ao salvar site-data:", error);
    return NextResponse.json({ error: "Erro ao salvar dados" }, { status: 500 });
  }
}
