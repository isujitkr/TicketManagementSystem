import { useCallback, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  adminDeleteTicket,
  adminUpdateTicket,
  clearCurrent,
  deleteTicket,
  fetchComments,
  fetchTicket,
  fetchTicketActivity,
} from '../store/ticketsSlice';
import { fetchStats } from '../store/adminSlice';
import { pushToast } from '../store/uiSlice';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import CommentSection from '../components/CommentSection';
import ActivityTimeline from '../components/ActivityTimeline';
import { ErrorBox, Loader } from '../components/Feedback';
import { PRIORITIES, STATUSES, formatDate, label } from '../utils/format';

export default function TicketDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';
  const { current, currentLoading, currentError, comments, commentsLoading, activity } = useSelector(
    (s) => s.tickets
  );

  useEffect(() => {
    dispatch(clearCurrent());
    dispatch(fetchTicket(id));
    dispatch(fetchComments(id));
    dispatch(fetchTicketActivity(id));
    return () => {
      dispatch(clearCurrent());
    };
  }, [dispatch, id]);

  // Events are processed asynchronously on the server, so give the log a moment to be written.
  const refreshActivity = useCallback(() => {
    setTimeout(() => dispatch(fetchTicketActivity(id)), 400);
  }, [dispatch, id]);

  const onAdminChange = async (body) => {
    try {
      await dispatch(adminUpdateTicket({ id, body })).unwrap();
      dispatch(pushToast('Ticket updated'));
      dispatch(fetchStats());
      refreshActivity();
    } catch (err) {
      dispatch(pushToast(err?.message || 'Update failed', 'error'));
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Delete this ticket and all of its comments? This cannot be undone.')) return;
    try {
      await dispatch((isAdmin ? adminDeleteTicket : deleteTicket)(id)).unwrap();
      dispatch(pushToast('Ticket deleted'));
      navigate(isAdmin ? '/admin' : '/tickets', { replace: true });
    } catch (err) {
      dispatch(pushToast(err?.message || 'Could not delete ticket', 'error'));
    }
  };

  if (currentError) {
    return (
      <div className="card">
        <ErrorBox error={currentError} />
        <Link to="/" className="btn">← Back</Link>
      </div>
    );
  }
  if (currentLoading || !current || current._id !== id) return <Loader />;

  const ticket = current;
  const canEdit = !isAdmin && ticket.status === 'open';
  const canComment = isAdmin || ticket.status !== 'closed';

  return (
    <>
      <div className="breadcrumb">
        <Link to={isAdmin ? '/admin' : '/tickets'}>← {isAdmin ? 'All tickets' : 'My tickets'}</Link>
      </div>

      <div className="layout-2col">
        <div className="stack">
          <section className="card">
            <div className="detail-head">
              <h1>{ticket.title}</h1>
              <div className="badges">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <p className="description">{ticket.description}</p>

            {(canEdit || isAdmin) && (
              <div className="detail-actions">
                {canEdit && <Link to={`/tickets/${ticket._id}/edit`} className="btn">Edit</Link>}
                {(canEdit || isAdmin) && (
                  <button className="btn danger" onClick={onDelete}>Delete ticket</button>
                )}
              </div>
            )}
          </section>

          <CommentSection
            ticketId={ticket._id}
            comments={comments}
            loading={commentsLoading}
            canComment={canComment}
            onPosted={refreshActivity}
          />
        </div>

        <aside className="stack">
          <section className="card">
            <h3>Details</h3>
            <dl className="meta">
              <dt>Requester</dt>
              <dd>{ticket.createdBy?.name || 'Deleted user'}</dd>
              <dt>Category</dt>
              <dd>{label(ticket.category)}</dd>
              <dt>Created</dt>
              <dd>{formatDate(ticket.createdAt)}</dd>
              <dt>Last updated</dt>
              <dd>{formatDate(ticket.updatedAt)}</dd>
              {ticket.resolvedAt && (
                <>
                  <dt>Resolved</dt>
                  <dd>{formatDate(ticket.resolvedAt)}</dd>
                </>
              )}
            </dl>

            {isAdmin && (
              <div className="admin-controls">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select id="status" value={ticket.status} onChange={(e) => onAdminChange({ status: e.target.value })}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{label(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select id="priority" value={ticket.priority} onChange={(e) => onAdminChange({ priority: e.target.value })}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{label(p)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          <section className="card">
            <h3>Activity</h3>
            <ActivityTimeline items={activity} />
          </section>
        </aside>
      </div>
    </>
  );
}
