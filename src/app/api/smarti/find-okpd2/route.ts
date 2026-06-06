import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const description = normalize(body.description || "");

    if (!description) {
      return NextResponse.json(
        { error: "Нет описания товара" },
        { status: 400 }
      );
    }

    const words = description
      .split(" ")
      .filter((word: string) => word.length >= 4)
      .slice(0, 5);

    if (words.length === 0) {
      return NextResponse.json({ okpd2: null });
    }

    const search = words.join(" ");

    const { data, error } = await supabase
      .from("okpd2_reference")
      .select("okpd2_code, name")
      .textSearch("keywords", search, {
        type: "websearch",
        config: "russian",
      })
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ okpd2: null });
    }

    return NextResponse.json({
      okpd2: data[0].okpd2_code,
      okpd2_name: data[0].name,
      variants: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}