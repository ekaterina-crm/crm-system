import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Ты эксперт по маркировке Честный Знак.

Этапы CRM:
1. Получение/проверка ТЗ
2. Регистрация/баланс
3. Создание карточек
4. Заказ и выпуск кодов
5. Отправка кодов
6. Отчет о нанесении
7. Таможня и ввод в оборот
8. Завершение/проверка

Отвечай как специалист по маркировке.
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return NextResponse.json({
      answer: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("ASSISTANT ERROR:", error);

    return NextResponse.json(
      {
        answer: "Ошибка AI-ассистента. Посмотрите терминал VS Code.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}