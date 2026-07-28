import type { Report, ReportSettings } from "./types";
import { defaultSettings } from "./types";

const REPORTS_KEY = "rf:reports";
const SETTINGS_KEY = "rf:settings";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadReports(): Report[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Report[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReports(reports: Report[]) {
  if (!isBrowser()) return;
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export function getReport(id: string): Report | undefined {
  return loadReports().find((r) => r.id === id);
}

export function upsertReport(report: Report) {
  const reports = loadReports();
  const index = reports.findIndex((r) => r.id === report.id);
  const next = { ...report, updatedAt: new Date().toISOString() };
  if (index >= 0) reports[index] = next;
  else reports.unshift(next);
  saveReports(reports);
  return next;
}

export function deleteReport(id: string) {
  saveReports(loadReports().filter((r) => r.id !== id));
}

export function loadGlobalSettings(): ReportSettings {
  if (!isBrowser()) return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...(JSON.parse(raw) as ReportSettings) };
  } catch {
    return defaultSettings;
  }
}

export function saveGlobalSettings(settings: ReportSettings) {
  if (!isBrowser()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
