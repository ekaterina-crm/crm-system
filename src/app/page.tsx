"use client";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

const stages = [
  "Получение/проверка ТЗ",
  "Регистрация/баланс",
  "Создание карточек",
  "Заказ и выпуск кодов",
  "Отправка кодов",
  "Отчет о нанесении",
  "Таможня и ввод в оборот",
  "Завершение/проверка",
];

export default function Home() {
  const [deals, setDeals] = useState<any[]>([]);
  const [client, setClient] = useState("");
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const [role, setRole] = useState("");

  const [search, setSearch] = useState("");

  const [manager, setManager] =
  useState("");

const [editManager, setEditManager] =
  useState("");

  const [newManager, setNewManager] =
  useState("");

  const [managers, setManagers] =
  useState<any[]>([]);

  const [history, setHistory] =
  useState<any[]>([]);

  const [newPassword, setNewPassword] =
  useState("");

  const [backupFile, setBackupFile] =
  useState<File | null>(null);

const [repeatPassword, setRepeatPassword] =
  useState("");

  const [activeTab, setActiveTab] =
  useState<string>("deals");

  const [editingDeal, setEditingDeal] =
   useState<any>(null);

   const [darkMode, setDarkMode] =
  useState(false);

const [editClient, setEditClient] = useState("");
const [editComment, setEditComment] = useState("");
const [editPhone, setEditPhone] = useState("");
const [editEmail, setEditEmail] = useState("");
const [editAmount, setEditAmount] = useState("");
const [editDeadline, setEditDeadline] = useState("");
const [editStage, setEditStage] = useState("");

const [comments, setComments] = useState<any[]>([]);
const [newComment, setNewComment] = useState("");

const [files, setFiles] = useState<any[]>([]);
const [selectedFile, setSelectedFile] =
  useState<File | null>(null);

  const router = useRouter();

const activeDeals = deals.filter(
  (deal) => !deal.archived
);

const totalDeals = activeDeals.length;

const completedDeals = activeDeals.filter(
  (deal) => deal.stage === "Завершение/проверка"
).length;

const totalAmount = activeDeals.reduce(
  (sum, deal) =>
    sum + Number(deal.amount || 0),
  0
);

const overdueDeals = activeDeals.filter(
  (deal) =>
    deal.deadline &&
    new Date(deal.deadline) < new Date() &&
    deal.stage !== "Завершение/проверка"
).length;
 useEffect(() => {
  checkUser();
  fetchDeals();
  fetchManagers();
}, []);

const checkUser = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    router.push("/login");
    return;
  }

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("email", session.user.email)
    .single();

  if (data) {
    setRole(data.role);
  }

  fetchDeals();
};

const changePassword = async () => {
  if (!newPassword) {
    alert("Введите пароль");
    return;
  }

  if (newPassword !== repeatPassword) {
    alert("Пароли не совпадают");
    return;
  }

  const { error } =
    await supabase.auth.updateUser({
      password: newPassword,
    });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Пароль успешно изменён");

  setNewPassword("");
  setRepeatPassword("");
};

const fetchDeals = async () => {
  const { data, error } = await supabase
    .from("deals")
    .select("*");

  if (!error && data) {
    setDeals(data);
  }
};

const fetchManagers = async () => {
  const { data, error } = await supabase
    .from("managers")
    .select("*")
    .order("name");

  console.log("MANAGERS:", data);
  console.log("ERROR:", error);

  setManagers(data || []);
};

const fetchComments = async (dealId: number) => {
  const { data, error } = await supabase
    .from("deal_comments")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", {
      ascending: false,
    });

  if (!error && data) {
    setComments(data);
  }
};

const fetchHistory = async (
  dealId: number
) => {
  const { data } =
    await supabase
      .from("deal_history")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", {
        ascending: false,
      });

  setHistory(data || []);
};

const addManager = async () => {
  if (!newManager.trim()) return;

  await supabase
    .from("managers")
    .insert([
      {
        name: newManager,
      },
    ]);

  setNewManager("");
  fetchManagers();
};

const deleteManager = async (
  id: number
) => {
  alert("Удаляем менеджера " + id);

  const { data, error } = await supabase
    .from("managers")
    .delete()
    .eq("id", id)
    .select();

  console.log("DELETE DATA:", data);
  console.log("DELETE ERROR:", error);

  alert(JSON.stringify(data));

  if (error) {
    alert(error.message);
    return;
  }

  alert("Удалено");

  fetchManagers();
};

const fetchFiles = async (dealId: number) => {
  const { data, error } = await supabase
    .from("deal_files")
    .select("*")
    .eq("deal_id", dealId);

  if (!error && data) {
    setFiles(data);
  }
};

const uploadFile = async () => {
  if (!selectedFile || !editingDeal)
    return;

  const filePath =
    `${editingDeal.id}/${Date.now()}-${selectedFile.name}`;

  const { data, error } =
    await supabase.storage
      .from("deal-files")
      .upload(filePath, selectedFile);

  console.log("UPLOAD DATA:", data);
  console.log("UPLOAD ERROR:", error);

  if (error) {
    alert(error.message);
    return;
  }

  const { error: dbError } =
    await supabase
      .from("deal_files")
      .insert([
        {
          deal_id: editingDeal.id,
          file_name: selectedFile.name,
          file_path: filePath,
        },
      ]);

  console.log("DB ERROR:", dbError);

  if (dbError) {
    alert(dbError.message);
    return;
  }

  fetchFiles(editingDeal.id);

  alert("Файл загружен");
};

