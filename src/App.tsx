import { NavLink, Route, Routes } from "react-router-dom";
import GoalsPage from "./pages/GoalsPage";
import MatchBuilderPage from "./pages/MatchBuilderPage";
import MatchHistoryPage from "./pages/MatchHistoryPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { authService } from "./services/authService";

export default function App() {
  const handleLogin = () => {
    try {
      window.location.assign(authService.getGoogleLoginUrl());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start login";
      console.warn(message);
    }
  };

  return (
    <div className="app-frame">
      <nav className="top-nav">
        <div className="nav-brand">Pickle Goals</div>
        <div className="nav-actions">
          <div className="nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-link${isActive ? " is-active" : ""}`
              }
            >
              Goals
            </NavLink>
            <NavLink
              to="/match-builder"
              className={({ isActive }) =>
                `nav-link${isActive ? " is-active" : ""}`
              }
            >
              Match Builder
            </NavLink>
            <NavLink
              to="/match-history"
              className={({ isActive }) =>
                `nav-link${isActive ? " is-active" : ""}`
              }
            >
              Match History
            </NavLink>
          </div>
          <button type="button" className="nav-auth-button" onClick={handleLogin}>
            Sign in with Google
          </button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<GoalsPage />} />
        <Route path="/match-builder" element={<MatchBuilderPage />} />
        <Route path="/match-builder/:id" element={<MatchBuilderPage />} />
        <Route path="/match-history" element={<MatchHistoryPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </div>
  );
}
