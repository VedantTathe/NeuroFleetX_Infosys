import { useState } from "react";

const ROLES = [
  "Customer",
  "Driver",
  "Fleet Manager",
  "Admin",
];

export default function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Customer",
  });

  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem("users")) || [];
    } catch {
      return [];
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const register = () => {
    const users = getUsers();

    if (users.find((u) => u.email === form.email)) {
      alert("User already exists");
      return;
    }

    users.push(form);
    localStorage.setItem("users", JSON.stringify(users));
    alert("Registration successful");
    setMode("login");
  };

  const login = () => {
    const users = getUsers();
    const user = users.find(
      (u) =>
        u.email === form.email &&
        u.password === form.password &&
        u.role === form.role
    );

    if (!user) {
      alert("Invalid credentials or role");
      return;
    }

    alert(`Welcome ${user.role}: ${user.name}`);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="brand">NeuroFleetX</h1>
        <p className="subtitle">
          Smart Fleet & Logistics Platform
        </p>

        <h2>{mode === "login" ? "Sign In" : "Create Account"}</h2>

        {mode === "signup" && (
          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
          />
        )}

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <select name="role" onChange={handleChange}>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>

        <button
          className="primary-btn"
          onClick={mode === "login" ? login : register}
        >
          {mode === "login" ? "Login" : "Register"}
        </button>

        <p className="switch">
          {mode === "login"
            ? "New user?"
            : "Already registered?"}
          <span onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? " Create account" : " Login"}
          </span>
        </p>
      </div>
    </div>
  );
}
