"use client";

import { useState } from "react";

export default function Eco2414Page() {
  const [status, setStatus] = useState("");

  const uploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setStatus("Загружаю справочник №2414...");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/smarti/import-eco-2414", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("Ошибка: " + data.error);
      return;
    }

    setStatus(`Загружено строк: ${data.imported}`);
  };

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <h1>♻️ Импорт справочника экосбора №2414</h1>

      <p>
        Загрузите Excel/CSV со столбцами: ТН ВЭД, ОКПД2, Группа, Наименование.
      </p>

      <input
        type="file"
        accept=".xlsx,.xls,.csv,.rtf,.txt"
        onChange={uploadFile}
      />

      {status && (
        <div style={{ marginTop: 20, color: "#2563eb" }}>
          {status}
        </div>
      )}
    </div>
  );
}