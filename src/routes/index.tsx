import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText, Plus, Trash2, Images, MapPin, Settings2 } from "lucide-react";
import type { Report } from "@/lib/types";
import { createEmptyReport } from "@/lib/types";
import {
  deleteReport,
  loadGlobalSettings,
  loadReports,
  saveGlobalSettings,
  upsertReport,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingsForm } from "@/components/SettingsForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Relatórios Fotográficos de Obras | ObraFoto" },
      {
        name: "description",
        content:
          "Crie relatórios fotográficos de obras em PDF A4: organize fotos, legendas numeradas e cabeçalho personalizado.",
      },
      { property: "og:title", content: "Relatórios Fotográficos de Obras | ObraFoto" },
      {
        property: "og:description",
        content: "Crie relatórios fotográficos de obras em PDF A4: organize fotos, legendas numeradas e cabeçalho personalizado.",
      },
    ],
  }),
  component: Dashboard,
});

function formatDate(value: string) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return d && m && y ? `${d}/${m}/${y}` : value;
}

function Dashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState(loadGlobalSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setReports(loadReports());
    setSettings(loadGlobalSettings());
  }, []);

  const handleNew = () => {
    const report = { ...createEmptyReport(), settings: loadGlobalSettings() };
    upsertReport(report);
    navigate({ to: "/relatorio/$id", params: { id: report.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">ObraFoto</p>
              <p className="text-xs text-muted-foreground">Relatórios fotográficos de obras</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="size-4" /> Configurações
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurações padrão</DialogTitle>
                  <DialogDescription>
                    Usadas ao criar novos relatórios.
                  </DialogDescription>
                </DialogHeader>
                <SettingsForm
                  settings={settings}
                  onChange={(s) => {
                    setSettings(s);
                    saveGlobalSettings(s);
                  }}
                />
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={handleNew}>
              <Plus className="size-4" /> Novo Relatório
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meus relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {reports.length === 0
            ? "Comece criando seu primeiro relatório fotográfico."
            : `${reports.length} relatório(s) salvos neste navegador.`}
        </p>

        {reports.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <Images className="size-9 text-muted-foreground" />
            <p className="mt-4 text-base font-medium text-foreground">Nenhum relatório ainda</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crie um relatório, envie as fotos da obra e gere o PDF em formato A4.
            </p>
            <Button className="mt-6" onClick={handleNew}>
              <Plus className="size-4" /> Novo Relatório
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition hover:shadow-panel"
              >
                <Link
                  to="/relatorio/$id"
                  params={{ id: report.id }}
                  className="block aspect-16/9 bg-muted"
                >
                  {report.photos[0] ? (
                    <img
                      src={report.photos[0].dataUrl}
                      alt={report.obra || "Capa do relatório"}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-sm text-muted-foreground">
                      Sem fotos
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Link to="/relatorio/$id" params={{ id: report.id }}>
                    <p className="line-clamp-1 font-medium text-foreground">
                      {report.obra || "Relatório sem título"}
                    </p>
                  </Link>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {report.cidade || "Cidade não informada"}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span>
                      {formatDate(report.data)} · {report.photos.length} foto(s)
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir relatório"
                      onClick={() => {
                        deleteReport(report.id);
                        setReports(loadReports());
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
