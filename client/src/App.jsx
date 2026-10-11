import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import CheckIdol from './pages/CheckIdol.jsx';
import Home from './pages/Home.jsx';
import Impact from './pages/Impact.jsx';
import Risk from './pages/Risk.jsx';

// The map page pulls in MapLibre GL (a large library), so it loads only when opened.
const MapPage = lazy(() => import('./pages/MapPage.jsx'));

function NotFound() {
  return (
    <div className="card text-center">
      <h1 className="text-2xl">Page not found</h1>
      <p className="mt-2 text-muted">That page does not exist.</p>
      <Link to="/" className="btn btn-primary mt-4">
        Back to home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="check" element={<CheckIdol />} />
        <Route
          path="map"
          element={
            <Suspense fallback={<Spinner label="Loading the map" />}>
              <MapPage />
            </Suspense>
          }
        />
        <Route path="risk" element={<Risk />} />
        <Route path="impact" element={<Impact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
