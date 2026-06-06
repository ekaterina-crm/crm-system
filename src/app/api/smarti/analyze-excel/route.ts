import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не найден" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rowsRaw: any[][] = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: "",
});

const headerRowIndex = rowsRaw.findIndex((row) =>
  row.some((cell) =>
    String(cell).toLowerCase().replace(/\s/g, "").includes("кодтнвэд") ||
    String(cell).toLowerCase().replace(/\s/g, "").includes("кодтнвед") ||
    String(cell).toLowerCase().replace(/\s/g, "").includes("тнвэд") ||
    String(cell).toLowerCase().replace(/\s/g, "").includes("тнвед")
  )
);

if (headerRowIndex === -1) {
  return NextResponse.json(
    { error: "Не найдена строка заголовков с колонкой ТН ВЭД" },
    { status: 400 }
  );
}

const headers = rowsRaw[headerRowIndex].map((h) =>
  String(h || "").trim()
);

const rows = rowsRaw
  .slice(headerRowIndex + 1)
  .map((row) => {
    const obj: Record<string, any> = {};

    headers.forEach((header, index) => {
      if (header) {
        obj[header] = row[index];
      }
    });

    return obj;
  })
  .filter((row) => {
  const tnvedKey = Object.keys(row).find((key) =>
    key.toLowerCase().replace(/\s/g, "").includes("тнвэд") ||
    key.toLowerCase().replace(/\s/g, "").includes("тнвед")
  );

  if (!tnvedKey) return false;

  const tnved = String(row[tnvedKey] || "").replace(/\D/g, "");

  return tnved.length >= 4;
});

    return NextResponse.json({
      fileName: file.name,
      rowsCount: rows.length,
      rows,
    });
  } catch (error: any) {
    console.error("SMARTI EXCEL ERROR:", error);

    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}