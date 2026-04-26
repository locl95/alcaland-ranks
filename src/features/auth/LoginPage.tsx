import { useState, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "@/app/hooks";
import { setTokens } from "@/app/authSlice";
import { login } from "@/features/auth/authApi";
import { ApiError } from "@/shared/api/ApiError";
import { Spinner } from "@/shared/components/spinner";
import "./LoginPage.css";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { accessToken, refreshToken } = await login(username, password);
      dispatch(setTokens({ accessToken, refreshToken }));
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError("Invalid username or password.");
      } else {
        setError("Unable to connect to the server. Try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Spinner />
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Alcaland Ranks</h1>
          <p className="login-subtitle">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="username" className="login-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button
              type="submit"
              className="login-btn"
              disabled={isLoading || !username || !password}
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
