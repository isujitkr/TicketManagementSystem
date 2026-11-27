import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../store/uiSlice';

function Toast({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), 3500);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div
      className={`toast ${toast.type}`}
      role="status"
      onClick={() => dispatch(removeToast(toast.id))}
    >
      {toast.message}
    </div>
  );
}

export default function Toaster() {
  const toasts = useSelector((s) => s.ui.toasts);
  return (
    <div className="toaster" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
