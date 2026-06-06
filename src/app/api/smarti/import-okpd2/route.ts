import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });

    type Okpd2Row = {
  okpd2_code: string;
  name: string;
  keywords: string;
};

    const prepared: Okpd2Row[] = rows
      .map((row) => {
        const code =
          row["okpd2_code"] ||
          row["ОКПД2"] ||
          row["ОКПД 2"] ||
          row["Код"] ||
          row["Код ОКПД2"];

        const name =
          row["name"] ||
          row["Наименование"] ||
          row["Название"] ||
          row["Описание"];

        if (!code || !name) return null;

        return {
          okpd2_code: String(code).trim(),
          name: String(name).trim(),
          keywords: String(name).toLowerCase().trim(),
        };
      })
      .filter((item): item is Okpd2Row => item !== null);

    if (prepared.length === 0) {
      return NextResponse.json(
        { error: "Не найдены колонки ОКПД2 и Наименование" },
        { status: 400 }
      );
    }

    const batchSize = 500;
    let imported = 0;

    for (let i = 0; i < prepared.length; i += batchSize) {
      const batch = prepared.slice(i, i + batchSize);

      const { error } = await supabase
        .from("okpd2_reference")
        .insert(batch);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      imported += batch.length;
    }

    return NextResponse.json({ imported });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}