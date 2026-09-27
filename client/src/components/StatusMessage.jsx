export default function StatusMessage({ tone = 'info', live = 'polite', children, ...rest }) {
  if (!children) return null;
  return (
    <p className={`status status-${tone}`} role={live === 'assertive' ? 'alert' : 'status'} {...rest}>
      {children}
    </p>
  );
}
