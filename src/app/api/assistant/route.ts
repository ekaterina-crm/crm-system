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

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const lowerMessage = message.toLowerCase();

let searchWord = "";

if (lowerMessage.includes("шин")) {
  searchWord = "шины";
} else if (lowerMessage.includes("игруш")) {
  searchWord = "игрушки";
} else if (
  lowerMessage.includes("радио") ||
  lowerMessage.includes("электрон")
) {
  searchWord = "радиоэлектроника";
} else if (lowerMessage.includes("одеж")) {
  searchWord = "одежда";
} else if (lowerMessage.includes("обув")) {
  searchWord = "обувь";
} else if (lowerMessage.includes("вод")) {
  searchWord = "вода";
}

const { data: knowledge } = await supabase
  .from("knowledge_base")
  .select("*")
  .ilike("category", `%${searchWord}%`)
  .limit(5);

    const knowledgeText =
      knowledge && knowledge.length > 0
        ? knowledge
            .map(
              (item) => `
Название: ${item.title}
Категория: ${item.category}
Информация: ${item.content}
Источник: ${item.source_url || "не указан"}
`
            )
            .join("\n")
        : "Подходящих статей в базе знаний не найдено.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Ты AI-ассистент по системе маркировки Честный Знак.

Отвечай в первую очередь на основе найденных статей из базы знаний Supabase.

Найденные статьи:
${knowledgeText}

Правила:
- Если статьи найдены — используй их как главный источник.
- Если статей нет — напиши, что в базе знаний нет точной инструкции, и задай уточняющий вопрос.
- Не придумывай нормативные требования.
- Отвечай на русском языке.
- Отвечай конкретно и пошагово.
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
      knowledge,
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