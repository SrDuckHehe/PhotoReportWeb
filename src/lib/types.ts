export interface Photo {
  id: string;
  dataUrl: string;
  caption: string;
}

export interface ReportSettings {
  companyName: string;
  companyLogo: string | null;
  reportTitle: string;
  photosPerPage: 4 | 6 | 8;
  themeColor: string;
}

export interface Report {
  id: string;
  obra: string;
  cidade: string;
  cliente: string;
  contrato: string;
  data: string;
  photos: Photo[];
  settings: ReportSettings;
  createdAt: string;
  updatedAt: string;
}

export const themePresets = [
  { name: "Azul", value: "#1d4ed8" },
  { name: "Verde", value: "#15803d" },
  { name: "Grafite", value: "#334155" },
  { name: "Laranja", value: "#c2410c" },
  { name: "Vermelho", value: "#b91c1c" },
  { name: "Roxo", value: "#6d28d9" },
  { name: "Teal", value: "#0f766e" },
  { name: "Marrom", value: "#78350f" },
] as const;

export const defaultSettings: ReportSettings = {
  companyName: "SUA EMPRESA LTDA",
  companyLogo: null,
  reportTitle: "RELATÓRIO FOTOGRÁFICO",
  photosPerPage: 6,
  themeColor: "#1d4ed8",
};

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num) || full.length !== 6) return [29, 78, 216];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function mixWithWhite(hex: string, amount: number): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return [mix(r), mix(g), mix(b)];
}


export function createEmptyReport(): Report {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    obra: "",
    cidade: "",
    cliente: "",
    contrato: "",
    data: now.slice(0, 10),
    photos: [],
    settings: { ...defaultSettings },
    createdAt: now,
    updatedAt: now,
  };
}

export function photoLabel(index: number) {
  return `FOTO ${String(index + 1).padStart(3, "0")}`;
}
