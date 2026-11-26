const buildPagination = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = buildPagination;