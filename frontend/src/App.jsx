import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import TestPage from "./pages/TestPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TargetListsPage from "./pages/TargetListsPage";
import CreateTargetListPage from "./pages/CreateTargetListPage";
import TargetListDetailPage from "./pages/TargetListDetailPage";
import FindTargetsPage from "./pages/FindTargetsPage";
import SpeciesHotspotsPage from "./pages/SpeciesHotspotsPage";

function NavBar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/lists" className="text-lg font-bold text-gray-900">
          tbird
        </Link>
        <Link
          to="/lists"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          My Lists
        </Link>
        <Link
          to="/test"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          eBird Explorer
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user.email}</span>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <NavBar />
      <div className="p-8">{children}</div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/lists"
        element={
          <ProtectedLayout>
            <TargetListsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/lists/new"
        element={
          <ProtectedLayout>
            <CreateTargetListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/lists/:listId"
        element={
          <ProtectedLayout>
            <TargetListDetailPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/lists/:listId/find"
        element={
          <ProtectedLayout>
            <FindTargetsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/lists/:listId/species/:speciesCode/find"
        element={
          <ProtectedLayout>
            <SpeciesHotspotsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/test"
        element={
          <ProtectedLayout>
            <TestPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/lists" replace />} />
    </Routes>
  );
}

export default App;
