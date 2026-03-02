export function getTodayFormatted(): string {
  const today = new Date();
  return formatDate(today);
}

export function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const [mm, dd, yyyy] = parts.map(Number);
  if (Number.isNaN(mm) || Number.isNaN(dd) || Number.isNaN(yyyy)) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  if (yyyy < 1900 || yyyy > 2099) return null;
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getMonth() !== mm - 1) return null;
  return date;
}

export function calculateAge(dob: string): string {
  if (!dob) return "";
  const birthDate = parseDate(dob);
  if (!birthDate) return "";

  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }
  if (now.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  if (years < 0) return "";
  if (years === 0 && months === 0) return "< 1 mo";
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}m`;
}

// ─── Weekly Calendar Utilities ───────────────────────────────────────────────

/**
 * Returns the Monday of the week containing the given date.
 * Monday is treated as the first day of the week.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns an array of 7 Date objects representing Mon–Sun of the week
 * containing the given reference date.
 */
export function getWeekDays(referenceDate: Date): Date[] {
  const monday = getWeekStart(referenceDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/**
 * Formats a Date as abbreviated day name + M/D, e.g. "Mon 6/9"
 */
export function formatCalendarDayHeader(date: Date): {
  dayName: string;
  dateStr: string;
} {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    dayName: dayNames[date.getDay()],
    dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
  };
}

/**
 * Returns true if two dates fall on the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Returns true if the given date is today.
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
