// server.js — Groq + локальная память (memory.json) + режим "кратко и по фактам"

import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// memory.json рядом с server.js
const MEMORY_FILE = path.join(process.cwd(), "memory.json");

function ensureMemoryFile() {
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({ facts: [] }, null, 2), "utf-8");
  }
}

function loadMemory() {
  ensureMemoryFile();
  try {
    const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.facts)) return { facts: [] };
    return data;
  } catch {
    return { facts: [] };
  }
}

function saveMemory(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function norm(s) {
  return String(s ?? "").trim();
}

// --------- PROMPTS (кратко, по фактам) ----------
const ENGINEER_PROMPT = `
Ты — помощник-аналитик по городской инфраструктуре (Smart City) и цифровому двойнику.

Главное правило: НЕ выдумывай факты.
Если вопрос требует конкретных данных (адреса, цифры, статистика, документы), а их нет в ПАМЯТИ — скажи, что точных данных нет, и что нужно уточнить/где это взять.
Можно давать только:
- то, что есть в ПАМЯТИ;
- общеизвестные инженерные принципы и типовые последствия (без «точных» процентов/цифр без источника).

Стиль:
- 4–8 предложений, естественно, без воды.
- Без списков и без шаблонных ответов.
- Никогда не пиши «нет ответа».
- Если не уверен — прямо обозначь неопределённость одной фразой и предложи следующий шаг.

Фокус ответа: влияние на город (трафик/экология/соцнагрузка), сравнение альтернатив и приоритеты. Последнее предложение — короткий вывод.
`;
// ----------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Команды в чате:
// - "запомни: ..."
// - "покажи память"
// - "забудь: <номер>"
// - "очисти память"
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GROQ_API_KEY in .env" });

    const message = norm(req.body?.message);
    if (!message) return res.status(400).json({ error: "message is required" });

    const model = norm(req.body?.model) || "llama-3.1-8b-instant";
    const mem = loadMemory();
    const lower = message.toLowerCase();

    // ---- ПАМЯТЬ: запомнить
    if (lower.startsWith("запомни:")) {
      const fact = norm(message.slice("запомни:".length));
      if (!fact) return res.json({ text: "Напиши после `запомни:` что сохранить." });

      // без дублей
      if (!mem.facts.some(f => f.toLowerCase() === fact.toLowerCase())) {
        mem.facts.push(fact);
        saveMemory(mem);
      }
      return res.json({ text: `✅ Запомнил: ${fact}` });
    }

    // ---- ПАМЯТЬ: показать
    if (lower === "покажи память") {
      if (!mem.facts.length) return res.json({ text: "Память пустая. Добавь: `запомни: ...`" });
      const list = mem.facts.map((f, i) => `${i + 1}) ${f}`).join("\n");
      return res.json({ text: `🧠 Память:\n${list}` });
    }

    // ---- ПАМЯТЬ: забыть по номеру
    if (lower.startsWith("забудь:")) {
      const nStr = norm(message.slice("забудь:".length));
      const n = Number(nStr);
      if (!Number.isFinite(n) || n < 1 || n > mem.facts.length) {
        return res.json({ text: "Неверный номер. Сначала: `покажи память`, затем: `забудь: 2`" });
      }
      const removed = mem.facts.splice(n - 1, 1)[0];
      saveMemory(mem);
      return res.json({ text: `🗑️ Забыл #${n}: ${removed}` });
    }

    // ---- ПАМЯТЬ: очистить
    if (lower === "очисти память") {
      mem.facts = [];
      saveMemory(mem);
      return res.json({ text: "🧼 Память очищена." });
    }

    // ---- Обычный ответ (кратко, по фактам) с учётом памяти
    const memoryBlock = mem.facts.length
      ? mem.facts.map(f => `- ${f}`).join("\n")
      : "- (память пустая)";

    const systemPrompt = `
${ENGINEER_PROMPT}

ПАМЯТЬ (используй как исходные данные):
${memoryBlock}
`.trim();

    const r = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,   // минимизируем фантазию
        max_tokens: 120,    // хватит на нормальный, но не длинный ответ
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
    res.json({
      text: text || "Не получилось сформировать ответ. Переформулируй вопрос или добавь контекст (район/улица/что именно меняем)."
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
  console.log(`Memory file: ${MEMORY_FILE}`);
});
