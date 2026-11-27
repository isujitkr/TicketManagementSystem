import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/authSlice';
import { GuestRoute, ProtectedRoute, RoleRoute } from './components/guards';
import Toaster from './components/Toaster';
import Login from './pages/Login';
import Register from './pages/Register';
import MyTickets from './pages/MyTickets';
import TicketFormPage from './pages/TicketFormPage';
import TicketDetail from './pages/TicketDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminActivity from './pages/AdminActivity';
import NotFound from './pages/NotFound';

function HomeRedirect() {
  const user = useSelector((s) => s.auth.user);
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/tickets'} replace />;
}

export default function App() {
  const dispatch = useDispatch();

  // Verify the httpOnly cookie session once on startup.
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />

          <Route element={<RoleRoute roles={['user']} />}>
            <Route path="/tickets" element={<MyTickets />} />
            <Route path="/tickets/new" element={<TicketFormPage />} />
            <Route path="/tickets/:id/edit" element={<TicketFormPage />} />
          </Route>

          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/activity" element={<AdminActivity />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}
