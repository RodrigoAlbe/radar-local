"use client";

import { useState } from "react";
import { ApproachVariant } from "@/lib/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Copy, Check, MessageCircle } from "lucide-react";

interface ApproachMessageProps {
  variants: ApproachVariant[];
  phone?: string;
  whatsappDetected?: boolean;
}

function stripDemoLinkPlaceholder(message: string): string {
  return message
    .replace(/\n?\{LINK_SITE_DEMO\}\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ApproachMessage({
  variants,
  phone,
  whatsappDetected,
}: ApproachMessageProps) {
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);

  const current = variants[selected];
  const safeResolvedMessage = stripDemoLinkPlaceholder(current.message);
  const canWhatsApp = !!(phone && whatsappDetected);
  const whatsAppUrl = canWhatsApp
    ? buildWhatsAppUrl(phone, safeResolvedMessage)
    : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(safeResolvedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = safeResolvedMessage;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3" aria-label="Mensagem sugerida para abordagem">
      <div
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
        role="group"
        aria-label="Variantes de mensagem"
      >
        {variants.map((v, i) => (
          <button
            key={v.type}
            type="button"
            onClick={() => setSelected(i)}
            aria-pressed={i === selected}
            aria-label={`Selecionar variante ${v.label}`}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
              i === selected
                ? "bg-primary text-white border-primary"
                : "bg-background text-muted border-border hover:border-primary"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="bg-background rounded-xl p-4 border border-border relative">
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pr-10">
          {safeResolvedMessage}
        </p>

        <div className="absolute top-3 right-3 flex gap-1">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copiar mensagem recomendada"
            className={`p-2 rounded-lg transition-colors ${
              copied
                ? "bg-green-100 text-green-600"
                : "bg-white text-muted hover:text-primary hover:bg-blue-50"
            }`}
            title="Copiar mensagem"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {whatsAppUrl && (
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Enviar via WhatsApp
        </a>
      )}

      <p className="text-[11px] text-muted">
        Mensagem gerada com base nos sinais detectados. Revise antes de enviar.
      </p>
    </div>
  );
}
