## Plan

### 1. Ausgaben-Bereich komplett entfernen
- `src/pages/Expenses.tsx` löschen
- Route `/expenses` aus `src/App.tsx` entfernen
- Navigationseintrag „Ausgaben" aus `src/components/AppLayout.tsx` entfernen
- `BusinessExpense` & `ExpenseCategory` Typen aus `src/types/index.ts` entfernen
- Hooks `useBusinessExpenses` / `useExpenseCategories` und Default-Keys aus `src/lib/cloud-store.tsx` entfernen
- Migration: `expense-receipts` Storage-Bucket + zugehörige RLS-Policies löschen, `app_data`-Einträge mit Keys `sc_business_expenses` und `sc_expense_categories` bereinigen

### 2. Lead-Status direkt ändern können
In `src/pages/Pipeline.tsx`:
- Im **ContactProfileModal** ein Stage-Dropdown (alle 6 Stages) hinzufügen, das den Status sofort speichert
- Auf den Lead-Karten in der Pipeline ein klickbarer Status-Badge mit Mini-Dropdown (Popover) zum schnellen Wechsel — zusätzlich zur bestehenden Drag&Drop-Funktion

### 3. Lead → Kunde umwandeln
- Im **ContactProfileModal** einen Button „In Kunden umwandeln" ergänzen
- Logik: Aus dem `PipelineContact` ein neues `Customer`-Objekt erzeugen (Name, Firma, Branche, Stadt, Adresse, Telefon, E-Mail, Notizen werden übernommen; `partnerSince = heute`, `totalRevenue = 0`, leere Listen für `monthlyRevenue`, `invoices`, `voiceAgents`)
- Neuen Kunden via `useCustomers().saveCustomers([...customers, newCustomer])` zur Kundenliste hinzufügen
- Lead aus der Pipeline entfernen
- Bestätigungsdialog vor der Umwandlung; nach Erfolg Modal schließen und Toast-Meldung

### 4. Sortierung nach Ortschaft
- **CRM (`src/pages/CRM.tsx`)**: Kundenliste alphabetisch nach `c.city` gruppieren. Über jedem Stadt-Block eine Überschrift (z.B. „München", „Berlin"), darunter die Kunden-Karten. Stadt-Reihenfolge alphabetisch (leere Städte als „Ohne Ortsangabe" am Ende).
- **Pipeline (`src/pages/Pipeline.tsx`)**: Innerhalb jeder Stage-Spalte die Lead-Karten nach `city` alphabetisch sortieren und mit einem dezenten Stadt-Trenner (kleine Headline) gruppieren.

### Technische Hinweise
- Keine neuen Dependencies notwendig
- Beim Lead→Kunde-Convert nutzen wir die existierenden Cloud-Hooks; Sync passiert automatisch
- Migration für Cleanup: `DELETE FROM storage.objects WHERE bucket_id='expense-receipts'`, dann `DELETE FROM storage.buckets WHERE id='expense-receipts'`, plus Policy-Drops
