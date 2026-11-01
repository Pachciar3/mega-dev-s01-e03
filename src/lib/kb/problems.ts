// Which problem a report in a merged ticket shows. causes.ts tells a report's cause from its
// tenant and the way it came in; this file adds what only the report itself can show.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `shift`: the date moved by one day, not month and day swapped. No tenant setting explains it,
// so causeOf cannot see it. The desk lists these reports by id (desk-notes.json, `oneDayMove`).
export type Problem = Cause | 'shift' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDay: readonly string[]): Problem {
  if (oneDay.includes(r.id)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: number;
  tenants: string[];
  channels: Record<string, number>;
  // How many of these reports intake tagged with this same problem's name.
  intakeAgrees: number;
  firstSeen: string;
  lastSeen: string;
};

export type Split = { rows: number; unique: number; groups: ProblemGroup[] };

// rows: what the export holds (pages overlap, so some reports come twice). unique: one id, one report.
export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): Split {
  const rows = all.filter((r) => r.mergedInto === ticket);
  const merged = uniqueById(rows);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDay);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs.length,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        intakeAgrees: rs.filter((r) => r.meta.intakeTag === problem).length,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports - a.reports);
  return { rows: rows.length, unique: merged.length, groups };
}
