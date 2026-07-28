import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { type ReportSettings, themePresets } from "@/lib/types";
import { fileToOptimizedDataUrl } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  settings: ReportSettings;
  onChange: (settings: ReportSettings) => void;
}

export function SettingsForm({ settings, onChange }: Props) {
  const logoInput = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Logo da empresa</Label>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted">
            {settings.companyLogo ? (
              <img
                src={settings.companyLogo}
                alt="Logo da empresa"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Sem logo</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => logoInput.current?.click()}>
              <Upload className="size-4" /> Enviar logo
            </Button>
            {settings.companyLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...settings, companyLogo: null })}
              >
                <X className="size-4" /> Remover
              </Button>
            )}
          </div>
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const dataUrl = await fileToOptimizedDataUrl(file, 600, 0.9);
              onChange({ ...settings, companyLogo: dataUrl });
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Nome da empresa</Label>
        <Input
          id="companyName"
          value={settings.companyName}
          onChange={(e) => onChange({ ...settings, companyName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportTitle">Título do relatório</Label>
        <Input
          id="reportTitle"
          value={settings.reportTitle}
          onChange={(e) => onChange({ ...settings, reportTitle: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Fotos por página</Label>
        <Select
          value={String(settings.photosPerPage)}
          onValueChange={(v) =>
            onChange({ ...settings, photosPerPage: Number(v) as ReportSettings["photosPerPage"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 fotos (2 × 2)</SelectItem>
            <SelectItem value="6">6 fotos (2 × 3)</SelectItem>
            <SelectItem value="8">8 fotos (2 × 4)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Cor tema do relatório</Label>
        <div className="flex flex-wrap gap-2">
          {themePresets.map((preset) => {
            const active = settings.themeColor.toLowerCase() === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                title={preset.name}
                aria-label={`Cor ${preset.name}`}
                aria-pressed={active}
                onClick={() => onChange({ ...settings, themeColor: preset.value })}
                className={`size-8 rounded-full border-2 transition ${
                  active ? "border-foreground scale-110" : "border-border"
                }`}
                style={{ backgroundColor: preset.value }}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <input
            type="color"
            aria-label="Cor personalizada"
            value={settings.themeColor}
            onChange={(e) => onChange({ ...settings, themeColor: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
          />
          <Input
            value={settings.themeColor}
            onChange={(e) => onChange({ ...settings, themeColor: e.target.value })}
            className="w-32 font-mono"
          />
        </div>
      </div>
    </div>
  );
}

