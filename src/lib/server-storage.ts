import { createServerFn } from "@tanstack/react-start";
import type { Report, ReportSettings } from "./types";
import { defaultSettings } from "./types";
import { requireAuth } from "./auth";

const DATA_DIR = "data";
const REPORTS_FILE = "reports.json";
const SETTINGS_FILE = "settings.json";

async function ensureDir(dir: string) {
  const { existsSync, mkdirSync } = await import("node:fs");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function readJSON<T>(filePath: string, fallback: T): Promise<T> {
  const { existsSync, readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const dir = join(process.cwd(), DATA_DIR);
  const full = join(dir, filePath);
  await ensureDir(dir);
  try {
    if (!existsSync(full)) return fallback;
    return JSON.parse(readFileSync(full, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON(filePath: string, data: unknown) {
  const { writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const dir = join(process.cwd(), DATA_DIR);
  const full = join(dir, filePath);
  await ensureDir(dir);
  writeFileSync(full, JSON.stringify(data, null, 2), "utf-8");
}

export const loadReports = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  return readJSON<Report[]>(REPORTS_FILE, []);
});

export const upsertReport = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as Report)
  .handler(async (ctx) => {
    await requireAuth();
    const report = ctx.data;
    const reports = await readJSON<Report[]>(REPORTS_FILE, []);
    const index = reports.findIndex((r) => r.id === report.id);
    const next = { ...report, updatedAt: new Date().toISOString() };
    if (index >= 0) reports[index] = next;
    else reports.unshift(next);
    await writeJSON(REPORTS_FILE, reports);
    return next;
  });

export const deleteReport = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: string })
  .handler(async (ctx) => {
    await requireAuth();
    const { id } = ctx.data;
    const reports = await readJSON<Report[]>(REPORTS_FILE, []);
    await writeJSON(REPORTS_FILE, reports.filter((r) => r.id !== id));
  });

export const loadGlobalSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();
  return readJSON<ReportSettings>(SETTINGS_FILE, defaultSettings);
});

export const saveGlobalSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as ReportSettings)
  .handler(async (ctx) => {
    await requireAuth();
    await writeJSON(SETTINGS_FILE, ctx.data);
  });
