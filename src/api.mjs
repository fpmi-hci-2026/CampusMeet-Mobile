/** Mobile consumes the same versioned contract as Web and MCP-backed services. */
export async function fetchCatalog(baseUrl, fetchImpl = fetch) {
  if (!baseUrl) throw new Error('Укажите адрес CampusMeet API');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/events`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Не удалось загрузить события: HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error('Сервер вернул неверный формат событий');
    return data.items;
  } finally {
    clearTimeout(timeout);
  }
}
