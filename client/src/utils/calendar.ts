export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Lunes como inicio de semana. getDay() devuelve 0=domingo..6=sábado.
export function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

// Siempre 42 días (6 semanas): cubre cualquier mes sin importar en qué día cae el
// primero ni cuántas semanas ocupa, sin casos especiales.
export function getMonthGridDays(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// OJO: nada de toISOString() acá — convierte a UTC primero y puede correr la fecha
// un día para atrás o adelante según el huso horario del usuario. Con getFullYear/
// getMonth/getDate (hora local) evitamos ese corrimiento.
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// El backend manda "YYYY-MM-DDTHH:mm:ss" (sin offset de zona horaria) — cortar los
// primeros 10 caracteres da directamente la fecha del calendario, sin conversión.
export function isoDateKey(isoDate: string): string {
  return isoDate.slice(0, 10);
}
