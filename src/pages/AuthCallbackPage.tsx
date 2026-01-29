import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function AuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token");
  }, [location.search]);

  useEffect(() => {
    if (!token) {
      return;
    }
    authService.setToken(token);
    navigate("/", { replace: true });
  }, [navigate, token]);

  return (
    <div className="app-shell text-left">
      <section className="panel-hero">
        <p className="eyebrow">Auth Callback</p>
        <h1 className="hero-title">Signing you in…</h1>
        <p className="hero-subtitle">
          {token
            ? "Token stored. Redirecting you back home."
            : "Missing token. Please try signing in again."}
        </p>
      </section>
    </div>
  );
}
