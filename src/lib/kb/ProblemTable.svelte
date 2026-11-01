<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket } from '#lib/kb/problems';

  // issues: problem → link to the ticket that now owns it.
  let { ticket, issues = {} }: { ticket: number; issues?: Record<string, string> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
  const label = (url: string) => '#' + url.split('/').pop();
</script>

<p class="sum">
  The export holds <strong>{split.rows}</strong> rows for #{ticket}:
  <strong>{split.unique}</strong> reports, <strong>{split.rows - split.unique}</strong> of them twice.
  They show <strong>{split.groups.length}</strong> problems.
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>intake agreed</th><th>channels</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports}</strong></td>
        <td>{g.intakeAgrees} of {g.reports}</td>
        <td class="small">{channels(g.channels)}</td>
        <td class="small" title={g.tenants.join(', ')}>{g.tenants.length}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>{label(issues[g.problem])}</a>{:else}<span class="none">none yet</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.05rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
