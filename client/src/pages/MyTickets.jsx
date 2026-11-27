import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deleteTicket, fetchMyTickets } from '../store/ticketsSlice';
import { pushToast } from '../store/uiSlice';
import { useDebounce } from '../hooks';
import TicketFilters from '../components/TicketFilters';
import TicketTable from '../components/TicketTable';
import Pagination from '../components/Pagination';
import { EmptyState, ErrorBox } from '../components/Feedback';

const LIMIT = 10;

export default function MyTickets() {
  const dispatch = useDispatch();
  const { items, pagination, loading, error } = useSelector((s) => s.tickets.mine);

  const [filters, setFilters] = useState({
    q: '',
    status: '',
    priority: '',
    category: '',
    sortBy: 'createdAt',
    order: 'desc',
    page: 1,
  });
  const debouncedQ = useDebounce(filters.q);

  const load = useCallback(() => {
    dispatch(
      fetchMyTickets({
        q: debouncedQ,
        status: filters.status,
        priority: filters.priority,
        category: filters.category,
        sortBy: filters.sortBy,
        order: filters.order,
        page: filters.page,
        limit: LIMIT,
      })
    );
  }, [dispatch, debouncedQ, filters.status, filters.priority, filters.category, filters.sortBy, filters.order, filters.page]);

  useEffect(() => {
    load();
  }, [load]);

  // any filter change goes back to page 1; explicit page changes keep their page
  const onChange = (partial) =>
    setFilters((f) => ({ ...f, ...partial, page: partial.page ?? 1 }));

  const onDelete = async (ticket) => {
    if (!window.confirm(`Delete "${ticket.title}"? This cannot be undone.`)) return;
    try {
      await dispatch(deleteTicket(ticket._id)).unwrap();
      dispatch(pushToast('Ticket deleted'));
      load();
    } catch (err) {
      dispatch(pushToast(err?.message || 'Could not delete ticket', 'error'));
    }
  };

  const hasFilters = filters.q || filters.status || filters.priority || filters.category;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My tickets</h1>
          <p className="muted">Track the status of everything you've submitted.</p>
        </div>
        <Link to="/tickets/new" className="btn primary">+ New ticket</Link>
      </div>

      <div className="card">
        <TicketFilters filters={filters} onChange={onChange} />
        <ErrorBox error={error} />

        {!loading && !error && items.length === 0 ? (
          <EmptyState title={hasFilters ? 'No tickets match your filters' : 'No tickets yet'}>
            {hasFilters ? 'Try clearing a filter.' : 'Create your first ticket and our team will get back to you.'}
          </EmptyState>
        ) : (
          <TicketTable items={items} loading={loading} onDelete={onDelete} />
        )}

        <Pagination pagination={pagination} onPage={(page) => onChange({ page })} />
      </div>
    </>
  );
}
