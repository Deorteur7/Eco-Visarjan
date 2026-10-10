import { Link, NavLink, Outlet } from 'react-router';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/check', label: 'Check My Idol' },
  { to: '/map', label: 'Map' },
  { to: '/risk', label: 'Risk estimator' },
  { to: '/impact', label: 'Impact' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 no-underline" aria-label="EcoVisarjan home">
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="#b3141b" />
        <path d="M16 5c4 5.2 7 8.6 7 12.2A7 7 0 0 1 9 17.2C9 13.6 12 10.2 16 5z" fill="#fff" />
        <path d="M12.5 18.5a3.8 3.8 0 0 0 3.5 3.3" fill="none" stroke="#b3141b" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="font-serif text-xl font-bold text-ink">EcoVisarjan</span>
    </Link>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b-4 border-kumkum bg-turmeric">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <nav aria-label="Main" className="-mx-1 flex flex-wrap gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-semibold no-underline ${
                    isActive ? 'bg-ink text-white' : 'text-ink hover:bg-white/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

    </div>
  );
}
