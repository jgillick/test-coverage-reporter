import {
  Inputs,
  DiffReport,
  CoverageSummary,
  CoverageSection,
  CoverageDiff,
} from "./types";
import PRFiles from "./PRFiles";

/**
 * Generate a diff summary of two coverage files.
 */
export function generateDiffReport(
  coverage: CoverageSummary,
  baseCoverage: CoverageSummary,
  prFiles: PRFiles,
  inputs: Inputs
): DiffReport {
  const diffReport: DiffReport = {
    biggestDiff: 0,
    sections: {},
  };
  const hasBaseCoverage = inputs.baseCoveragePath?.length > 0;

  // Generate diff for each file
  Object.keys(coverage)
    .map((key) => {
      const target = coverage[key] || {};
      const base = baseCoverage[key];
      const isNewFile =
        hasBaseCoverage &&
        key !== "total" &&
        typeof target.lines !== "undefined" &&
        typeof base === "undefined";

      // Don't generate report for non-PR fils
      const isPrFile = prFiles.inPR(key);
      if (key !== "total" && !isPrFile) {
        return null;
      }

      // Generate delta
      const section = {
        isNewFile,
        fileUrl: key !== "total" ? prFiles.fileUrl(key) : null,
        lines: generateDiff("lines", target, base),
        statements: generateDiff("statements", target, base),
        functions: generateDiff("functions", target, base),
        branches: generateDiff("branches", target, base),
      };

      diffReport.sections[key] = section;
      diffReport.biggestDiff = Math.min(
        diffReport.biggestDiff,
        section.lines.diff,
        section.statements.diff,
        section.functions.diff,
        section.branches.diff
      );
    })
    .filter((i) => i !== null);

  return diffReport;
}

/**
 * Generate the diff object for a summary item type
 */
function generateDiff(
  type: keyof CoverageSection,
  target: CoverageSection,
  base?: CoverageSection
): CoverageDiff {
  const targetPercent = getPercent(target, type);
  const basePercent = base ? getPercent(base, type) : targetPercent;

  return {
    percent: targetPercent,
    diff: targetPercent - basePercent,
    total: target[type]?.total || 0,
  };
}

/**
 * Return the percent value from a summary section type
 */
function getPercent(
  section: CoverageSection,
  type: keyof CoverageSection
): number {
  const summary = section[type];
  if (typeof summary === "object" && typeof summary.pct === "number") {
    return summary.pct;
  }
  return 0;
}
