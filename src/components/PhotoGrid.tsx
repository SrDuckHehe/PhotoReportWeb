import { useRef, useState } from "react";
import { GripVertical, Trash2, ImageOff } from "lucide-react";
import type { Photo } from "@/lib/types";
import { photoLabel } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoGridProps {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

export function PhotoGrid({ photos, onChange }: PhotoGridProps) {
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
        <ImageOff className="size-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">Nenhuma foto adicionada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Use o botão “Adicionar fotos” para começar o relatório.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          draggable
          onDragStart={() => {
            dragIndex.current = index;
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIndex(index);
          }}
          onDragLeave={() => setOverIndex((v) => (v === index ? null : v))}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex.current !== null) move(dragIndex.current, index);
            dragIndex.current = null;
            setOverIndex(null);
          }}
          onDragEnd={() => {
            dragIndex.current = null;
            setOverIndex(null);
          }}
          className={cn(
            "group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition",
            overIndex === index && "border-primary ring-2 ring-primary/30",
          )}
        >
          <div className="relative aspect-4/3 bg-muted">
            <img
              src={photo.dataUrl}
              alt={photo.caption || photoLabel(index)}
              className="size-full object-cover"
              loading="lazy"
            />
            <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-[11px] font-semibold tracking-wide text-primary-foreground">
              {photoLabel(index)}
            </span>
            <div className="absolute right-2 top-2 flex gap-1">
              <span className="flex size-8 cursor-grab items-center justify-center rounded-md bg-card/90 text-muted-foreground shadow-soft active:cursor-grabbing">
                <GripVertical className="size-4" />
              </span>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="size-8 bg-card/90 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onChange(photos.filter((p) => p.id !== photo.id))}
                aria-label={`Excluir ${photoLabel(index)}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <div className="p-3">
            <Input
              value={photo.caption}
              placeholder="Legenda da foto"
              onChange={(e) =>
                onChange(
                  photos.map((p) =>
                    p.id === photo.id ? { ...p, caption: e.target.value } : p,
                  ),
                )
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
