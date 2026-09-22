/**
 * What a unit inherits from the project it is filed under (Sep 2026).
 *
 * The property form calls applyProject() when the broker picks a project:
 * empty text fields take the project's value, and checklists gain the
 * project's ticks without losing any the broker already made. Nothing the
 * broker typed is ever overwritten — a unit whose address differs from the
 * society's keeps its own.
 *
 * Pure, so scripts/check-taxonomy.mjs can assert it without a browser.
 */

/** A project as the property form sees it. Admin-only. */
export type ProjectPrefill = {
  id: number;
  name: string;
  address: string | null;
  mapsUrl: string | null;
  amenities: string[] | null;
  legalFlags: string[] | null;
  loanFlags: string[] | null;
  banksOnPanel: string[] | null;
  reraNumber: string | null;
};

/** The property form's fields a project can fill. */
export type SharedFields = {
  address: string;
  mapsUrl: string;
  amenities: string[];
  legalFlags: string[];
  reraNumber: string;
  loanFlags: string[];
  banksOnPanel: string[];
};

/** Ticked when a project quotes a RERA number — the public badge reads it. */
export const RERA_FLAG = "RERA Registered";

function union(current: string[], extra: string[] | null): string[] {
  return [...new Set([...current, ...(extra ?? [])])];
}

export function applyProject(
  current: SharedFields,
  project: ProjectPrefill
): { fields: SharedFields; filled: string[] } {
  const filled: string[] = [];
  const text = (mine: string, theirs: string | null, label: string) => {
    if (mine.trim() || !theirs?.trim()) return mine;
    filled.push(label);
    return theirs.trim();
  };
  const list = (mine: string[], theirs: string[] | null, label: string) => {
    const next = union(mine, theirs);
    if (next.length > mine.length) filled.push(label);
    return next;
  };

  const reraNumber = text(current.reraNumber, project.reraNumber, "RERA number");
  const fields: SharedFields = {
    address: text(current.address, project.address, "address"),
    mapsUrl: text(current.mapsUrl, project.mapsUrl, "map link"),
    amenities: list(current.amenities, project.amenities, "amenities"),
    legalFlags: list(
      current.legalFlags,
      [...(project.legalFlags ?? []), ...(reraNumber ? [RERA_FLAG] : [])],
      "legal approvals"
    ),
    reraNumber,
    loanFlags: list(current.loanFlags, project.loanFlags, "loan details"),
    banksOnPanel: list(current.banksOnPanel, project.banksOnPanel, "banks on panel"),
  };
  return { fields, filled };
}
