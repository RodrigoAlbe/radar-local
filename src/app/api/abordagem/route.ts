import { NextRequest, NextResponse } from "next/server";
import { generateApproaches } from "@/lib/approach-generator";
import { Lead } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lead = body.lead as Lead;

    if (!lead?.business || !lead?.signals || !lead?.score) {
      return NextResponse.json(
        { error: "Dados do lead incompletos" },
        { status: 400 }
      );
    }

    const approaches = generateApproaches(lead);

    return NextResponse.json({ approaches });
  } catch {
    return NextResponse.json(
      { error: "Erro ao gerar abordagem" },
      { status: 500 }
    );
  }
}
