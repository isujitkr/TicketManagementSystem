export const Loader = ({ text = 'Loading…' }) => (
  <div className="loader" role="status">
    <span className="spinner" />
    <span>{text}</span>
  </div>
);

export const FullPageLoader = () => (
  <div className="fullpage">
    <Loader />
  </div>
);

export const EmptyState = ({ title, children }) => (
  <div className="empty">
    <div className="empty-icon">🎫</div>
    <h3>{title}</h3>
    {children && <p>{children}</p>}
  </div>
);

export const ErrorBox = ({ error, children }) =>
  error ? (
    <div className="alert error" role="alert">
      {error.message || error}
      {children}
    </div>
  ) : null;
