import type { Report, ReportSettings } from "./types";
import { defaultSettings } from "./types";
import {
  loadReports as loadReportsFromServer,
  upsertReport as upsertReportOnServer,
  deleteReport as deleteReportOnServer,
  loadGlobalSettings as loadGlobalSettingsFromServer,
  saveGlobalSettings as saveGlobalSettingsOnServer,
} from "./server-storage";

export async function loadReports(): Promise<Report[]> {
  try {
    return await loadReportsFromServer();
  } catch {
    return [];
  }
}

export async function getReport(id: string): Promise<Report | undefined> {
  const reports = await loadReports();
  return reports.find((r) => r.id === id);
}

export async function upsertReport(report: Report): Promise<Report> {
  const next = { ...report, updatedAt: new Date().toISOString() };
  return await upsertReportOnServer({ data: next });
}

export async function deleteReport(id: string): Promise<void> {
  await deleteReportOnServer({ data: { id } });
}

export async function loadGlobalSettings(): Promise<ReportSettings> {
  try {
    return await loadGlobalSettingsFromServer();
  } catch {
    return defaultSettings;
  }
}

export async function saveGlobalSettings(settings: ReportSettings): Promise<void> {
  await saveGlobalSettingsOnServer({ data: settings });
}