const deleteFile = async (
  fileId: number,
  filePath: string
) => {
  console.log(
  "DELETE FILE:",
  fileId,
  filePath
);

  const confirmed = confirm(
    "Удалить файл?"
  );

  if (!confirmed) return;

  const { error: storageError } =
    await supabase.storage
      .from("deal-files")
      .remove([filePath]);

  console.log(
    "STORAGE DELETE:",
    storageError
  );

  const { error: dbError } =
    await supabase
      .from("deal_files")
      .delete()
      .eq("id", fileId);

  console.log(
    "DB DELETE:",
    dbError
  );

  fetchFiles(editingDeal.id);
};

const exportExcel = () => {
  const worksheet =
    XLSX.utils.json_to_sheet(deals);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Deals"
  );

  const excelBuffer = XLSX.write(
    workbook,
    {
      bookType: "xlsx",
      type: "array",
    }
  );

  const file = new Blob(
    [excelBuffer],
    {
      type:
        "application/octet-stream",
    }
  );

  saveAs(file, "crm-deals.xlsx");
};

const exportBackup = async () => {
  const { data: dealsData } =
    await supabase
      .from("deals")
      .select("*");

  const { data: managersData } =
    await supabase
      .from("managers")
      .select("*");

  const { data: historyData } =
    await supabase
      .from("deal_history")
      .select("*");

  const workbook =
    XLSX.utils.book_new();

  const dealsSheet =
    XLSX.utils.json_to_sheet(
      dealsData || []
    );

  const managersSheet =
    XLSX.utils.json_to_sheet(
      managersData || []
    );

  const historySheet =
    XLSX.utils.json_to_sheet(
      historyData || []
    );

  XLSX.utils.book_append_sheet(
    workbook,
    dealsSheet,
    "Deals"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    managersSheet,
    "Managers"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    historySheet,
    "History"
  );

  const excelBuffer =
    XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

  const file = new Blob(
    [excelBuffer],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  saveAs(
    file,
    `crm-backup-${date}.xlsx`
  );
};

const restoreBackup = async () => {
  if (!backupFile) {
    alert("Выберите файл");
    return;
  }

  const ok = confirm(
    "ВНИМАНИЕ!\n\nВсе текущие сделки, менеджеры и история будут удалены и заменены данными из резервной копии.\n\nПродолжить?"
  );

  if (!ok) return;

  const data = await backupFile.arrayBuffer();

  const workbook = XLSX.read(data);

  const deals = XLSX.utils.sheet_to_json(
    workbook.Sheets["Deals"]
  );

  const managers = XLSX.utils.sheet_to_json(
    workbook.Sheets["Managers"]
  );

  const history = XLSX.utils.sheet_to_json(
    workbook.Sheets["History"]
  );

  // Очистка таблиц

  await supabase
    .from("deal_history")
    .delete()
    .neq("id", 0);

  await supabase
    .from("deals")
    .delete()
    .neq("id", 0);

  await supabase
    .from("managers")
    .delete()
    .neq("id", 0);

  // Загрузка данных

  if (managers.length > 0) {
    await supabase
      .from("managers")
      .insert(managers as any);
  }

  if (deals.length > 0) {
    await supabase
      .from("deals")
      .insert(deals as any);
  }

  if (history.length > 0) {
    await supabase
      .from("deal_history")
      .insert(history as any);
  }

  fetchDeals();
  fetchManagers();

  alert("CRM успешно восстановлена");
};

const onDragEnd = async (result: any) => {
  if (!result.destination) return;

  const dealId = Number(result.draggableId);
  const newStage =
    result.destination.droppableId;

  await supabase
    .from("deals")
    .update({
      stage: newStage,
    })
    .eq("id", dealId);

  await supabase
    .from("deal_history")
    .insert([
      {
        deal_id: dealId,
        action:
          `Перемещена на этап: ${newStage}`,
      },
    ]);

  fetchDeals();
};


 const addDeal = async () => {
  if (!client) return;

  const { data, error } = await supabase
  .from("deals")
  .insert([
    {
  client,
  comment,
  phone,
  email,
  amount,
  deadline,
  manager,
  stage: "Получение/проверка ТЗ",
}
  ])
  .select()
  .single();

  if (!error && data) {
    const historyResult = await supabase
  .from("deal_history")
  .insert([
    {
      deal_id: data.id,
      action: "Сделка создана",
    },
  ]);

console.log("HISTORY:", historyResult);
  await supabase
    .from("deal_history")
    .insert([
      {
        deal_id: data.id,
        action: "Сделка создана",
      },
    ]);
}

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  await fetchDeals();

  setClient("");
  setComment("");
  setPhone("");
  setEmail("");
  setAmount("");
  setManager("");
  setDeadline("");
};
const getStageColor = (stage: string) => {
  switch (stage) {
    case "Получение/проверка ТЗ":
      return "#e1c1f3";

    case "Регистрация/баланс":
      return "#fef3c7";

    case "Создание карточек":
      return "#dcfce7";

    case "Заказ и выпуск кодов":
      return "#f3d4ee";

    case "Отправка кодов":
      return "#bfdbfe";

    case "Отчет о нанесении":
      return "#fef3c7";

    case "Таможня и ввод в оборот":
      return "#dcfce7";
      
    case "Завершение/проверка":
      return "#bfdbfe";

    default:
      return "#e5e7eb";
  }
};
return (
  <div
    style={{
      display: "flex",
      minHeight: "100vh",
      background: darkMode
        ? "#111827"
        : "#f3f4f6",
      color: darkMode
        ? "white"
        : "black",
    }}
  >
      <div
  style={{
    width: 250,
    background: darkMode
      ? "#111827"
      : "white",
    color: darkMode
      ? "white"
      : "black",
    padding: 12,
  }}
>
        <h2>CRM Меню</h2>

        <div style={{ marginTop: 30 }}>
  <button
    onClick={() => setActiveTab("deals")}
    style={{
      width: "100%",
      padding: 12,
      marginBottom: 10,
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      background:
        activeTab === "deals"
          ? "#2563eb"
          : "#1f2937",
      color: "white",
      textAlign: "left",
    }}
  >
    📋 Сделки
  </button>

  <button
  onClick={() => setActiveTab("archive")}
  style={{
    width: "100%",
    padding: 12,
    marginBottom: 10,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    background:
      activeTab === "archive"
        ? "#2563eb"
        : "#1f2937",
    color: "white",
    textAlign: "left",
  }}
>
  📦 Архив
</button>

  <button
    onClick={() => setActiveTab("clients")}
    style={{
      width: "100%",
      padding: 12,
      marginBottom: 10,
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      background:
        activeTab === "clients"
          ? "#2563eb"
          : "#1f2937",
      color: "white",
      textAlign: "left",
    }}
  >
    👥 Клиенты
  </button>

  {role === "admin" && (
  <button
    onClick={() =>
      setActiveTab("managers")
    }
    style={{
      width: "100%",
      padding: 12,
      marginBottom: 10,
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      background:
        activeTab === "managers"
          ? "#2563eb"
          : "#1f2937",
      color: "white",
      textAlign: "left",
    }}
  >
    👨‍💼 Менеджеры
  </button>
)}

 <button
  onClick={() => {
    console.log("PASSWORD CLICK");
    setActiveTab("password");
  }}
  style={{
    width: "100%",
    padding: 12,
    marginBottom: 10,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    background:
      activeTab === "password"
        ? "#2563eb"
        : "#1f2937",
    color: "white",
    textAlign: "left",
  }}
>
  🔒 Пароль
</button>

  <button
  onClick={() => setDarkMode(!darkMode)}
  style={{
    width: "100%",
    padding: 12,
    marginBottom: 10,
    marginTop: 10,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    background: "#374151",
    color: "white",
    textAlign: "left",
    display: "block",
  }}
>
  {darkMode
    ? "☀ Светлая тема"
    : "🌙 Тёмная тема"}
</button>

  <button
    onClick={() => setActiveTab("calendar")}
    style={{
      width: "100%",
      padding: 12,
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      background:
        activeTab === "calendar"
          ? "#2563eb"
          : "#1f2937",
      color: "white",
      textAlign: "left",
    }}
 >
  📅 Календарь
</button>

<button
  onClick={async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }}
  style={{
    width: "100%",
    padding: 12,
    marginTop: 20,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    background: "#dc2626",
    color: "white",
    textAlign: "left",
  }}
>
  🚪 Выйти
</button>

</div>
</div>

      <div style={{ flex: 1, padding: 20 }}>
        <h1
  style={{
    fontSize: 24,
    marginBottom: 10,
  }}
>
  CRM Честный Знак
</h1>
        <div
  style={{
    display: "flex",
    gap: 8,
    marginTop: 10,
    marginBottom: 15,
    flexWrap: "wrap",
    alignItems: "center",
  }}
>
  <div
  style={{
    background: darkMode
      ? "#374151"
      : "white",
    color: darkMode
      ? "white"
      : "black",
    padding: 8,
    borderRadius: 12,
    minWidth: 140,
  }}
>
    <div style={{ color: "#666" }}>
      Всего сделок
    </div>

    <h2>{totalDeals}</h2>
  </div>

  <div
  style={{
    background: darkMode
      ? "#374151"
      : "white",
    color: darkMode
      ? "white"
      : "black",
    padding: 8,
    borderRadius: 12,
    minWidth: 140,
  }}
>
    <div style={{ color: "#666" }}>
      Завершено
    </div>

    <h2>{completedDeals}</h2>
  </div>

  <div
  style={{
    background: darkMode
      ? "#374151"
      : "white",
    color: darkMode
      ? "white"
      : "black",
    padding: 8,
    borderRadius: 12,
    minWidth: 140,
  }}
>
  <div style={{ color: "#666" }}>
    Просрочено
  </div>

  <h2>{overdueDeals}</h2>
</div>

  <div
  style={{
    background: darkMode
      ? "#374151"
      : "white",
    color: darkMode
      ? "white"
      : "black",
    padding: 8,
    borderRadius: 12,
    minWidth: 140,
  }}
>
    <div style={{ color: "#666" }}>
      Сумма сделок
    </div>

    <h2>{totalAmount} ₽</h2>
  </div>
  <div
  style={{
    background: darkMode
      ? "#7f1d1d"
      : "#fee2e2",
    color: darkMode
      ? "#fecaca"
      : "#991b1b",
    padding: 8,
    borderRadius: 12,
    minWidth: 140,
  }}
>
  <div
  style={{
    color: darkMode
      ? "#fecaca"
      : "#991b1b",
  }}
>
  🚨 Требуют внимания
</div>

  <h2>
    {
      activeDeals.filter((d) => {
        if (!d.deadline) return false;

        const diff =
          new Date(d.deadline).getTime() -
          new Date().getTime();

        return (
          (diff < 0 &&
            d.stage !==
              "Завершение/проверка") ||
          (diff > 0 &&
            diff <
              3 *
                24 *
                60 *
                60 *
                1000)
        );
      }).length
    }
  </h2>
</div>
</div>

        <div
  style={{
    display: "flex",
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
    flexWrap: "wrap",
  }}
>
  <input
  value={client}
  onChange={(e) =>
    setClient(e.target.value)
  }
  placeholder="Клиент"
  style={{
    padding: 4,
    fontSize: 13,
    border: darkMode
      ? "1px solid #6b7280"
      : "1px solid #ccc",
    borderRadius: 8,

    background: darkMode
      ? "#374151"
      : "white",

    color: darkMode
      ? "white"
      : "black",
  }}
/>

  <input
    value={comment}
    onChange={(e) =>
      setComment(e.target.value)
    }
    placeholder="Комментарий"
    style={{
  padding: 4,
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: 8,

  background: darkMode
    ? "#374151"
    : "white",

  color: darkMode
    ? "white"
    : "black",
}}
  />

  <input
    value={phone}
    onChange={(e) =>
      setPhone(e.target.value)
    }
    placeholder="Телефон"
    style={{
  padding: 4,
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: 8,

  background: darkMode
    ? "#374151"
    : "white",

  color: darkMode
    ? "white"
    : "black",
}}
  />

  <input
    value={email}
    onChange={(e) =>
      setEmail(e.target.value)
    }
    placeholder="Email"
    style={{
  padding: 4,
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: 8,

  background: darkMode
    ? "#374151"
    : "white",

  color: darkMode
    ? "white"
    : "black",
}}
  />

  <input
    value={amount}
    onChange={(e) =>
      setAmount(e.target.value)
    }
    placeholder="Сумма"
    style={{
  padding: 4,
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: 8,

  background: darkMode
    ? "#374151"
    : "white",

  color: darkMode
    ? "white"
    : "black",
}}
  />

  <select
  value={manager}
  onChange={(e) =>
    setManager(e.target.value)
  }
  style={{
  padding: 4,
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: 8,

  background: darkMode
    ? "#374151"
    : "white",

  color: darkMode
    ? "white"
    : "black",
}}
>
  <option value="">
  Менеджер
</option>

{managers.map((m) => (
  <option
    key={m.id}
    value={m.name}
  >
    {m.name}
  </option>
))}
</select>

  <button
    onClick={addDeal}
    style={{
      padding: "4px 8px",
      background: "green",
      color: "white",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
    }}
  >
    Новая сделка
  </button>

  <button
    onClick={exportExcel}
    style={{
      padding: "4px 8px",
      background: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
    }}
  >
    Excel экспорт
  </button>

  <button
  onClick={exportBackup}
  style={{
    padding: "4px 8px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  }}
>
  💾 Резервная копия
</button>

<label
  style={{
    padding: "4px 8px",
background: "#2563eb",
color: "white",
borderRadius: 6,
cursor: "pointer",
fontWeight: 500,
fontSize: 13,
    boxShadow:
      "0 2px 6px rgba(0,0,0,.2)",
  }}
>
  📂 Выбрать резервную копию

  <input
    type="file"
    accept=".xlsx"
    style={{ display: "none" }}
    onChange={(e) =>
      setBackupFile(
        e.target.files?.[0] || null
      )
    }
  />
</label>

{backupFile && (
  <div
    style={{
      marginTop: 10,
      color: "#4022c5",
      fontWeight: "bold",
      fontSize: 15,
    }}
  >
    ✅ {backupFile.name}
  </div>
)}

<button
  onClick={restoreBackup}
  style={{
    padding: "10px 20px",
    background: "#ea580c",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  }}
>
  📥 Восстановить CRM
</button>

  <input
  type="date"
  value={deadline}
  onChange={(e) =>
    setDeadline(e.target.value)
  }
  style={{
  padding: 4,
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: 8,

  background: darkMode
    ? "#374151"
    : "white",

  color: darkMode
    ? "white"
    : "black",
}}
/>

<input
  value={search}
  onChange={(e) =>
    setSearch(e.target.value)
  }
  placeholder="Поиск"
  style={{
  padding: 4,
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: 8,

  background: darkMode
    ? "#374151"
    : "white",

  color: darkMode
    ? "white"
    : "black",
}}
/>
</div>

{activeTab === "archive" && (
  <div>
    <h2>📦 Архивные сделки</h2>

    {deals.filter((d) => d.archived).length === 0 ? (
      <div>Архив пуст</div>
    ) : (
      deals
        .filter((d) => d.archived)
        .map((deal) => (
          <div
            key={deal.id}
            style={{
              background: "white",
              padding: 15,
              marginBottom: 10,
              borderRadius: 10,
            }}
          >
            <b>{deal.client}</b>

            <div>
              📞 {deal.phone}
            </div>

            <div>
              📧 {deal.email}
            </div>

            <button
              onClick={async () => {
                await supabase
                  .from("deals")
                  .update({
                    archived: false,
                  })
                  .eq("id", deal.id);

                fetchDeals();
              }}
            >
              ♻ Восстановить
            </button>
          </div>
        ))
    )}
  </div>
)}

{String(activeTab) === "password" && (
  <div style={{ marginTop: 40 }}>
    <h2>Смена пароля</h2>

    <input
      type="password"
      value={newPassword}
      onChange={(e) =>
        setNewPassword(
          e.target.value
        )
      }
      placeholder="Новый пароль"
      style={{
        width: 300,
        padding: 6,
        display: "block",
        marginBottom: 10,
      }}
    />

    <input
      type="password"
      value={repeatPassword}
      onChange={(e) =>
        setRepeatPassword(
          e.target.value
        )
      }
      placeholder="Повторите пароль"
      style={{
        width: 300,
        padding: 6,
        display: "block",
        marginBottom: 10,
      }}
    />

    <button
      onClick={changePassword}
      style={{
        padding: "10px 20px",
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: 8,
      }}
    >
      Сменить пароль
    </button>
  </div>
)}

{activeTab === "deals" && (
  <DragDropContext onDragEnd={onDragEnd}>
  
  <input
  type="text"
  placeholder="Поиск клиента, телефона или email..."
  value={search}
  onChange={(e) =>
    setSearch(e.target.value)
  }
  style={{
    width: "100%",
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    border: "1px solid #ccc",
  }}
/>

<div
  style={{
    display: "flex",
    gap: 20,
    overflowX: "auto",
  }}
>
  
</div>
  <div
    style={{
      display: "flex",
      gap: 20,
      overflowX: "auto",
    }}
  >
  {stages.map((stage) => (
    <Droppable
  droppableId={stage}
  key={stage}
>
  {(provided) => (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      style={{
  minWidth: 150,
  background: getStageColor(stage),
  borderRadius: 10,
  padding: 8,
}}
    >
      <div
  style={{
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 10,
  }}
>
  <h3
  style={{
    color: "#111827",
    margin: 0,
    fontWeight: "bold",
    fontSize: 16,
  }}
>
  {stage}
</h3>

  <div
    style={{
      background: "#2563eb",
      color: "white",
      borderRadius: 999,
      padding: "4px 10px",
      fontSize: 12,
      fontWeight: "bold",
    }}
  >
    {
      deals.filter(
        (deal) =>
          deal.stage === stage
      ).length
    }
  </div>
</div>

{deals
  .filter(
    (deal) =>
      deal.stage === stage &&
      !deal.archived
  )
  .filter((deal) => {
    const q =
      search.toLowerCase();

    return (
      deal.client
        ?.toLowerCase()
        .includes(q) ||
      deal.phone
        ?.toLowerCase()
        .includes(q) ||
      deal.email
        ?.toLowerCase()
        .includes(q)
    );
  })
  .map((deal, index) => (
    <Draggable
      key={deal.id}
      draggableId={String(deal.id)}
      index={index}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
  background:
  deal.deadline &&
  new Date(deal.deadline) < new Date() &&
  deal.stage !== "Завершение/проверка"
    ? darkMode
      ? "#7f1d1d"
      : "#fee2e2"
    : deal.deadline &&
      new Date(deal.deadline).getTime() -
        new Date().getTime() <
        3 * 24 * 60 * 60 * 1000 &&
      new Date(deal.deadline) > new Date()
    ? darkMode
      ? "#78350f"
      : "#fef3c7"
    : darkMode
      ? "#374151"
      : "white",

      color: darkMode
  ? "white"
  : "black",

border:
  deal.deadline &&
  new Date(deal.deadline) < new Date() &&
  deal.stage !== "Завершение/проверка"
    ? "2px solid #dc2626"
    : deal.deadline &&
      new Date(deal.deadline).getTime() - new Date().getTime() <
        3 * 24 * 60 * 60 * 1000 &&
      new Date(deal.deadline) > new Date()
    ? "2px solid #f59e0b"
    : "1px solid #e5e7eb",

  padding: 4,
  borderRadius: 8,
  marginTop: 6,
  fontSize: 12,
...provided.draggableProps.style,
}}
        >
          <b>{deal.client}</b>

          <div
            style={{
              marginTop: 6,
              color: "#666",
              fontSize: 14,
            }}
          >
            {deal.comment}
          </div>

          <div style={{ marginTop: 3 }}>
            📞 {deal.phone}
          </div>

          <div style={{ marginTop: 3 }}>
            📧 {deal.email}
          </div>

          <div style={{ marginTop: 3 }}>
            👨‍💼 {deal.manager || "Не назначен"}
          </div>

          <div style={{ marginTop: 3 }}>
            💰 {deal.amount}
          </div>

          <div style={{ marginTop: 3 }}>
            📅 {deal.deadline}
          </div>

{deal.deadline &&
  new Date(deal.deadline) > new Date() &&
  new Date(deal.deadline).getTime() -
    new Date().getTime() <
    3 * 24 * 60 * 60 * 1000 && (
    <div
      style={{
        marginTop: 8,
        color: "#d97706",
        fontWeight: "bold",
      }}
    >
      🟡 Скоро срок
    </div>
)}

          {deal.deadline &&
  new Date(deal.deadline) < new Date() &&
  deal.stage !== "Завершение/проверка" && (
    <div
      style={{
        marginTop: 8,
        color: "#dc2626",
        fontWeight: "bold",
      }}
    >
      ⚠ Просрочено
    </div>
)}

          <button
  onClick={() => {
    setEditingDeal(deal);

    setEditClient(deal.client || "");
    setEditComment(deal.comment || "");
    setEditPhone(deal.phone || "");
    setEditEmail(deal.email || "");
    setEditAmount(deal.amount || "");
    setEditDeadline(deal.deadline || "");
    
    setEditManager(deal.manager || "");

    setEditStage(deal.stage || "");

    fetchComments(deal.id);
    fetchFiles(deal.id);
    fetchHistory(deal.id);
  }}
  style={{
    marginTop: 10,
    marginRight: 10,
    padding: "4px 8px",
    fontSize: 12,
    background: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  }}
>
  Редактировать
</button>

          <button
           onClick={async () => {
  const currentIndex =
    stages.indexOf(deal.stage);

  if (currentIndex >= stages.length - 1)
    return;

  const nextStage =
    stages[currentIndex + 1];

  await supabase
    .from("deals")
    .update({
      stage: nextStage,
    })
    .eq("id", deal.id);

  fetchDeals();
}}
            style={{
              marginTop: 10,
              padding: "4px 8px",
              fontSize: 12,
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Следующий этап
          </button>

          {role === "admin" && (
  <button
    onClick={async () => {
      await supabase
        .from("deals")
        .update({
          archived: true,
        })
        .eq("id", deal.id);

      fetchDeals();
    }}
    style={{
      marginTop: 5,
      padding: "4px 8px",
      fontSize: 12,
      border: "none",
      borderRadius: 6,
      background: "#f59e0b",
      color: "white",
      cursor: "pointer",
    }}
  >
    📦 В архив
  </button>
)}

          <button
  onClick={async () => {
    if (role === "admin") {
      await supabase
        .from("deals")
        .delete()
        .eq("id", deal.id);
    } else {
      await supabase
        .from("deals")
        .update({
          archived: true,
        })
        .eq("id", deal.id);
    }

    fetchDeals();
  }}
  style={{
    marginTop: 10,
    marginLeft: 10,
    padding: "4px 8px",
    fontSize: 12,
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  }}
>
  Удалить
</button>
        </div>
      )}
    </Draggable>
  ))}
    {provided.placeholder}
    </div>
  )}
</Droppable>
))}
</div>
</DragDropContext>
)}
     {activeTab === "managers" && (
  <div style={{ marginTop: 40 }}>
    <h2>Менеджеры</h2>

    <div
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 20,
      }}
    >
      <input
        value={newManager}
        onChange={(e) =>
          setNewManager(
            e.target.value
          )
        }
        placeholder="Имя менеджера"
        style={{
  padding: 6,
  borderRadius: 8,
  border: "1px solid #ccc",
  background: darkMode ? "#1f2937" : "white",
  color: darkMode ? "white" : "black",
}}
      />

      <button
        onClick={addManager}
        style={{
          padding: "10px 20px",
          background: "#16a34a",
          color: "white",
          border: "none",
          borderRadius: 8,
        }}
      >
        Добавить
      </button>
    </div>

    <div>
  Найдено менеджеров: {managers.length}
</div>

    {managers.map((manager) => (
      <div
        key={manager.id}
        style={{
  background: darkMode ? "#1f2937" : "white",
  color: darkMode ? "white" : "black",
  padding: 15,
  borderRadius: 10,
  marginBottom: 10,
  display: "flex",
  justifyContent: "space-between",
}}
      >
        <span>
          👨‍💼 {manager.name}
        </span>

        <button
  onClick={() => {
    alert("Кнопка работает");
    deleteManager(manager.id);
  }}
  style={{
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "4px 10px",
  }}
>
  Удалить
</button>
      </div>
    ))}
  </div>
)}
     {activeTab === "clients" && (
  <div style={{ marginTop: 40 }}>
    <h2>База клиентов</h2>

    {[...new Set(
  deals
    .filter((deal) => !deal.archived)
    .map((deal) => deal.client)
)].map(
      (clientName, index) => {
        const clientDeals = deals.filter(
          (d) => d.client === clientName
        );

        return (
          <div
            key={index}
            style={{
  background: darkMode
    ? "#374151"
    : "white",
  color: darkMode
    ? "white"
    : "black",
  padding: 12,
  borderRadius: 12,
  marginTop: 12,
  boxShadow:
    "0 4px 12px rgba(0,0,0,0.08)",
}}
          >
            <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <h3>{clientName}</h3>
  <div style={{color:"red"}}>
  ТЕСТ КНОПОК
</div>

<div style={{ display: "flex", gap: 8 }}>

<button
  onClick={async () => {
    const ok = confirm(
      `Отправить клиента "${clientName}" в архив?`
    );

    if (!ok) return;

    await supabase
      .from("deals")
      .update({
        archived: true,
      })
      .eq("client", clientName);

    fetchDeals();
  }}
      style={{
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
      }}
    >
      📦 В архив
    </button>

    <button
      onClick={async () => {
        const ok = confirm(
          `Удалить клиента "${clientName}" НАВСЕГДА?`
        );

        if (!ok) return;

        await supabase
          .from("deals")
          .delete()
          .eq("client", clientName);

        fetchDeals();
      }}
      style={{
        background: "#dc2626",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
      }}
    >
      🗑 Удалить навсегда
    </button>
  </div>
</div>

            <div>
              Сделок: {clientDeals.length}
            </div>

            <div>
              Общая сумма:{" "}
              {clientDeals.reduce(
                (sum, d) =>
                  sum + Number(d.amount || 0),
                0
              )} 
            </div>

            <div>
              Последний этап:{" "}
              {clientDeals[
                clientDeals.length - 1
              ]?.stage}
            </div>
          </div>
        );
      }
    )}
  </div>
)}
<h2 style={{ marginTop: 40 }}>
  ♻ Архив клиентов
