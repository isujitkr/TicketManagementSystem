import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';

  const onLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">🎫 Mini Helpdesk</span>

        <nav className="nav-links">
          {isAdmin ? (
            <>
              <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
              <NavLink to="/admin/activity" className={linkClass}>Activity log</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/tickets" end className={linkClass}>My tickets</NavLink>
              <NavLink to="/tickets/new" className={linkClass}>New ticket</NavLink>
            </>
          )}
        </nav>

        <div className="nav-right">
          <NotificationBell />
          <div className="user-chip" title={user?.email}>
            <span className="avatar">{user?.name?.[0]?.toUpperCase()}</span>
            <span className="user-name">{user?.name}</span>
            <span className={`role-tag ${user?.role}`}>{user?.role}</span>
          </div>
          <button className="btn sm" onClick={onLogout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
