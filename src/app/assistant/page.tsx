"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const askAssistant = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      role: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer || "Нет ответа",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Ошибка соединения с AI-ассистентом",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div
  style={{
    padding: 30,
    maxWidth: 900,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  }}
>
      <h1>🤖 AI Ассистент Честный Знак</h1>

      <div
        style={{
          minHeight: 400,
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 20,
          marginTop: 20,
          marginBottom: 20,
          background: "#f9fafb",
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#6b7280" }}>
            Задайте вопрос по маркировке, этапам CRM или Честному Знаку.
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 10,
              background: msg.role === "user" ? "#dbeafe" : "white",
            }}
          >
            <strong>
              {msg.role === "user" ? "Вы" : "AI Ассистент"}
            </strong>
            <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && <div>AI думает...</div>}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Например: как ввести товар в оборот?"
        style={{
          width: "100%",
          height: 100,
          padding: 12,
          borderRadius: 10,
          border: "1px solid #ddd",
          marginBottom: 10,
          position: "relative",
          zIndex: 2,
          background: "white",
          color: "black",
        }}
      />

      <br />

      <button
        onClick={askAssistant}
        disabled={loading}
        style={{
          padding: "12px 20px",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          background: "#2563eb",
          color: "white",
        }}
      >
        {loading ? "Отправка..." : "Спросить"}
      </button>
    </div>
  );
}