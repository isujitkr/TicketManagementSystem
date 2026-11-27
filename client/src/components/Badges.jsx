import { label } from '../utils/format';

export const StatusBadge = ({ status }) => (
  <span className={`badge status-${status}`}>{label(status)}</span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`badge priority-${priority}`}>{label(priority)}</span>
);
