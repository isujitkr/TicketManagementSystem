import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, register } from '../store/authSlice';
import AuthShell from '../components/AuthShell';
import { ErrorBox } from '../components/Feedback';

export default function Register() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const fieldError = (name) => error?.errors?.find((e) => e.field === name)?.message;
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setLocalError('Passwords do not match');
      return;
    }
    setLocalError('');
    dispatch(register({ name: form.name, email: form.email, password: form.password }));
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Customer accounts can raise and track tickets."
      footer={
        <>
          Already registered? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {localError && <div className="alert error">{localError}</div>}
        {!error?.errors?.length && <ErrorBox error={error} />}

        <div className="form-group">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" autoComplete="name" value={form.name} onChange={onChange} />
          {fieldError('name') && <span className="field-error">{fieldError('name')}</span>}
        </div>

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
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
          />
          <small className="muted">At least 8 characters, with a letter and a number.</small>
          {fieldError('password') && <span className="field-error">{fieldError('password')}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={onChange}
          />
        </div>

        <button className="btn primary block" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