</h2>

{[
  ...new Set(
    deals
      .filter((d) => d.archived)
      .map((d) => d.client)
  ),
].map((clientName) => (
  <div
    key={clientName}
    style={{
      background: darkMode
        ? "#1f2937"
        : "white",
      color: darkMode
        ? "white"
        : "black",
      padding: 12,
      borderRadius: 12,
      marginTop: 10,
    }}
  >
    <b>{clientName}</b>

    <button
      onClick={async () => {
        await supabase
          .from("deals")
          .update({
            archived: false,
          })
          .eq("client", clientName);

        fetchDeals();
      }}
      style={{
        marginLeft: 15,
        background: "#16a34a",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
      }}
    >
      ♻ Восстановить
    </button>
  </div>
))}

{activeTab === "calendar" && (
  <div style={{ marginTop: 40 }}>
    <h2>Календарь задач</h2>

    {deals
      .filter((deal) => deal.deadline)
      .map((deal) => (
        <div
          key={deal.id}
          style={{
  background: darkMode
    ? "#1f2937"
    : "white",

  color: darkMode
    ? "white"
    : "black",

  padding: 16,
  borderRadius: 12,
  marginTop: 12,

  boxShadow: darkMode
    ? "0 4px 12px rgba(0,0,0,0.4)"
    : "0 4px 12px rgba(0,0,0,0.08)",
}}
        >
          <b>{deal.client}</b>

          <div>
            Срок: {deal.deadline}
          </div>

          <div>
            Этап: {deal.stage}
          </div>
        </div>
      ))}
  </div>
)}
{editingDeal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    }}
  >
    <div
  style={{
    background: darkMode
      ? "#1f2937"
      : "white",

    color: darkMode
      ? "white"
      : "black",

    padding: 15,
    borderRadius: 12,
    width: 420,

    maxHeight: "85vh",
    overflowY: "auto",
  }}
