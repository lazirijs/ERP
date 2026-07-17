// Categorical series palette, in fixed slot order — a series keeps its hue no matter
// how many other series are on screen. Validated against the white card surface:
// all four sit in the light band, clear the chroma floor, hold >= 3:1 contrast, and
// the worst adjacent colour-vision-deficiency separation is dE 16.2 (target >= 12).
// Re-validate before substituting any hue.
export const palette = {
  blue: '#2a78d6',
  green: '#199e70',
  orange: '#eb6834',
  red: '#e34948'
};

export const sections = {
  sales: { id: 'sales', label: 'reportsSales', permission: 'reports.financials' },
  cash: { id: 'cash', label: 'reportsCash', permission: 'reports.financials' },
  inventory: { id: 'inventory', label: 'reportsInventory', permission: 'reports.access' },
  hr: { id: 'hr', label: 'reportsHr', permission: 'reports.access' }
} as const;

export type SectionId = keyof typeof sections;

// Built from local date parts on purpose: toISOString() would convert to UTC and shift
// the day for anyone east or west of it, so "today" could resolve to yesterday's range.
const toDateInput = (date: Date) =>
  `${ date.getFullYear() }-${ String(date.getMonth() + 1).padStart(2, '0') }-${ String(date.getDate()).padStart(2, '0') }`;

// Ranges are inclusive calendar days; the API compares them against date(created_at).
export const rangeFromDays = (days: number) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return [toDateInput(from), toDateInput(to)] as [string, string];
};

export const monthToDate = () => {
  const to = new Date();
  return [toDateInput(new Date(to.getFullYear(), to.getMonth(), 1)), toDateInput(to)] as [string, string];
};

export const yearToDate = () => {
  const to = new Date();
  return [toDateInput(new Date(to.getFullYear(), 0, 1)), toDateInput(to)] as [string, string];
};

export const defaultRange = () => rangeFromDays(30);

export default { palette, sections, rangeFromDays, monthToDate, yearToDate, defaultRange };
