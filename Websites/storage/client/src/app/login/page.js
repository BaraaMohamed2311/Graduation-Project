"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIsLoginContext } from "../../contexts/isLogin";
import { useUserDataContext } from "../../contexts/user_data";
import { loginUser } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { setIsLogin } = useIsLoginContext();
  const { setUser_Data } = useUserDataContext();

  const [form, setForm] = useState({ user_email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    setError("");
    if (!form.user_email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser(form);
      setUser_Data({
        user_id: data.user_id,
        user_name: data.user_name,
        user_email: data.user_email,
        token: data.token,
      });
      setIsLogin(true);
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">⚕</div>
        <h1 className="login-title">Hospital System</h1>
        <p className="login-sub">Sign in to your account</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="login-fields">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              name="user_email"
              placeholder="you@hospital.com"
              value={form.user_email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <button
          className="btn-primary login-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}