>
  <h2>Редактирование сделки</h2>

      <input
        value={editClient}
        onChange={(e) =>
          setEditClient(e.target.value)
        }
        placeholder="Клиент"
        style={{
          width: "100%",
          padding: 6,
          marginBottom: 10,

          background: darkMode
  ? "#374151"
  : "white",

color: darkMode
  ? "white"
  : "black",

border: darkMode
  ? "1px solid #6b7280"
  : "1px solid #ccc",
        }}
      />

      <input
        value={editPhone}
        onChange={(e) =>
          setEditPhone(e.target.value)
        }
        placeholder="Телефон"
        style={{
          width: "100%",
          padding: 6,
          marginBottom: 10,
        background: darkMode
  ? "#374151"
  : "white",

color: darkMode
  ? "white"
  : "black",

border: darkMode
  ? "1px solid #6b7280"
  : "1px solid #ccc",
        }}
      />

      <input
        value={editEmail}
        onChange={(e) =>
          setEditEmail(e.target.value)
        }
        placeholder="Email"
        style={{
          width: "100%",
          padding: 6,
          marginBottom: 10,
          background: darkMode
  ? "#374151"
  : "white",

color: darkMode
  ? "white"
  : "black",

border: darkMode
  ? "1px solid #6b7280"
  : "1px solid #ccc",
        }}
      />

      <input
        value={editAmount}
        onChange={(e) =>
          setEditAmount(e.target.value)
        }
        placeholder="Сумма"
        style={{
          width: "100%",
          padding: 6,
          marginBottom: 10,
          background: darkMode
  ? "#374151"
  : "white",

color: darkMode
  ? "white"
  : "black",

border: darkMode
  ? "1px solid #6b7280"
  : "1px solid #ccc",
        }}
      />

      <input
        type="date"
        value={editDeadline}
        onChange={(e) =>
          setEditDeadline(e.target.value)
        }
        style={{
          width: "100%",
          padding: 6,
          marginBottom: 10,
          background: darkMode
  ? "#374151"
  : "white",

color: darkMode
  ? "white"
  : "black",

border: darkMode
  ? "1px solid #6b7280"
  : "1px solid #ccc",
        }}
      />
      <select
  value={editManager}
  onChange={(e) =>
    setEditManager(e.target.value)
  }
  style={{
    width: "100%",
    padding: 6,
    marginBottom: 10,
    background: darkMode
  ? "#374151"
  : "white",

color: darkMode
  ? "white"
  : "black",

border: darkMode
  ? "1px solid #6b7280"
  : "1px solid #ccc",
  }}
