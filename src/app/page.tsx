"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Luxgenz
          </h1>
          <p className="mt-2 text-slate-400">Staff Portal</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-sm"
        >
          <h2 className="mb-6 text-xl font-semibold text-slate-100">
            Sign In
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
