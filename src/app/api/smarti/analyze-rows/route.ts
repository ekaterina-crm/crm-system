import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getTnvedFromRow = (row: any) => {
  const key = Object.keys(row).find((k) => {
    const normalized = k.toLowerCase().replace(/\s/g, "");
    return (
      normalized.includes("тнвэд") ||
      normalized.includes("тнвед") ||
      normalized.includes("кодтнвэд") ||
      normalized.includes("кодтнвед") ||
      normalized.includes("tnved")
    );
  });

  return key ? String(row[key]).replace(/\D/g, "") : "";
};

const getProductFromRow = (row: any) => {
  const key = Object.keys(row).find((k) => {
    const normalized = k.toLowerCase();
    return (
      normalized.includes("описание") ||
      normalized.includes("наименование") ||
      normalized.includes("товар") ||
      normalized.includes("product")
    );
  });

  return key ? String(row[key]) : "товар из Excel";
};

export async function POST(req: Request) {
  try {
    const { rows } = await req.json();

    const getCertificateFromRow = (row: any) => {
  const key = Object.keys(row).find((k) => {
    const normalized = k.toLowerCase();

    return (
      normalized.includes("сертификат") ||
      normalized.includes("декларац") ||
      normalized.includes("номер и дата") ||
      normalized.includes("документ")
    );
  });

  return key ? String(row[key]).trim() : "";
};

    const tnvedCodes = rows
      .map((row: any) => getTnvedFromRow(row))
      .filter(Boolean);

    const ecoSearchParts = tnvedCodes.flatMap((code: string) => {
  const p4 = code.slice(0, 4);
  const p6 = code.slice(0, 6);

  return [
    `tnved_code.ilike.%${p4}%`,
    `tnved_code.ilike.%${p6}%`,
    `tnved_code.ilike.%${code}%`
  ];
});

    const { data: allEcoRules2414, error: ecoRulesError } = await supabase
  .from("eco_fee_rules_2414")
  .select("tnved_code, okpd2_code, product_group, product_name, tnved_name");

if (ecoRulesError) {
  console.error("ECO RULES ERROR:", ecoRulesError);
}

const ecoRules2414 = (allEcoRules2414 || []).filter((rule: any) =>
  tnvedCodes.some((code: string) =>
    code.startsWith(String(rule.tnved_code || ""))
  )
);

    const { data: confirmedEcoCodes } = await supabase
      .from("confirmed_eco_tnved")
      .select("tnved_code, comment");

    const { data: markingRules } = await supabase
      .from("marking_rules")
      .select("tnved_prefix, product_group, marking_required, comment");

    const { data: okpd2Rules } = await supabase
      .from("okpd2_reference")
      .select("okpd2_code, name, keywords");

      const { data: tnvedOkpd2Mapping } = await supabase
  .from("tnved_okpd2_mapping")
  .select("*");

      const { data: certificationRules } = await supabase
  .from("certification_rules")
  .select("*");

    const stopWords = [
  "для", "или", "из", "на", "по", "в", "во", "под", "без", "с", "со",
  "товар", "изделие", "изделия", "набор", "прочие", "разные"
];

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const findOkpd2 = (text: string, tnvedCode: string) => {
  const normalized = normalizeText(text);

  const words = normalized
    .split(" ")
    .filter((word: string) => word.length >= 4)
    .filter((word: string) => !stopWords.includes(word));

  if (words.length === 0) return null;

  let bestMatch: any = null;
  let bestScore = 0;

  for (const rule of okpd2Rules || []) {
    const ruleText = normalizeText(
      `${rule.okpd2_code || ""} ${rule.name || ""} ${rule.keywords || ""}`
    );

    let score = 0;

    for (const word of words) {
      if (ruleText.includes(word)) score += 3;

      const stem = word.slice(0, 5);
      if (stem.length >= 5 && ruleText.includes(stem)) score += 1;
    }

    if (ruleText.includes(normalized)) score += 8;

    if (
      tnvedCode.startsWith("4819") &&
      ruleText.includes("бумаг")
    ) {
      score += 10;
    }

    if (
      tnvedCode.startsWith("392") &&
      ruleText.includes("пластмасс")
    ) {
      score += 10;
    }

    if (
      tnvedCode.startsWith("8516") &&
      (ruleText.includes("чайник") ||
        ruleText.includes("электр"))
    ) {
      score += 10;
    }

    if (
      tnvedCode.startsWith("9405") &&
      (ruleText.includes("ламп") ||
        ruleText.includes("светил"))
    ) {
      score += 10;
    }

    if (
      tnvedCode.startsWith("6306") &&
      (ruleText.includes("тент") ||
        ruleText.includes("палат"))
    ) {
      score += 10;
    }

    if (
      tnvedCode.startsWith("6406") &&
      ruleText.includes("обув")
    ) {
      score += 10;
    }

    if (
  normalized.includes("стекл") &&
  ruleText.includes("пластмасс")
) {
  continue;
}

if (
  normalized.includes("пласт") &&
  ruleText.includes("стекл")
) {
  continue;
}

if (
  normalized.includes("чайник") &&
  !ruleText.includes("чайник")
) {
  score = 0;
}

if (
  normalized.includes("лампоч") &&
  !ruleText.includes("ламп")
) {
  score = 0;
}

    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  return bestScore >= 8 ? bestMatch : null;
};

    const applyChecks = (items: any[]) => {
      return items.map((item: any, index: number) => {
        const row = rows[index] || {};
        const product = item.product || getProductFromRow(row);
        const tnved =
          getTnvedFromRow(row) ||
          String(item.tnved || "").replace(/\D/g, "");

const certificateNumber = getCertificateFromRow(row);

        const ecoMatches = (ecoRules2414 || [])
  .map((rule: any) => {
    const ruleText = `${rule.tnved_code || ""} ${rule.tnved_name || ""}`;
    const codesInRule = ruleText.match(/\d{4,10}/g) || [];

    const matchedCode = codesInRule
      .map((code: string) => String(code).replace(/\D/g, ""))
      .filter((code: string) => code.length >= 4)
      .filter((code: string) => tnved && tnved.startsWith(code))
      .sort((a: string, b: string) => b.length - a.length)[0];

    return matchedCode
      ? {
          ...rule,
          matchedCode,
        }
      : null;
  })
  .filter(Boolean)
  .sort((a: any, b: any) => b.matchedCode.length - a.matchedCode.length);

const ecoMatch = ecoMatches[0] || null;

if (tnved === "8539520009") {
  console.log("LAMPS ECO MATCH:", ecoMatch);
}

        const confirmedEcoMatch = (confirmedEcoCodes || []).find((rule: any) => {
          const ruleCode = String(rule.tnved_code || "").replace(/\D/g, "");
          return ruleCode && tnved && tnved.startsWith(ruleCode);
        });

        const tnvedOkpd2Match = (tnvedOkpd2Mapping || []).find(
  (rule: any) =>
    tnved &&
    tnved.startsWith(String(rule.tnved_prefix))
);

        const okpd2Match = findOkpd2(
  `${product} ${getProductFromRow(row)}`,
  tnved
);

        const certificationMatch = (certificationRules || []).find(
  (rule: any) =>
    tnved &&
    tnved.startsWith(String(rule.tnved_prefix))
);

const gptOkpd2 =
/^\d{2}\.\d{2}\.\d{2}\.\d{3}$/.test(String(item.okpd2 || ""))
  ? item.okpd2
  : null;

        return {
  ...item,
  product,
  tnved,

    okpd2: tnvedOkpd2Match
  ? tnvedOkpd2Match.okpd2_code
  : okpd2Match
  ? okpd2Match.okpd2_code
  : gptOkpd2 || "нужно уточнение",

  certificate_number: certificateNumber,
fsa_status: certificateNumber
  ? "открыть реестр ФСА"
  : "документ не указан",
fsa_link: certificateNumber
  ? certificateNumber.includes(" Д-") || certificateNumber.includes("Д-")
    ? `https://pub.fsa.gov.ru/rds/declaration?q=${encodeURIComponent(
        certificateNumber
      )}`
    : `https://pub.fsa.gov.ru/rss/certificate?q=${encodeURIComponent(
        certificateNumber
      )}`
  : "",

okpd2_name: tnvedOkpd2Match
  ? tnvedOkpd2Match.okpd2_name
  : okpd2Match
  ? okpd2Match.name
  : item.okpd2_name || "",
  eco: ecoMatch || confirmedEcoMatch ? "да" : "нет",
  certification: certificationMatch
  ? `${certificationMatch.document_type}${
      certificationMatch.tr_ts
        ? ` (${certificationMatch.tr_ts})`
        : ""
    }`
  : "требуется проверка",
 comment:
  (tnvedOkpd2Match
    ? `ОКПД2 найден по таблице ТН ВЭД→ОКПД2: ${tnvedOkpd2Match.okpd2_code}. `
    : okpd2Match
    ? `ОКПД2 найден по справочнику: ${okpd2Match.okpd2_code}. `
    : "") +
  (ecoMatch
    ? `Экосбор найден по Постановлению №2414: ${ecoMatch.tnved_code} ${
        ecoMatch.product_name || ""
      }`
    : confirmedEcoMatch
    ? `Экосбор найден в подтверждённом справочнике: ${confirmedEcoMatch.tnved_code}`
    : "Совпадение по экосбору не найдено"),
};
      });
    };

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Ты SMARTI — эксперт по маркировке Честный Знак, ТН ВЭД, ОКПД2 и экосбору.

Справочник маркировки Честный Знак:
${JSON.stringify(markingRules || [], null, 2)}

Важно:
- Экосбор НЕ определяй сам. Он будет проверен отдельно.
- ТН ВЭД не выдумывай, если информации недостаточно.
- ОКПД2 определяй по названию товара максимально вероятно.
- Для каждого товара обязательно возвращай okpd2 и okpd2_name.
- Код okpd2 должен быть только в формате 00.00.00.000, например 17.21.12.000.
- Нельзя возвращать ОКПД2 без точек, например 172112000 или 1901000000.
- Если не можешь определить корректный код ОКПД2, укажи okpd2 = "нужно уточнение" и okpd2_name = "".
- Для бытовых товаров, упаковки, электроники, инструментов, текстиля и хозяйственных товаров обязательно пытайся определить ОКПД2.

- Для ОКПД2 всегда возвращай не только код, но и наименование okpd2_name.

Верни СТРОГО JSON-массив без markdown и без пояснений.

Формат:
[
  {
  "product": "название товара",
  "tnved": "код или нужно уточнение",
  "okpd2": "код ОКПД2 в формате 00.00.00.000 или нужно уточнение",
  "okpd2_name": "наименование ОКПД2 или пустая строка",
  "marking": "да / нет / возможно",
  "eco": "да / нет",
  "certification": "требуется / не требуется",
  "errors": "ошибки в ТЗ",
  "comment": "что нужно уточнить"
}
]
`,
          },
          {
            role: "user",
            content: JSON.stringify(rows, null, 2),
          },
        ],
      });

      const text = response.choices[0].message.content || "[]";

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        result = [];
      }

      return NextResponse.json({
        result: applyChecks(result),
        raw: text,
      });
    } catch {
      const fallbackResult = rows.map((row: any) => ({
        product: getProductFromRow(row),
        tnved: getTnvedFromRow(row),
        okpd2: "нужно уточнение",
        marking: "нужно уточнение",
        eco: "нет",
        errors: "",
        comment: "",
      }));

      return NextResponse.json({
        result: applyChecks(fallbackResult),
        raw: "OpenAI недоступен, выполнена проверка по справочникам",
      });
    }
  } catch (error: any) {
    console.error("SMARTI ROW ANALYSIS ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}