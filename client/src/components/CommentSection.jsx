import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addComment } from '../store/ticketsSlice';
import { pushToast } from '../store/uiSlice';
import { Loader } from './Feedback';
import { formatDate } from '../utils/format';

export default function CommentSection({ ticketId, comments, loading, canComment, onPosted }) {
  const dispatch = useDispatch();
  const currentUserId = useSelector((s) => s.auth.user?._id);
  const saving = useSelector((s) => s.tickets.saving);
  const [message, setMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    try {
      await dispatch(addComment({ ticketId, message: text })).unwrap();
      setMessage('');
      onPosted?.();
    } catch (err) {
      dispatch(pushToast(err?.errors?.[0]?.message || err?.message || 'Could not add comment', 'error'));
    }
  };

  return (
    <section className="card">
      <h3>Comments ({comments.length})</h3>

      {loading && comments.length === 0 ? (
        <Loader />
      ) : comments.length === 0 ? (
        <p className="muted">No comments yet. Start the conversation below.</p>
      ) : (
        <ul className="comments">
          {comments.map((c) => {
            const staff = c.authorRole === 'admin';
            return (
              <li key={c._id} className={`comment${staff ? ' staff' : ''}`}>
                <span className="avatar">{c.author?.name?.[0]?.toUpperCase() || '?'}</span>
                <div className="comment-body">
                  <div className="comment-head">
                    <strong>{c.author?.name || 'Deleted user'}</strong>
                    {c.author?._id === currentUserId && <span className="role-tag you">you</span>}
                    {staff && <span className="role-tag admin">staff</span>}
                    <small className="muted">{formatDate(c.createdAt)}</small>
                  </div>
                  <p>{c.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canComment ? (
        <form onSubmit={onSubmit} className="comment-form">
          <textarea
            rows={3}
            placeholder="Write a comment…"
            value={message}
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="btn primary" disabled={saving || !message.trim()}>
            {saving ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      ) : (
        <div className="alert info">This ticket is closed and no longer accepts comments.</div>
      )}
    </section>
  );
}
