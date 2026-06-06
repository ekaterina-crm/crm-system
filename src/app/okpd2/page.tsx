"use client";

import { useState } from "react";

export default function Okpd2ImportPage() {
  const [status, setStatus] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Загружаю справочник ОКПД2...");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/smarti/import-okpd2", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("Ошибка: " + data.error);
      return;
    }

    setStatus(`Готово. Загружено строк: ${data.imported}`);
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Импорт ОКПД2</h1>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
      />

      {status && <p>{status}</p>}
    </div>
  );
}