import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminTickets,
  fetchStats,
  fetchUsers,
} from '../store/adminSlice';
import { adminDeleteTicket, adminUpdateTicket } from '../store/ticketsSlice';
import { pushToast } from '../store/uiSlice';
import { useDebounce } from '../hooks';
import TicketFilters from '../components/TicketFilters';
import TicketTable from '../components/TicketTable';
import Pagination from '../components/Pagination';
import { EmptyState, ErrorBox } from '../components/Feedback';
import { PRIORITIES, STATUSES, label } from '../utils/format';

const LIMIT = 10;

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { tickets, stats, users } = useSelector((s) => s.admin);
  const { items, pagination, loading, error } = tickets;

  const [filters, setFilters] = useState({
    q: '',
    status: '',
    priority: '',
    category: '',
    createdBy: '',
    sortBy: 'createdAt',
    order: 'desc',
    page: 1,
  });
  const debouncedQ = useDebounce(filters.q);

  const load = useCallback(() => {
    dispatch(
      fetchAdminTickets({
        q: debouncedQ,
        status: filters.status,
        priority: filters.priority,
        category: filters.category,
        createdBy: filters.createdBy,
        sortBy: filters.sortBy,
        order: filters.order,
        page: filters.page,
        limit: LIMIT,
      })
    );
  }, [
    dispatch,
    debouncedQ,
    filters.status,
    filters.priority,
    filters.category,
    filters.createdBy,
    filters.sortBy,
    filters.order,
    filters.page,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchUsers());
  }, [dispatch]);

  const onChange = (partial) =>
    setFilters((f) => ({ ...f, ...partial, page: partial.page ?? 1 }));

  const update = async (ticket, body, message) => {
    try {
      await dispatch(adminUpdateTicket({ id: ticket._id, body })).unwrap();
      dispatch(pushToast(message));
      dispatch(fetchStats());
    } catch (err) {
      dispatch(pushToast(err?.message || 'Update failed', 'error'));
    }
  };

  const onDelete = async (ticket) => {
    if (!window.confirm(`Delete "${ticket.title}" and all its comments?`)) return;
    try {
      await dispatch(adminDeleteTicket(ticket._id)).unwrap();
      dispatch(pushToast('Ticket deleted'));
      dispatch(fetchStats());
      load();
    } catch (err) {
      dispatch(pushToast(err?.message || 'Could not delete ticket', 'error'));
    }
  };

  const hasFilters = filters.q || filters.status || filters.priority || filters.category || filters.createdBy;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Support dashboard</h1>
          <p className="muted">All tickets from every customer.</p>
        </div>
      </div>

      {stats && (
        <>
          <div className="stats">
            <button
              className={`stat${filters.status === '' ? ' active' : ''}`}
              onClick={() => onChange({ status: '' })}
            >
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`stat status-${s}${filters.status === s ? ' active' : ''}`}
                onClick={() => onChange({ status: filters.status === s ? '' : s })}
              >
                <span className="stat-value">{stats.byStatus[s]}</span>
                <span className="stat-label">{label(s)}</span>
              </button>
            ))}
          </div>

          <div className="priority-strip">
            {PRIORITIES.map((p) => (
              <span key={p} className={`badge priority-${p}`}>
                {label(p)}: {stats.byPriority[p]}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="card">
        <TicketFilters filters={filters} onChange={onChange} users={users} />
        <ErrorBox error={error} />

        {!loading && !error && items.length === 0 ? (
          <EmptyState title={hasFilters ? 'No tickets match your filters' : 'No tickets yet'}>
            {hasFilters ? 'Try clearing a filter.' : 'New tickets from customers will show up here.'}
          </EmptyState>
        ) : (
          <TicketTable
            admin
            items={items}
            loading={loading}
            onStatusChange={(t, status) => update(t, { status }, 'Status updated')}
            onPriorityChange={(t, priority) => update(t, { priority }, 'Priority updated')}
            onDelete={onDelete}
          />
        )}

        <Pagination pagination={pagination} onPage={(page) => onChange({ page })} />
      </div>
    </>
  );
}
