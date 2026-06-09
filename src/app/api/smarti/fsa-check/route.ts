import { NextResponse } from "next/server";

type FsaItem = {
  number?: string;
  status?: string;
  certStatus?: string;
  declStatus?: string;
  endDate?: string;
  dateEnd?: string;
  applicantName?: string;
  applicant?: string;
  productName?: string;
};

function normalizeStatus(text: string) {
  const value = text.toLowerCase();

  if (value.includes("действ")) return "действует";
  if (value.includes("прекращ")) return "прекращен";
  if (value.includes("приостанов")) return "приостановлен";
  if (value.includes("истек") || value.includes("истёк")) return "истек";
  if (value.includes("аннулир")) return "аннулирован";

  return text || "статус не определен";
}

async function checkFsa(certificateNumber: string) {
  const isDeclaration =
    certificateNumber.includes("Д-") ||
    certificateNumber.includes("D-");

  const url = isDeclaration
    ? "https://pub.fsa.gov.ru/api/v1/rds/common/declarations/get"
    : "https://pub.fsa.gov.ru/api/v1/rss/common/certificates/get";

  const body = {
    size: 10,
    page: 0,
    filter: {
      status: [],
      columnsSearch: [
        {
          name: "number",
          search: certificateNumber,
          type: 0,
          translated: false,
        },
      ],
      columnsSort: [
        {
          column: isDeclaration ? "declDate" : "certDate",
          sort: "DESC",
        },
      ],
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 SMARTI CRM",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  console.log("FSA RESPONSE STATUS:", response.status);
  console.log("FSA RESPONSE TEXT:", await response.clone().text());
  
  if (!response.ok) {
    return {
      found: false,
      status: "ошибка проверки ФСА",
      url: isDeclaration
        ? `https://pub.fsa.gov.ru/rds/declaration?q=${encodeURIComponent(certificateNumber)}`
        : `https://pub.fsa.gov.ru/rss/certificate?q=${encodeURIComponent(certificateNumber)}`,
    };
  }

  const data = await response.json();

  const items: FsaItem[] =
    data.items ||
    data.content ||
    data.data ||
    data.result ||
    [];

  const item = Array.isArray(items) ? items[0] : null;

  if (!item) {
    return {
      found: false,
      status: "не найден",
      url: isDeclaration
        ? `https://pub.fsa.gov.ru/rds/declaration?q=${encodeURIComponent(certificateNumber)}`
        : `https://pub.fsa.gov.ru/rss/certificate?q=${encodeURIComponent(certificateNumber)}`,
    };
  }

  const rawStatus =
    item.status ||
    item.certStatus ||
    item.declStatus ||
    "";

  return {
    found: true,
    status: normalizeStatus(String(rawStatus)),
    valid_to: item.endDate || item.dateEnd || null,
    applicant: item.applicantName || item.applicant || null,
    product_name: item.productName || null,
    url: isDeclaration
      ? `https://pub.fsa.gov.ru/rds/declaration?q=${encodeURIComponent(certificateNumber)}`
      : `https://pub.fsa.gov.ru/rss/certificate?q=${encodeURIComponent(certificateNumber)}`,
  };
}

export async function POST(req: Request) {
  try {
    const { certificateNumber } = await req.json();

    if (!certificateNumber) {
      return NextResponse.json({
        found: false,
        status: "номер не указан",
      });
    }

    const result = await checkFsa(String(certificateNumber).trim());

    return NextResponse.json(result);
  } catch (error) {
  console.error("FSA ERROR:", error);

  return NextResponse.json(
    {
      found: false,
      status: "ошибка проверки ФСА",
    },
    { status: 500 }
  );
}
}