>
  <option value="">Менеджер</option>
  {managers.map((m) => (
  <option
    key={m.id}
    value={m.name}
  >
    {m.name}
  </option>
))}
</select>
      <select
  value={editStage}
  onChange={(e) =>
    setEditStage(e.target.value)
  }
  style={{
    width: "100%",
    padding: 6,
    marginBottom: 10,
    background: darkMode
  ? "#374151"
  : "white",

color: darkMode
  ? "white"
  : "black",

border: darkMode
  ? "1px solid #6b7280"
  : "1px solid #ccc",
  }}
>
  {stages.map((stage) => (
    <option
      key={stage}
      value={stage}
    >
      {stage}
    </option>
  ))}
</select>

      <textarea
        value={editComment}
        onChange={(e) =>
          setEditComment(e.target.value)
        }
        placeholder="Комментарий"
        style={{
          width: "100%",
          minHeight: 60,
          padding: 6,
          marginBottom: 10,
          background: darkMode
  ? "#374151"
  : "white",

color: darkMode
  ? "white"
  : "black",

border: darkMode
  ? "1px solid #6b7280"
  : "1px solid #ccc",
        }}
      />

      <h3>История комментариев</h3>

<div
  style={{
    maxHeight: 100,
    overflowY: "auto",
    marginBottom: 15,
    border: "1px solid #ddd",
    padding: 4,
    borderRadius: 8,
  }}
