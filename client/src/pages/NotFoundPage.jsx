import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <section className="container page-narrow empty-state">
      <h1>Page not found</h1>
      <p>We couldn’t find that page. It may have moved.</p>
      <Link className="btn btn-primary" to="/">Back to the shop</Link>
    </section>
  );
}
