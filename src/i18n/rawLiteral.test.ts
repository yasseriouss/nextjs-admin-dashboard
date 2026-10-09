import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..');
const ARABIC = /[\u0600-\u06FF]/;

/**
 * Files still pending extraction. Each extraction task REMOVES its entries here.
 * Test fails on: (a) Arabic in a non-allowlisted .tsx, (b) stale allowlist entries.
 */
const ALLOWED_FILES = new Set<string>([
  'components/CalendarView.tsx',
  'components/CompoundPriceDistributionModal.tsx',
  'components/CompoundUnitMap.tsx',
  'components/ContractsAndCommissions.tsx',
  'components/GeminiCopilotPage.tsx',
  'components/GeographicDistributionMap.tsx',
  'components/MonthlySalesPdfModal.tsx',
  'components/MonthlySalesReports.tsx',
  'components/OwnerPerformanceReports.tsx',
  'components/OwnersTab.tsx',
  'components/RealEstateProjectGanttChart.tsx',
  'components/SalesRegionalMiniDashboard.tsx',
  'components/SettingsPage.tsx',
  'components/SmartRemindersModal.tsx',
  'components/SuiteCRMClients.tsx',
  'components/TaskImminentBanner.tsx',
  'components/TaskKanbanBoard.tsx',
  'components/TeamAndTasksWorkspace.tsx',
  'components/TeamPerformanceDashboard.tsx',
  'components/UISettingsModal.tsx',
  'components/UnitBrochureModal.tsx',
  'components/UnitCommentsSection.tsx',
  'components/UnitComparisonModal.tsx',
  'components/UnitDetailModal.tsx',
  'components/UnitOfficialQuotationModal.tsx',
  'components/CrmOverview.tsx',
  'components/LandingPageCmsView.tsx',
  'components/BlogArticlesManager.tsx',
  'components/common/sidebar/index.tsx',
]);

const SKIP_DIRS = new Set(['locales', 'i18n', 'data', 'test', 'app']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full, out);
    } else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) {
      out.push(full);
    }
  }
  return out;
}

describe('raw Arabic literals in .tsx', () => {
  const files = walk(SRC);

  it('no Arabic outside locales/, data/, allowlist (escape hatch: /* i18n-allow */)', () => {
    const violations: string[] = [];
    for (const file of files) {
      const rel = path.relative(SRC, file).split(path.sep).join('/');
      if (ALLOWED_FILES.has(rel)) continue;
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (ARABIC.test(line) && !line.includes('i18n-allow')) {
          violations.push(`${rel}:${i + 1}`);
        }
      });
    }
    expect(violations, `Raw Arabic found — extract to locales/ or add "/* i18n-allow */" for data keywords:\n${violations.join('\n')}`).toEqual([]);
  });

  it('allowlist has no stale entries (extracted files must be removed)', () => {
    const stale = [...ALLOWED_FILES].filter((rel) => {
      const full = path.join(SRC, rel);
      if (!existsSync(full)) return true;
      return !ARABIC.test(readFileSync(full, 'utf8'));
    });
    expect(stale, `Remove from ALLOWED_FILES: ${stale.join(', ')}`).toEqual([]);
  });
});
