interface CategoryLogoProps {
  category: string;
  businessName: string;
  primaryColor: string;
  size?: number;
  className?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Oficina mecânica":
    "M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66a.5.5 0 0 0-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.25.42.49.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.98l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64L19.43 12.97z",
  "Autoelétrica":
    "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  "Assistência técnica":
    "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  "Pet shop":
    "M4.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 12c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z",
  "Restaurante":
    "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
  "Lanchonete":
    "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
  "Padaria":
    "M12 6c-2.76 0-5 1.12-5 2.5S9.24 11 12 11s5-1.12 5-2.5S14.76 6 12 6zM7 12v7c0 1.66 2.24 3 5 3s5-1.34 5-3v-7c-1.2.85-3 1.5-5 1.5S8.2 12.85 7 12zM12 2C8.69 2 6 3.57 6 5.5S8.69 9 12 9s6-1.57 6-3.5S15.31 2 12 2z",
  "Salão de beleza":
    "M7 5a3 3 0 0 1 3-3c1.31 0 2.42.83 2.83 2H10v2h2.83A3.001 3.001 0 0 1 7 5zm9 0a3 3 0 0 1-2.83 2H16v-2h-2.83A3.001 3.001 0 0 1 19 5a3 3 0 0 1-3 0zM12 10c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4zm0 10l-1-3h2l-1 3z",
  "Barbearia":
    "M20 7l-2-4H6L4 7m16 0H4m16 0v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7m5 4v4m6-4v4",
  "Academia":
    "M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z",
  "Clínica odontológica":
    "M12 2C9.24 2 7 4.24 7 7c0 2.85 2.92 7.21 5 9.88 2.12-2.69 5-7 5-9.88 0-2.76-2.24-5-5-5zm0 7.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",
  "Clínica veterinária":
    "M4.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 12c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z",
  "Vidraçaria":
    "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z",
  "Serralheria":
    "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  "Lavanderia":
    "M18 2.01L6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-1.99zM12 20a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm-1-7.47V8.35a5.03 5.03 0 0 0-3.54 3.54L11 12.53zm2 0l3.54-.64A5.03 5.03 0 0 0 13 8.35v4.18zM7 4h2v2H7V4zm4 0h2v2h-2V4z",
  "Floricultura":
    "M12 22a8 8 0 0 0 3-15.39V3a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3.61A8 8 0 0 0 12 22zm0-14a6 6 0 1 1 0 12 6 6 0 0 1 0-12z",
  "Loja de roupas":
    "M16 3h-2c0-1.65-1.35-3-3-3S8 1.35 8 3H6L2 7v2h20V7l-6-4zm-5 0c.55 0 1 .45 1 1h-2c0-.55.45-1 1-1zM2 11v11h20V11H2zm10 8a4 4 0 1 1 0-8 4 4 0 0 1 0 8z",
  "Chaveiro":
    "M12.65 10C11.83 7.67 9.61 6 7 6a6 6 0 1 0 0 12c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
  "Contabilidade":
    "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  "Imobiliária":
    "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z",
  "Escola de idiomas":
    "M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z",
  "Estúdio de tatuagem":
    "M9.37 5.51A7.35 7.35 0 0 0 9.1 7.5c0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27A7.014 7.014 0 0 1 12 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49zM12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z",
  "Ótica":
    "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  "Dedetização":
    "M10 2a2 2 0 0 1 4 0v2h4l-2 4h-2l1 3-5 7v-5H7l3-4V6H8l2-4zm0 0",
  "Limpeza":
    "M16 11h-1V3a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v8H8a5 5 0 0 0-5 5v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a5 5 0 0 0-5-5z",
  "Manutenção residencial":
    "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z",
  "Marmoraria":
    "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z",
  "Papelaria":
    "M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83a.996.996 0 0 0 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z",
  "Loja de materiais de construção":
    "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z",
  "Elétrica e hidráulica":
    "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

function normalizeCategory(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveIconPath(category: string) {
  if (CATEGORY_ICONS[category]) {
    return CATEGORY_ICONS[category];
  }

  const normalized = normalizeCategory(category);
  const aliases: Array<{ terms: string[]; icon: string }> = [
    { terms: ["assistencia tecnica", "conserto", "eletron"], icon: CATEGORY_ICONS["AssistÃªncia tÃ©cnica"] },
    { terms: ["pet", "veterin"], icon: CATEGORY_ICONS["ClÃ­nica veterinÃ¡ria"] },
    { terms: ["restaurante", "lanchonete", "padaria"], icon: CATEGORY_ICONS["Restaurante"] },
    { terms: ["barbear", "salao", "beleza"], icon: CATEGORY_ICONS["Barbearia"] },
    { terms: ["academia", "fitness"], icon: CATEGORY_ICONS["Academia"] },
    { terms: ["clinica", "odonto", "saude"], icon: CATEGORY_ICONS["ClÃ­nica odontolÃ³gica"] },
    { terms: ["mecanica", "oficina", "autoeletrica"], icon: CATEGORY_ICONS["Oficina mecÃ¢nica"] },
    { terms: ["loja", "acessorios", "roupas", "papelaria"], icon: CATEGORY_ICONS["Loja de roupas"] },
    { terms: ["casa", "construcao", "residencial"], icon: CATEGORY_ICONS["ManutenÃ§Ã£o residencial"] },
  ];

  const matched = aliases.find((item) =>
    item.terms.some((term) => normalized.includes(term)),
  );

  return matched?.icon ?? null;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const lr = Math.min(255, r + (255 - r) * amount);
  const lg = Math.min(255, g + (255 - g) * amount);
  const lb = Math.min(255, b + (255 - b) * amount);
  return `rgb(${Math.round(lr)},${Math.round(lg)},${Math.round(lb)})`;
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`;
}

export default function CategoryLogo({ category, businessName, primaryColor, size = 48, className = "" }: CategoryLogoProps) {
  const iconPath = resolveIconPath(category);
  const initial = businessName.charAt(0).toUpperCase();
  const id = `logo-${size}-${initial}`;
  const r = size * 0.24;
  const iconScale = size * 0.55 / 24;
  const iconOffset = (size - 24 * iconScale) / 2;
  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={lighten(primaryColor, 0.1)} />
            <stop offset="100%" stopColor={darken(primaryColor, 0.25)} />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2={size} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="black" floodOpacity="0.3" />
          </filter>
        </defs>

        <rect x="0" y="0" width={size} height={size} rx={r} fill={`url(#${id}-bg)`} />
        <rect x="0" y="0" width={size} height={size} rx={r} fill={`url(#${id}-shine)`} />
        {iconPath ? (
          <g
            transform={`translate(${iconOffset}, ${iconOffset}) scale(${iconScale})`}
            filter={`url(#${id}-shadow)`}
          >
            <path d={iconPath} fill="white" />
          </g>
        ) : (
          <text
            x="50%"
            y="54%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={size * 0.42}
            fontWeight="700"
            filter={`url(#${id}-shadow)`}
          >
            {initial}
          </text>
        )}
      </svg>
    </div>
  );
}
