"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type ExcelRow = Record<string, any>;

type SmartiResult = {
  product: string;
  tnved: string;
  okpd2: string;
  okpd2_name: string;
  marking: string;
  eco: string;
  certification: string;
  certificate_number: string;
  fsa_status: string;
  fsa_link: string;
  errors: string;
  comment: string;
};

const cardStyle: React.CSSProperties = {
  padding: 18,
  border: "1px solid #ddd",
  borderRadius: 14,
  background: "white",
};

const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#f3f4f6",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  verticalAlign: "top",
};

export default function SmartiPage() {
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<ExcelRow[]>([]);

  const [analysis, setAnalysis] = useState<SmartiResult[]>([]);
const [analyzing, setAnalyzing] = useState(false);

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setStatus("Файл загружается и анализируется...");
    setRows([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/smarti/analyze-excel", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("Ошибка: " + data.error);
        return;
      }

      setStatus(`Файл прочитан. Найдено строк: ${data.rowsCount}`);
      setRows(data.rows || []);
    } catch {
      setStatus("Ошибка загрузки файла");
    }
  };

  const analyzeRows = async () => {
  if (rows.length === 0) return;

  setAnalyzing(true);
  setAnalysis([]);

  const batchSize = 20;
  const allResults: SmartiResult[] = [];

  try {
    for (let i = 0; i < rows.length; i += batchSize) {
      setStatus(`SMARTI анализирует строки ${i + 1}–${Math.min(i + batchSize, rows.length)} из ${rows.length}`);

      const batch = rows.slice(i, i + batchSize);

      const res = await fetch("/api/smarti/analyze-rows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: batch,
        }),
      });

      const data = await res.json();

      if (data.result) {
        allResults.push(...data.result);
        setAnalysis([...allResults]);
      }
    }

    setStatus(`Анализ завершён. Обработано строк: ${allResults.length}`);
  } catch {
    setStatus("Ошибка анализа.");
  }

  setAnalyzing(false);
};

const exportAnalysis = () => {
  if (analysis.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(analysis);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SMARTI");

  XLSX.writeFile(workbook, "smarti-analysis.xlsx");
};

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ padding: 30, maxWidth: 1200, margin: "0 auto" }}>
      <h1>🤖 SMARTI</h1>

      <p style={{ color: "#555", fontSize: 18 }}>
        Умный помощник по маркировке Честный Знак, ТН ВЭД, ОКПД2 и экосбору.
      </p>

      <div style={cardStyle}>
        <h2>📊 Анализ Excel-файла</h2>

        <p>
          Загрузите файл с товарами. SMARTI будет проверять ТН ВЭД, ОКПД2,
          маркировку, экосбор и ошибки в ТЗ.
        </p>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          style={{ marginTop: 10 }}
        />

        {fileName && (
          <div style={{ marginTop: 15 }}>
            Выбран файл: <strong>{fileName}</strong>
          </div>
        )}

        {status && (
          <div style={{ marginTop: 10, color: "#2563eb" }}>
            {status}
          </div>
        )}
      </div>

      <div style={{ marginTop: 15 }}>
  <button
    onClick={analyzeRows}
    disabled={
      rows.length === 0 || analyzing
    }
    style={{
      padding: "12px 20px",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      background: "#2563eb",
      color: "white",
    }}
  >
    {analyzing
      ? "SMARTI анализирует..."
      : "🔍 Проанализировать первые строки"}
  </button>
</div>

      {rows.length > 0 && (
        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h2>Первые строки файла</h2>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      style={{
                        border: "1px solid #ddd",
                        padding: 8,
                        background: "#f3f4f6",
                        textAlign: "left",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {columns.map((col) => (
                      <td
                        key={col}
                        style={{
                          border: "1px solid #ddd",
                          padding: 8,
                          verticalAlign: "top",
                        }}
                      >
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {analysis.length > 0 && (
  <div
    style={{
      marginTop: 20,
      padding: 20,
      border: "1px solid #ddd",
      borderRadius: 14,
      background: "white",
    }}
  >
    <h2>🧠 Результат SMARTI</h2>

    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
  <tr>
    <th style={thStyle}>Товар</th>
<th style={thStyle}>ТН ВЭД</th>
<th style={thStyle}>ОКПД2</th>
<th style={thStyle}>Наименование ОКПД2</th>
<th style={thStyle}>Честный Знак</th>
<th style={thStyle}>Экосбор</th>
<th style={thStyle}>Сертификация</th>
<th style={thStyle}>Документ</th>
<th style={thStyle}>Статус ФСА</th>
<th style={thStyle}>Проверка ФСА</th>
<th style={thStyle}>Ошибки ТЗ</th>
<th style={thStyle}>Комментарий</th>
  </tr>
</thead>

        <tbody>
  {analysis.map((item, index) => (
    <tr key={index}>
      <td style={tdStyle}>{item.product}</td>
      <td style={tdStyle}>{item.tnved}</td>
      <td style={tdStyle}>{item.okpd2}</td>
      <td style={tdStyle}>{item.okpd2_name}</td>
      <td style={tdStyle}>{item.marking}</td>
      <td style={tdStyle}>{item.eco}</td>
      <td style={tdStyle}>{item.certification}</td>
      <td style={tdStyle}>{item.certificate_number}</td>
      <td style={tdStyle}>{item.fsa_status}</td>
      <td style={tdStyle}>
  {item.fsa_link ? (
    <a
      href={item.fsa_link}
      target="_blank"
      rel="noreferrer"
    >
      Проверить
    </a>
  ) : (
    "-"
  )}
</td>
      <td style={tdStyle}>{item.errors}</td>
      <td style={tdStyle}>{item.comment}</td>
    </tr>
  ))}
</tbody>
      </table>
    </div>

    <button
      onClick={exportAnalysis}
      style={{
        marginTop: 15,
        padding: "12px 20px",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        background: "#16a34a",
        color: "white",
      }}
    >
      Скачать результат Excel
    </button>
  </div>
)}
    </div>
  );
}