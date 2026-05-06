export type StartupSource =
  | "mss_biz"
  | "kstartup_announcement"
  | "kstartup_business"
  | "kstartup_content"
  | "kstartup_statistics";

export type StartupItem = {
  id: string;
  source: StartupSource;
  source_id: string;
  title: string;
  category: string | null;
  organization: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  published_at: string | null;
  updated_at: string | null;
  url: string | null;
  summary: string | null;
  raw_json: Record<string, unknown> | string;
  synced_at?: string | null;
};
