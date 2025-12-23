import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <h1 className="text-5xl font-bold text-brand">404</h1>
    <p className="mt-4 text-slate-500">The page you are looking for does not exist.</p>
    <Link to="/" className="mt-6 rounded bg-brand px-4 py-2 text-white">
      Go Home
    </Link>
  </div>
);

export default NotFoundPage;
