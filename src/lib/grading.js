// Pure grading helpers. No UI, no state, no side effects.
// Takes a class (with .categories) and its assignments; returns grade stats.
//
// Grading model:
//   - Each assignment may have a `score` (0-100 percentage) and `categoryId`.
//   - Each class category has a `weight` (any number >= 0; does NOT need to sum to 100).
//   - The running grade is a weighted average across categories that have at
//     least one scored assignment. Categories with no scored assignments are
//     ignored, and their weights are NOT included in the denominator.
//     -> A student sees their grade based on work they've done, not a
//        deflated score that assumes zeros for everything not yet graded.

/**
 * Compute running grade and per-category breakdown for a class.
 *
 * @param {object} cls - Class object with a `categories` array.
 * @param {object[]} assignments - All assignments belonging to this class.
 * @returns {{
 *   currentGrade: number | null,             // overall weighted % (0-100), or null
 *   categoryBreakdowns: Array<{
 *     id: string,
 *     name: string,
 *     weight: number,
 *     average: number | null,                // null if no scored assignments in this category
 *     scoredCount: number,
 *     totalCount: number,
 *   }>,
 * }}
 */
export function computeClassGrade(cls, assignments) {
  const categories = cls?.categories ?? [];

  // Group assignments by categoryId (ignore ones with no/unknown category).
  const byCategory = new Map();
  for (const cat of categories) byCategory.set(cat.id, []);
  for (const a of assignments) {
    if (a.categoryId && byCategory.has(a.categoryId)) {
      byCategory.get(a.categoryId).push(a);
    }
  }

  const categoryBreakdowns = categories.map((cat) => {
    const assigns = byCategory.get(cat.id) ?? [];
    const scored = assigns.filter((a) => isNumber(a.score));
    const average =
      scored.length === 0
        ? null
        : scored.reduce((sum, a) => sum + a.score, 0) / scored.length;
    return {
      id: cat.id,
      name: cat.name,
      weight: cat.weight ?? 0,
      average,
      scoredCount: scored.length,
      totalCount: assigns.length,
    };
  });

  // Weighted average across categories that actually have scored work.
  const contributing = categoryBreakdowns.filter((b) => b.average !== null && b.weight > 0);
  const weightSum = contributing.reduce((s, b) => s + b.weight, 0);
  const currentGrade =
    weightSum === 0
      ? null
      : contributing.reduce((s, b) => s + b.average * b.weight, 0) / weightSum;

  return { currentGrade, categoryBreakdowns };
}

function isNumber(v) {
  return typeof v === "number" && !Number.isNaN(v);
}