>
  {comments.length === 0 ? (
    <div>Комментариев пока нет</div>
  ) : (
    comments.map((item) => (
      <div
        key={item.id}
        style={{
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#666",
          }}
        >
          {new Date(
            item.created_at
          ).toLocaleString()}
        </div>

        <div>{item.comment}</div>
      </div>
    ))
  )}
</div>

<textarea
  value={newComment}
  onChange={(e) =>
    setNewComment(e.target.value)
  }
  placeholder="Добавить новый комментарий..."
  style={{
    width: "100%",
    minHeight: 50,
    padding: 6,
    marginBottom: 10,
    background: darkMode
  ? "#374151"
  : "white",

color: darkMode
  ? "white"
  : "black",

border: darkMode
  ? "1px solid #6b7280"
  : "1px solid #ccc",
  }}
/>

<button
  onClick={async () => {
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("deal_comments")
      .insert([
        {
          deal_id: editingDeal.id,
          comment: newComment,
        },
      ])
      .select();

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase
  .from("deal_history")
  .insert([
    {
      deal_id: editingDeal.id,
      action: "Добавлен комментарий",
    },
  ]);

    setNewComment("");
    fetchComments(editingDeal.id);
  }}
  style={{
    padding: "8px 16px",
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: 8,
    marginBottom: 15,
    cursor: "pointer",
  }}
