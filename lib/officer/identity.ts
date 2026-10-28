// Single source of truth for the demo scrutiny officer persona.
// Auth in this deployment is persona-based (localStorage role), so the acting
// officer is defined once here and reused by the UI and API routes instead of
// being duplicated as string literals.

export const CURRENT_OFFICER = {
  id: "OFF-AICTE-091",
  name: "Officer Ananya Menon",
  role: "scrutiny_officer",
  roleLabel: "AICTE Scrutiny Officer",
  initials: "AM",
} as const;
