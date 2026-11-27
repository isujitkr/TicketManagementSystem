import { Link } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from './Badges';
import { Loader } from './Feedback';
import { PRIORITIES, STATUSES, formatDate, label } from '../utils/format';

/**
 * Shared ticket table.
 *  - customer mode: edit / delete actions (only for open tickets)
 *  - admin mode:    shows the author and lets staff change status / priority inline
 */
export default function TicketTable({
  items,
  loading,
  admin = false,
  onStatusChange,
  onPriorityChange,
  onDelete,
}) {
  if (loading && items.length === 0) return <Loader />;

  return (
    <div className={`table-wrap${loading ? ' is-loading' : ''}`}>
      <table className="table">
        <thead>
          <tr>
            <th>Ticket</th>
            {admin && <th>Requester</th>}
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t._id}>
              <td className="cell-title">
                <Link to={`/tickets/${t._id}`}>{t.title}</Link>
              </td>

              {admin && (
                <td>
                  <div>{t.createdBy?.name || 'Deleted user'}</div>
                  <small className="muted">{t.createdBy?.email}</small>
                </td>
              )}

              <td>{label(t.category)}</td>

              <td>
                {admin ? (
                  <select
                    className="inline-select"
                    value={t.priority}
                    onChange={(e) => onPriorityChange(t, e.target.value)}
                    aria-label={`Priority for ${t.title}`}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{label(p)}</option>
                    ))}
                  </select>
                ) : (
                  <PriorityBadge priority={t.priority} />
                )}
              </td>

              <td>
                {admin ? (
                  <select
                    className="inline-select"
                    value={t.status}
                    onChange={(e) => onStatusChange(t, e.target.value)}
                    aria-label={`Status for ${t.title}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{label(s)}</option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={t.status} />
                )}
              </td>

              <td className="nowrap">{formatDate(t.createdAt)}</td>

              <td className="actions">
                {admin ? (
                  <>
                    <Link className="btn sm" to={`/tickets/${t._id}`}>View</Link>
                    <button className="btn sm danger" onClick={() => onDelete(t)}>Delete</button>
                  </>
                ) : t.status === 'open' ? (
                  <>
                    <Link className="btn sm" to={`/tickets/${t._id}/edit`}>Edit</Link>
                    <button className="btn sm danger" onClick={() => onDelete(t)}>Delete</button>
                  </>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
