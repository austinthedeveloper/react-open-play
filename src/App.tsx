import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import GoalsPage from "./pages/GoalsPage";
import MatchBuilderPage from "./pages/MatchBuilderPage";
import MatchHistoryPage from "./pages/MatchHistoryPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { authService, type AuthUser } from "./services/authService";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState(() => authService.getToken());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setUser(null);
      setAuthReady(true);
      return () => {
        isActive = false;
      };
    }

    setAuthReady(false);
    try {
      authService
        .getProfile()
        .then((profile) => {
          if (isActive) {
            setUser(profile);
            setAuthReady(true);
          }
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : "Unable to load profile";
          console.warn(message);
          authService.clearToken();
          if (isActive) {
            setUser(null);
            setAuthReady(true);
          }
        });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load profile";
      console.warn(message);
      authService.clearToken();
      setUser(null);
      setAuthReady(true);
    }

    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    return authService.onTokenChange(setToken);
  }, []);

  const handleLogin = () => {
    try {
      window.location.assign(authService.getGoogleLoginUrl());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start login";
      console.warn(message);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to log out";
      console.warn(message);
    } finally {
      authService.clearToken();
      setUser(null);
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
          {authReady
            ? user
              ? (
                <div className="nav-user">
                  <span className="nav-user__name">
                    {user.displayName || user.email}
                  </span>
                  <button
                    type="button"
                    className="nav-logout-button"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              )
              : (
                <button
                  type="button"
                  className="nav-auth-button"
                  onClick={handleLogin}
                >
                  Sign in with Google
                </button>
              )
            : null}
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