>
  Добавить комментарий
</button>

<h3>📜 История действий</h3>

<div
  style={{
    maxHeight: 100,
    overflowY: "auto",
    marginBottom: 15,
    border: "1px solid #ddd",
    padding: 4,
    borderRadius: 8,
  }}
>
  {history.length === 0 ? (
    <div>История пуста</div>
  ) : (
    history.map((item) => (
      <div
        key={item.id}
        style={{
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#666",
          }}
        >
          {new Date(
            item.created_at
          ).toLocaleString()}
        </div>

        <div>{item.action}</div>
      </div>
    ))
  )}
</div>

<h3>Файлы сделки</h3>

<input
  type="file"
  onChange={(e) =>
    setSelectedFile(
      e.target.files?.[0] || null
    )
  }
  style={{
    marginBottom: 10,
  }}
/>

<button
  onClick={uploadFile}
  style={{
    padding: "8px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 8,
    marginBottom: 15,
    marginLeft: 10,
    cursor: "pointer",
  }}
>
  Загрузить файл
</button>

<div
  style={{
    marginTop: 15,
    borderTop: "1px solid #ddd",
    paddingTop: 10,
  }}
>
  {files.length === 0 ? (
    <div>Файлов пока нет</div>
  ) : (
    files.map((file) => (
  <div
    key={file.id}
    style={{
      marginBottom: 8,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span
      onClick={async () => {
        const { data } =
          await supabase.storage
            .from("deal-files")
            .createSignedUrl(
              file.file_path,
              3600
            );

        if (data?.signedUrl) {
          window.open(
            data.signedUrl,
            "_blank"
          );
        }
      }}
      style={{
        cursor: "pointer",
        color: "#2563eb",
        textDecoration: "underline",
      }}
    >
      📎 {file.file_name}
    </span>

    <button
      onClick={() =>
        deleteFile(
          file.id,
          file.file_path
        )
      }
      style={{
        background: "#dc2626",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "4px 8px",
        cursor: "pointer",
      }}
    >
      🗑
    </button>
  </div>
))
  )}
</div>

      <button
        onClick={async () => {
          await supabase
  .from("deals")
  .update({
    client: editClient,
    comment: editComment,
    phone: editPhone,
    email: editEmail,
    amount: editAmount,
    deadline: editDeadline,
    manager: editManager,
    stage: editStage,
  })
            .eq("id", editingDeal.id);

          setEditingDeal(null);
          fetchDeals();
        }}
        style={{
          padding: "10px 20px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 8,
          marginRight: 10,
        }}
      >
        Сохранить
      </button>

      <button
        onClick={() => setEditingDeal(null)}
        style={{
          padding: "10px 20px",
        }}
      >
        Отмена
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}