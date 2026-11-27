import { CATEGORIES, PRIORITIES, STATUSES, label } from '../utils/format';

const SORTS = [
  { value: 'createdAt:desc', text: 'Newest first' },
  { value: 'createdAt:asc', text: 'Oldest first' },
  { value: 'updatedAt:desc', text: 'Recently updated' },
  { value: 'priority:desc', text: 'Priority: high → low' },
  { value: 'priority:asc', text: 'Priority: low → high' },
  { value: 'title:asc', text: 'Title A → Z' },
];

export default function TicketFilters({ filters, onChange, users }) {
  const set = (name) => (e) => onChange({ [name]: e.target.value });

  const onSort = (e) => {
    const [sortBy, order] = e.target.value.split(':');
    onChange({ sortBy, order });
  };

  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search title or description…"
        value={filters.q}
        onChange={set('q')}
        className="filter-search"
      />

      <select value={filters.status} onChange={set('status')} aria-label="Filter by status">
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{label(s)}</option>
        ))}
      </select>

      <select value={filters.priority} onChange={set('priority')} aria-label="Filter by priority">
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{label(p)}</option>
        ))}
      </select>

      <select value={filters.category} onChange={set('category')} aria-label="Filter by category">
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{label(c)}</option>
        ))}
      </select>

      {users && (
        <select value={filters.createdBy} onChange={set('createdBy')} aria-label="Filter by user">
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>
      )}

      <select
        value={`${filters.sortBy}:${filters.order}`}
        onChange={onSort}
        aria-label="Sort tickets"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>{s.text}</option>
        ))}
      </select>
    </div>
  );
}
