import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function cleanRtf(raw: string) {
  return raw
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\tab/g, "\t")
    .replace(/\\'[0-9a-fA-F]{2}/g, " ")
    .replace(/\\[a-zA-Z]+\d* ?/g, " ")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\n\s+/g, "\n");
}

function normalizeCode(value: string) {
  return value
    .replace(/из\s+/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function parseTextToRules(text: string) {
  const lines = text
    .split(/\n| {2,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  const result: any[] = [];

  let currentGroup = "";
  let currentProduct = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("Группа N") || line.startsWith("Группа №")) {
      currentGroup = line;
      continue;
    }

    const okpd2Match = line.match(/\d{2}\.\d{2}\.\d{2}\.\d{3}/);
    const tnvedMatch = line.match(/(?:из\s*)?\d{4}(?:\s?\d{2})?(?:\s?\d{2})?(?:\s?\d{2})?/i);

    if (!okpd2Match && !tnvedMatch) {
      if (
        !line.includes("Раздел") &&
        !line.includes("ПЕРЕЧЕНЬ") &&
        !line.includes("Наименование") &&
        line.length > 5
      ) {
        currentProduct = line;
      }
      continue;
    }

    if (okpd2Match) {
      const okpd2 = okpd2Match[0];

      let tnved = "";
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const possibleTnved = lines[j].match(
          /(?:из\s*)?\d{4}(?:\s?\d{2})?(?:\s?\d{2})?(?:\s?\d{2})?/i
        );

        if (possibleTnved) {
          tnved = normalizeCode(possibleTnved[0]);
          break;
        }
      }

      result.push({
        okpd2_code: okpd2,
        tnved_code: tnved,
        product_group: currentGroup || "Постановление №2414",
        product_name: currentProduct || "Не определено",
        source:
          "Постановление Правительства РФ от 29.12.2023 №2414",
      });
    }
  }

  return result.filter((item) => item.okpd2_code || item.tnved_code);
}

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
    const fileName = file.name.toLowerCase();

    let prepared: any[] = [];

    if (
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".csv")
    ) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      prepared = rows.map((row) => ({
        tnved_code: String(
          row["tnved_code"] ||
            row["ТН ВЭД"] ||
            row["ТНВЭД"] ||
            ""
        ).trim(),
        okpd2_code: String(
          row["okpd2_code"] ||
            row["ОКПД2"] ||
            row["ОКПД 2"] ||
            ""
        ).trim(),
        product_group: String(
          row["product_group"] ||
            row["Группа"] ||
            row["Группа товаров"] ||
            "Экосбор"
        ).trim(),
        product_name: String(
          row["product_name"] ||
            row["Наименование"] ||
            row["Товар"] ||
            ""
        ).trim(),
        source:
          "Постановление Правительства РФ от 29.12.2023 №2414",
      }));
    } else if (fileName.endsWith(".rtf") || fileName.endsWith(".txt")) {
      let rawText = buffer.toString("utf8");

      if (rawText.includes("\\rtf")) {
        rawText = cleanRtf(rawText);
      }

      prepared = parseTextToRules(rawText);
    } else {
      return NextResponse.json(
        {
          error:
            "Поддерживаются только .xlsx, .xls, .csv, .rtf, .txt",
        },
        { status: 400 }
      );
    }

    const filtered = prepared.filter(
      (item) => item.tnved_code || item.okpd2_code
    );

    if (filtered.length === 0) {
      return NextResponse.json(
        {
          error:
            "Не удалось найти строки с ТН ВЭД или ОКПД2. Лучше загрузить Excel/CSV или TXT после копирования таблицы из Word.",
        },
        { status: 400 }
      );
    }

    const batchSize = 500;
let imported = 0;

for (let i = 0; i < filtered.length; i += batchSize) {
  const batch = filtered.slice(i, i + batchSize);

  const { error } = await supabase
    .from("eco_fee_rules_2414")
    .insert(batch);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  imported += batch.length;
}

    return NextResponse.json({
      imported,
    });
  } catch (error: any) {
    console.error("IMPORT ECO 2414 ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}