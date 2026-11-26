import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <main className="auth-page" id="main">
      <section className="auth-aside" aria-hidden="true">
        <p className="brand brand-big">ToolShare</p>
        <p>Le matériel professionnel dont vous avez besoin, réservé en magasin pour le créneau qu’il vous faut.</p>
      </section>
      <section className="auth-card">
        <Outlet />
      </section>
    </main>
  );
}
