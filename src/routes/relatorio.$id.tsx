import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Loader2, Save, Settings2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Report } from "@/lib/types";
import { getReport, upsertReport } from "@/lib/storage";
import { fileToOptimizedDataUrl } from "@/lib/image";
import { generateReportPdf } from "@/lib/pdf";
import { PhotoGrid } from "@/components/PhotoGrid";
import { SettingsForm } from "@/components/SettingsForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/relatorio/$id")({
  head: () => ({
    meta: [
      { title: "Editor de Relatório Fotográfico | ObraFoto" },
      {
        name: "description",
        content:
          "Edite os dados da obra, organize as fotos com arrastar e soltar e gere o PDF A4 do relatório.",
      },
      { property: "og:title", content: "Editor de Relatório Fotográfico | ObraFoto" },
      {
        property: "og:description",
        content: "Organize fotos, legendas e gere o PDF do relatório da obra.",
      },
    ],
  }),
  component: Editor,
});

function Editor() {
  const { id } = Route.useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      setReport((await getReport(id)) ?? null);
      setLoaded(true);
    })();
  }, [id]);

  const update = (patch: Partial<Report>) =>
    setReport((prev) => (prev ? { ...prev, ...patch } : prev));

  if (!loaded) return null;

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-medium text-foreground">Relatório não encontrado</p>
        <Button asChild>
          <Link to="/">Voltar ao painel</Link>
        </Button>
      </div>
    );
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const added = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: crypto.randomUUID(),
          dataUrl: await fileToOptimizedDataUrl(file),
          caption: "",
        })),
      );
      setReport((prev) => (prev ? { ...prev, photos: [...prev.photos, ...added] } : prev));
      toast.success(`${added.length} foto(s) adicionada(s)`);
    } catch {
      toast.error("Não foi possível carregar as fotos");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    try {
      await upsertReport(report);
      toast.success("Relatório salvo");
    } catch {
      toast.error("Erro ao salvar relatório.");
    }
  };

  const handlePdf = async () => {
    setBusy(true);
    try {
      await upsertReport(report);
      await generateReportPdf(report);
      toast.success("PDF gerado");
    } catch {
      toast.error("Falha ao gerar o PDF");
    } finally {
      setBusy(false);
    }
  };

  const pages = Math.max(1, Math.ceil(report.photos.length / report.settings.photosPerPage));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Voltar">
              <Link to="/">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <p className="line-clamp-1 text-sm font-semibold text-foreground">
                {report.obra || "Relatório sem título"}
              </p>
              <p className="text-xs text-muted-foreground">
                {report.photos.length} foto(s) · {pages} página(s)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={busy}>
              <Upload className="size-4" /> Adicionar fotos
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="size-4" /> Salvar
            </Button>
            <Button size="sm" onClick={handlePdf} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Gerar PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit space-y-5 rounded-xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Informações da obra</h2>
            <p className="text-xs text-muted-foreground">Aparecem no cabeçalho do PDF.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obra">Nome da obra</Label>
            <Input
              id="obra"
              value={report.obra}
              placeholder="Ex.: Revitalização da Praça Central"
              onChange={(e) => update({ obra: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={report.cidade}
              placeholder="Ex.: Belo Horizonte"
              onChange={(e) => update({ cidade: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente (opcional)</Label>
            <Input
              id="cliente"
              value={report.cliente}
              onChange={(e) => update({ cliente: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contrato">Contrato (opcional)</Label>
            <Input
              id="contrato"
              value={report.contrato}
              onChange={(e) => update({ contrato: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={report.data}
              onChange={(e) => update({ data: e.target.value })}
            />
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Settings2 className="size-4" /> Configurações do PDF
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurações do relatório</DialogTitle>
                <DialogDescription>
                  Logo, nome da empresa, título e fotos por página.
                </DialogDescription>
              </DialogHeader>
              <SettingsForm
                settings={report.settings}
                onChange={(settings) => update({ settings })}
              />
            </DialogContent>
          </Dialog>
        </aside>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Fotos do relatório</h2>
              <p className="text-xs text-muted-foreground">
                Arraste as miniaturas para reordenar — a numeração é atualizada automaticamente.
              </p>
            </div>
          </div>
          <PhotoGrid photos={report.photos} onChange={(photos) => update({ photos })} />
        </section>
      </main>
    </div>
  );
}
