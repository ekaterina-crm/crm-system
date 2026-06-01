"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    console.log(error);
    alert(error.message);
    return;
  }

  console.log(data);
  window.location.href = "/";
};

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "100px auto",
      }}
    >
      <h1>Вход в CRM</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
        }}
      />

      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
        }}
      />

      <button
        onClick={login}
        style={{
          width: "100%",
          padding: 10,
        }}
      >
        Войти
      </button>
    </div>
  );
}