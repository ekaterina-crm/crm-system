"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function KnowledgePage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [status, setStatus] = useState("");

  const saveKnowledge = async () => {
    if (!title || !category || !content) {
      setStatus("Заполните название, категорию и текст.");
      return;
    }

    const { error } = await supabase.from("knowledge_base").insert({
      title,
      category,
      content,
      source_url: sourceUrl,
    });

    if (error) {
      setStatus("Ошибка: " + error.message);
      return;
    }

    setTitle("");
    setCategory("");
    setContent("");
    setSourceUrl("");
    setStatus("Статья добавлена в базу знаний.");
  };

  return (
    <div style={{ padding: 30, maxWidth: 900, margin: "0 auto" }}>
      <h1>📚 База знаний Честный Знак</h1>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название статьи"
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 10,
        }}
      />

      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Категория: шины, игрушки, радиоэлектроника..."
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 10,
        }}
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Текст инструкции"
        style={{
          width: "100%",
          height: 220,
          padding: 12,
          marginBottom: 10,
        }}
      />

      <input
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        placeholder="Ссылка на источник"
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 10,
        }}
      />

      <button
        onClick={saveKnowledge}
        style={{
          padding: "12px 20px",
          border: "none",
          borderRadius: 8,
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
        }}
      >
        Сохранить в базу знаний
      </button>

      {status && <div style={{ marginTop: 15 }}>{status}</div>}
    </div>
  );
}