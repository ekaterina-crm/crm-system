"use client";

import { useState } from "react";

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");

  const askAssistant = async () => {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    setAnswer(data.answer);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Ассистент Честный Знак</h1>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Введите вопрос..."
        style={{
          width: "100%",
          height: 120,
          marginBottom: 10,
        }}
      />

      <br />

      <button onClick={askAssistant}>
        Спросить
      </button>

      {answer && <div>{answer}</div>}
    </div>
  );
}