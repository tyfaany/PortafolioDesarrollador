export function getCurrentMonthKey(referenceDate = new Date()) {
  const year = referenceDate.getUTCFullYear();
  const month = String(referenceDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseMonthKey(monthKey) {
  if (!/^\d{4}-\d{2}$/.test(String(monthKey || ''))) {
    return null;
  }

  const parsed = new Date(`${monthKey}-01T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildMonthKey(year, month) {
  if (!year || !month) {
    return '';
  }

  return `${String(year).slice(0, 4)}-${String(month).slice(0, 2)}`;
}

export function isFutureMonthKey(monthKey, referenceMonthKey = getCurrentMonthKey()) {
  const value = parseMonthKey(monthKey);
  const reference = parseMonthKey(referenceMonthKey);

  if (!value || !reference) {
    return false;
  }

  return value > reference;
}

export function isMonthKeyAfter(startMonthKey, endMonthKey) {
  const start = parseMonthKey(startMonthKey);
  const end = parseMonthKey(endMonthKey);

  if (!start || !end) {
    return false;
  }

  return start > end;
}
