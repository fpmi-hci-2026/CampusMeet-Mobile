import type { CampusEvent, EventStatus, EventType, TicketStatus } from "./types";

const TZ = "Europe/Minsk";

export const typeLabels: Record<EventType, string> = {
  meetup: "Митап",
  hackathon: "Хакатон",
  workshop: "Воркшоп",
  lecture: "Лекция",
  networking: "Нетворкинг",
};

export const statusLabels: Record<EventStatus, string> = {
  draft: "Черновик",
  published: "Опубликовано",
  registration_open: "Регистрация открыта",
  registration_closed: "Регистрация закрыта",
  ongoing: "Идёт сейчас",
  completed: "Завершено",
  cancelled: "Отменено",
};

export const ticketLabels: Record<TicketStatus, string> = {
  registered: "Место подтверждено",
  waitlisted: "Лист ожидания",
  checked_in: "Проход выполнен",
  cancelled: "Отменён",
  no_show: "Неявка",
};

const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, ...options });

export const dayNumber = (iso: string) => fmt({ day: "numeric" }).format(new Date(iso));
export const weekday = (iso: string) => fmt({ weekday: "short" }).format(new Date(iso));
export const monthYear = (iso: string) => {
  const text = fmt({ month: "long", year: "numeric" }).format(new Date(iso)).replace(" г.", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
export const shortMonth = (iso: string) => fmt({ month: "short" }).format(new Date(iso)).replace(".", "");
export const time = (iso: string) => fmt({ hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const fullDate = (iso: string) => fmt({ day: "numeric", month: "long", weekday: "long" }).format(new Date(iso));
export const dateTime = (iso: string) => fmt({ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function timeRange(start: string, end: string) {
  const sameDay = fmt({ year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(start)) ===
    fmt({ year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(end));
  return sameDay ? `${time(start)}–${time(end)}` : `${dateTime(start)} – ${dateTime(end)}`;
}

export function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export type Availability = "open" | "few" | "waitlist" | "full" | "closed";

export function availability(event: Pick<CampusEvent, "status" | "free_spots" | "capacity_limit" | "waitlist_enabled">): Availability {
  if (event.status !== "registration_open") return "closed";
  if (event.free_spots === 0) return event.waitlist_enabled ? "waitlist" : "full";
  if (event.free_spots <= Math.max(2, Math.ceil(event.capacity_limit * 0.1))) return "few";
  return "open";
}

export function seatsText(event: Pick<CampusEvent, "status" | "free_spots" | "capacity_limit" | "waitlist_enabled">) {
  switch (availability(event)) {
    case "closed":
      return statusLabels[event.status as EventStatus];
    case "waitlist":
      return "Мест нет — запись в лист ожидания";
    case "full":
      return "Мест нет";
    default:
      return `${event.free_spots} ${plural(event.free_spots, ["место", "места", "мест"])} из ${event.capacity_limit}`;
  }
}

/** Groups events (already sorted) by month label. */
export function groupByMonth<T extends { start_time: string }>(items: T[]) {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = monthYear(item.start_time);
    const last = groups.at(-1);
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export function slugify(text: string) {
  const map: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
  return text
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
