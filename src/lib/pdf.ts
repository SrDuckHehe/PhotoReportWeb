import { jsPDF } from "jspdf";
import type { Report } from "./types";
import { hexToRgb, mixWithWhite, photoLabel } from "./types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function formatDate(value: string) {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

const GRIDS: Record<number, { cols: number; rows: number }> = {
  4: { cols: 2, rows: 2 },
  6: { cols: 2, rows: 3 },
  8: { cols: 2, rows: 4 },
};

export async function generateReportPdf(report: Report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 12;

  const { cols, rows } = GRIDS[report.settings.photosPerPage] ?? GRIDS[6];
  const perPage = cols * rows;

  const logo = report.settings.companyLogo
    ? await loadImage(report.settings.companyLogo).catch(() => null)
    : null;

  const images = await Promise.all(
    report.photos.map((p) => loadImage(p.dataUrl).catch(() => null)),
  );

  const totalPages = Math.max(1, Math.ceil(report.photos.length / perPage));

  const theme = hexToRgb(report.settings.themeColor || "#1d4ed8");
  const themeSoft = mixWithWhite(report.settings.themeColor || "#1d4ed8", 0.92);
  const themeBorder = mixWithWhite(report.settings.themeColor || "#1d4ed8", 0.65);

  const headerH = 30;
  const footerH = 12;

  const drawHeader = () => {
    doc.setFillColor(...themeSoft);
    doc.setDrawColor(...themeBorder);
    doc.roundedRect(margin, margin, pageW - margin * 2, headerH, 2, 2, "FD");
    doc.setFillColor(...theme);
    doc.rect(margin, margin, 2, headerH, "F");

    let textLeft = margin + 5;
    if (logo) {
      const boxH = headerH - 8;
      const boxW = 30;
      const ratio = Math.min(boxW / logo.width, boxH / logo.height);
      const w = logo.width * ratio;
      const h = logo.height * ratio;
      doc.addImage(logo, "PNG", margin + 4, margin + 4 + (boxH - h) / 2, w, h);
      textLeft = margin + 4 + boxW + 5;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(report.settings.companyName || "", textLeft, margin + 9);

    doc.setFontSize(13);
    doc.setTextColor(...theme);
    doc.text(report.settings.reportTitle || "", textLeft, margin + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const obraLine = [report.obra, report.cidade].filter(Boolean).join(" — ");
    doc.text(obraLine, textLeft, margin + 24);

    const right = pageW - margin - 5;
    doc.setFontSize(8);
    const meta = [
      report.cliente ? `Cliente: ${report.cliente}` : "",
      report.contrato ? `Contrato: ${report.contrato}` : "",
      report.data ? `Data: ${formatDate(report.data)}` : "",
    ].filter(Boolean);
    meta.forEach((line, i) => {
      doc.text(line, right, margin + 9 + i * 5, { align: "right" });
    });
  };

  const drawFooter = (page: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setDrawColor(...themeBorder);
    doc.line(margin, pageH - footerH, pageW - margin, pageH - footerH);
    doc.text(
      `Página ${page} de ${totalPages}`,
      pageW / 2,
      pageH - footerH + 6,
      { align: "center" },
    );
  };

  const gridTop = margin + headerH + 6;
  const gridBottom = pageH - footerH - 4;
  const gridW = pageW - margin * 2;
  const gapX = 8;
  const gapY = 6;
  const cellW = (gridW - gapX * (cols - 1)) / cols;
  const cellH = (gridBottom - gridTop - gapY * (rows - 1)) / rows;
  const captionH = 8;
  const imgBoxH = cellH - captionH;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();
    drawHeader();
    drawFooter(page + 1);

    for (let i = 0; i < perPage; i++) {
      const photoIndex = page * perPage + i;
      const photo = report.photos[photoIndex];
      if (!photo) break;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cellW + gapX);
      const y = gridTop + row * (cellH + gapY);

      doc.setDrawColor(...themeBorder);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, cellW, imgBoxH, 1.5, 1.5, "FD");

      const img = images[photoIndex];
      if (img) {
        const pad = 1.5;
        const maxW = cellW - pad * 2;
        const maxH = imgBoxH - pad * 2;
        const ratio = Math.min(maxW / img.width, maxH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        doc.addImage(
          img,
          "JPEG",
          x + (cellW - w) / 2,
          y + (imgBoxH - h) / 2,
          w,
          h,
        );
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const caption = photo.caption
        ? `${photoLabel(photoIndex)} - ${photo.caption.toUpperCase()}`
        : photoLabel(photoIndex);
      const lines = doc.splitTextToSize(caption, cellW - 4) as string[];
      doc.text(lines.slice(0, 2), x + cellW / 2, y + imgBoxH + 4, {
        align: "center",
      });
    }
  }

  const name = (report.obra || "relatorio-fotografico")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`${name || "relatorio"}.pdf`);
}
