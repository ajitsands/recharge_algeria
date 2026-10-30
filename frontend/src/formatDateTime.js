const pad = (value) => String(value).padStart(2, '0');

export function formatDateTime(value, format = 'd/m/Y H:i', lang = 'en') {
  if (!value) return '';

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (!match) return String(value);

  const [, yearText, monthText, dayText, hourText = '00', minuteText = '00', secondText = '00'] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return String(value);
  }

  const weekday = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'en-GB', {
    weekday: 'long',
    timeZone: 'UTC'
  }).format(date);
  const shortWeekday = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'en-GB', {
    weekday: 'short',
    timeZone: 'UTC'
  }).format(date);
  const monthName = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'en-GB', {
    month: 'long',
    timeZone: 'UTC'
  }).format(date);
  const shortMonthName = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'en-GB', {
    month: 'short',
    timeZone: 'UTC'
  }).format(date);
  const hour12 = hour % 12 || 12;
  const dayOfYear = Math.floor((date - new Date(Date.UTC(year, 0, 0))) / 86400000);
  const tokens = {
    d: pad(day),
    D: shortWeekday,
    j: String(day),
    l: weekday,
    N: String(date.getUTCDay() || 7),
    w: String(date.getUTCDay()),
    z: String(dayOfYear - 1),
    F: monthName,
    m: pad(month),
    M: shortMonthName,
    n: String(month),
    Y: yearText,
    y: yearText.slice(-2),
    a: hour < 12 ? 'am' : 'pm',
    A: hour < 12 ? 'AM' : 'PM',
    g: String(hour12),
    G: String(hour),
    h: pad(hour12),
    H: pad(hour),
    i: pad(minute),
    s: pad(second)
  };

  const pattern = format || 'd/m/Y H:i';
  return String(pattern).replace(/\\?([a-zA-Z])/g, (token, character) => {
    if (token.startsWith('\\')) return character;
    if (character in tokens) return tokens[character];
    return character;
  });
}
