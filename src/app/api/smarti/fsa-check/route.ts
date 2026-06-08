import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { certificateNumber } = await req.json();

    if (!certificateNumber) {
      return NextResponse.json({
        found: false,
        status: "номер не указан",
      });
    }

    const isDeclaration =
      certificateNumber.includes("Д-") ||
      certificateNumber.includes("D-");

    const url = isDeclaration
      ? `https://pub.fsa.gov.ru/rds/declaration?q=${encodeURIComponent(
          certificateNumber
        )}`
      : `https://pub.fsa.gov.ru/rss/certificate?q=${encodeURIComponent(
          certificateNumber
        )}`;

    return NextResponse.json({
      found: true,
      status: "открыть реестр ФСА",
      url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        found: false,
        status: "ошибка проверки",
      },
      { status: 500 }
    );
  }
}