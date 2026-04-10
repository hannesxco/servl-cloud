
-- Simple key-value store mirroring the current localStorage pattern
CREATE TABLE public.app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- Allow all access (app uses its own auth layer)
CREATE POLICY "Allow read access" ON public.app_data FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON public.app_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.app_data FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete access" ON public.app_data FOR DELETE USING (true);

-- Seed with default calendar categories
INSERT INTO public.app_data (key, value) VALUES
  ('sc_customers', '[]'),
  ('sc_pipeline', '[]'),
  ('sc_tasks', '[]'),
  ('sc_events', '[]'),
  ('sc_finances', '{"currentBalance":0,"fixedMonthlyCosts":[],"variableMonthlyCosts":[],"fixedMonthlyIncome":[],"monthlyRevenues":{},"expenses":[]}'),
  ('sc_calendars', '[{"id":"cal-1","name":"Akquise","color":"hsl(217, 91%, 60%)"},{"id":"cal-2","name":"Agentbau","color":"hsl(160, 84%, 39%)"},{"id":"cal-3","name":"Buchhaltung","color":"hsl(38, 92%, 50%)"},{"id":"cal-4","name":"Kundentermine","color":"hsl(280, 65%, 60%)"}]'),
  ('sc_agents', '[]'),
  ('sc_invoices', '[]'),
  ('sc_projects', '[]'),
  ('sc_project_tags', '[]'),
  ('sc_mails', '[]');
