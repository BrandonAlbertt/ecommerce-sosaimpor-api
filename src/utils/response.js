export function successResponse(data, pagination = null) {
  return {
    ok: true,
    data,
    pagination,
  };
}
