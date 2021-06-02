
export function dateIsBetween(date: string, timeRange: [string, string]): boolean {
  const d = new Date(date);
  return d >= new Date(timeRange[0]) && d <= new Date(timeRange[1]);
}
