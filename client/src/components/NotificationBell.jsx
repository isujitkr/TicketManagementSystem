import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../store/notificationsSlice';
import { timeAgo } from '../utils/format';

const POLL_MS = 30000;

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount } = useSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Simple polling keeps the badge fresh without websockets.
  useEffect(() => {
    dispatch(fetchNotifications());
    const timer = setInterval(() => dispatch(fetchNotifications()), POLL_MS);
    return () => clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = () => {
    if (!open) dispatch(fetchNotifications());
    setOpen((o) => !o);
  };

  const onSelect = (n) => {
    if (!n.isRead) dispatch(markNotificationRead(n._id));
    setOpen(false);
    if (n.ticket) navigate(`/tickets/${n.ticket}`);
  };

  return (
    <div className="bell" ref={ref}>
      <button className="icon-btn" onClick={toggle} aria-label="Notifications">
        🔔
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="bell-panel">
          <div className="bell-head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button className="link-btn" onClick={() => dispatch(markAllNotificationsRead())}>
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="muted bell-empty">You're all caught up.</p>
          ) : (
            <ul className="bell-list">
              {items.map((n) => (
                <li key={n._id}>
                  <button
                    className={`bell-item${n.isRead ? '' : ' unread'}`}
                    onClick={() => onSelect(n)}
                  >
                    <span>{n.message}</span>
                    <small className="muted">{timeAgo(n.createdAt)}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
