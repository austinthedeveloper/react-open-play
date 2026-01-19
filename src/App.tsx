import { NavLink, Route, Routes } from "react-router-dom";
import GoalsPage from "./pages/GoalsPage";
import MatchBuilderPage from "./pages/MatchBuilderPage";
import MatchHistoryPage from "./pages/MatchHistoryPage";

export default function App() {
  return (
    <div className="app-frame">
      <nav className="top-nav">
        <div className="nav-brand">Pickle Goals</div>
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
      </nav>

      <Routes>
        <Route path="/" element={<GoalsPage />} />
        <Route path="/match-builder" element={<MatchBuilderPage />} />
        <Route path="/match-builder/:id" element={<MatchBuilderPage />} />
        <Route path="/match-history" element={<MatchHistoryPage />} />
      </Routes>
    </div>
  );
}
