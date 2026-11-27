import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, login } from '../store/authSlice';
import AuthShell from '../components/AuthShell';
import { ErrorBox } from '../components/Feedback';

export default function Login() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const fieldError = (name) => error?.errors?.find((e) => e.field === name)?.message;
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // On success the auth slice stores the user and <GuestRoute> redirects away.
  const onSubmit = (e) => {
    e.preventDefault();
    console.log(form);
    
    dispatch(login(form));
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to raise or manage support tickets."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {!error?.errors?.length && <ErrorBox error={error} />}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} />
          {fieldError('email') && <span className="field-error">{fieldError('email')}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={onChange}
          />
          {fieldError('password') && <span className="field-error">{fieldError('password')}</span>}
        </div>

        <button className="btn primary block" disabled={loading}>
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
