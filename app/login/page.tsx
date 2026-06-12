"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div className="loginwrap">
      <form className="logincard rise" onSubmit={submit}>
        <h1>homebase</h1>
        <p>mission control</p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="password"
          autoFocus
          aria-label="password"
        />
        {error && <div className="loginerr">wrong password</div>}
      </form>
    </div>
  );
}
