export function limitPag({ limit = 10, offset = 0 } = {}) {
  const L = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 10;
  const O = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  return { L, O };
}

