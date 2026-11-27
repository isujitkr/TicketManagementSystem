export default function Pagination({ pagination, onPage }) {
  const { page, pages, total } = pagination;
  if (!total) return null;

  return (
    <div className="pagination">
      <span className="muted">
        {total} result{total === 1 ? '' : 's'}
      </span>
      <div className="pagination-controls">
        <button className="btn sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ← Prev
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button className="btn sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}
