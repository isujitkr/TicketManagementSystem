import { formatDate } from '../utils/format';

export default function ActivityTimeline({ items }) {
  if (!items.length) return <p className="muted">No activity recorded yet.</p>;

  return (
    <ol className="timeline">
      {items.map((a) => (
        <li key={a._id}>
          <span className={`dot ${a.type.replace('.', '-')}`} />
          <div>
            <div>{a.message}</div>
            <small className="muted">{formatDate(a.createdAt)}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
