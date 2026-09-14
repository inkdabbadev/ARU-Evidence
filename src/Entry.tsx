import { lazy, Suspense } from 'react';
import App from './App';
const AdminDashboard = lazy(() => import('./analytics/AdminDashboard'));
export default function Entry() {
  const admin = /^\/admin(?:\/|$)/.test(window.location.pathname);
  return <Suspense fallback={<p>Loading…</p>}>{admin ? <AdminDashboard /> : <App />}</Suspense>;
}
