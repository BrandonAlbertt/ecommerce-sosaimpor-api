const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export function getPagination(query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}
