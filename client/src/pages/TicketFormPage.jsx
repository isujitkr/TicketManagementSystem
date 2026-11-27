import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearCurrent,
  clearFormError,
  createTicket,
  fetchTicket,
  updateTicket,
} from '../store/ticketsSlice';
import { pushToast } from '../store/uiSlice';
import { CATEGORIES, PRIORITIES, label } from '../utils/format';
import { ErrorBox, Loader } from '../components/Feedback';

const emptyForm = { title: '', description: '', category: 'general', priority: 'medium' };

// One form for both "create" (/tickets/new) and "edit" (/tickets/:id/edit).
export default function TicketFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { current, currentLoading, currentError, saving, formError } = useSelector((s) => s.tickets);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(clearFormError());
    if (isEdit) dispatch(fetchTicket(id));
    return () => {
      dispatch(clearCurrent());
    };
  }, [dispatch, id, isEdit]);

  // populate the form once the ticket being edited has loaded
  useEffect(() => {
    if (isEdit && current && current._id === id) {
      setForm({
        title: current.title,
        description: current.description,
        category: current.category,
        priority: current.priority,
      });
    }
  }, [isEdit, current, id]);

  const fieldError = (name) => formError?.errors?.find((e) => e.field === name)?.message;
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await dispatch(updateTicket({ id, body: form })).unwrap();
        dispatch(pushToast('Ticket updated'));
        navigate(`/tickets/${id}`);
      } else {
        const ticket = await dispatch(createTicket(form)).unwrap();
        dispatch(pushToast('Ticket created'));
        navigate(`/tickets/${ticket._id}`);
      }
    } catch {
      /* the error is in the store (formError) and rendered below */
    }
  };

  if (isEdit && currentLoading) return <Loader />;
  if (isEdit && currentError) return <ErrorBox error={currentError} />;
  if (isEdit && current && current._id === id && current.status !== 'open') {
    return (
      <div className="card">
        <div className="alert info">Only tickets that are still open can be edited.</div>
        <Link to={`/tickets/${id}`} className="btn">Back to ticket</Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>{isEdit ? 'Edit ticket' : 'New ticket'}</h1>
      </div>

      <form className="card form-card" onSubmit={onSubmit} noValidate>
        {!formError?.errors?.length && <ErrorBox error={formError} />}

        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={onChange}
            maxLength={120}
            placeholder="Short summary of the problem"
          />
          {fieldError('title') && <span className="field-error">{fieldError('title')}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={7}
            value={form.description}
            onChange={onChange}
            maxLength={5000}
            placeholder="What happened? What did you expect? Any steps to reproduce?"
          />
          {fieldError('description') && <span className="field-error">{fieldError('description')}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={onChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{label(c)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" value={form.priority} onChange={onChange}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{label(p)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <Link to={isEdit ? `/tickets/${id}` : '/tickets'} className="btn">Cancel</Link>
          <button className="btn primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Submit ticket'}
          </button>
        </div>
      </form>
    </>
  );
}
