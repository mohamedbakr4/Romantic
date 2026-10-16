import { useLayoutEffect, useMemo, useRef, useState } from "react";

// الإيميل اللي هيستقبل الرد (أو الـ alias بتاع FormSubmit) — يتغير من .env
const TARGET = import.meta.env.VITE_FORM_TARGET || "mohmedbakr145@gmail.com";

const FOODS = [
  { n: "بيتزا", d: "ساخنة ونتشارك قطعها", e: "🍕", c: "#fde8d3" },
  { n: "كفتة", d: "على الفحم وبنكهة البيت", e: "🍢", c: "#fbd9cf" },
  { n: "برجر", d: "برجر", e: "🍔", c: "#fde9c8" },
  { n: "كرم الشام", d: "مشاوي ولمّة حلوة", e: "🍗", c: "#e6efd2" },
  { n: "تسوق", d: "نتمشى ونختار معًا", e: "🛍️", c: "#fde0ee" },
  { n: "كبدة", d: "على أصولها", e: "🥙", c: "#fdf0cf" },
];

const HINTS = [
  "الزر خجول جدًا منك 🙈",
  "في كل مرة يهرب الزرّ…",
  "ما زال يهرب.. لكن «حسنًا» صارت أجمل 💗",
  "استسلم بلطف.. الطريق الوحيد إلى الأمام هو «حسنًا» 💕",
];

const ar = (n) => n.toLocaleString("ar-EG");
const fmt = (v) =>
  v
    ? new Date(`${v}T12:00:00`).toLocaleDateString("ar-EG-u-nu-latn", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";
const todayStr = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/* ---------- تأثيرات الخلفية ---------- */
function Petals({ burst = false }) {
  const items = useMemo(
    () =>
      Array.from({ length: burst ? 26 : 14 }, (_, i) => ({
        id: i,
        ch: burst ? "💗🌸✨💖"[i % 4] : "✿",
        left: Math.random() * 100,
        size: 12 + Math.random() * 16,
        dur: 6 + Math.random() * 7,
        delay: Math.random() * (burst ? 2.5 : 8),
      })),
    [burst]
  );
  return (
    <div className="fx" aria-hidden="true">
      {items.map((p) => (
        <i
          key={p.id}
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            animationIterationCount: burst ? 1 : "infinite",
          }}
        >
          {p.ch}
        </i>
      ))}
    </div>
  );
}

/* ---------- زرار "لا" اللي بيهرب ---------- */
function NoButton({ yesRef, cardRef, onDodge }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: -999, y: -999, first: true });

  useLayoutEffect(() => {
    const c = cardRef.current.getBoundingClientRect();
    const w = ref.current.offsetWidth;
    setPos({ x: Math.max(8, c.left - w + 30), y: c.top + c.height * 0.3, first: true });
  }, [cardRef]);

  const dodge = (e) => {
    e.preventDefault();
    const w = ref.current.offsetWidth, h = ref.current.offsetHeight;
    const r = yesRef.current?.getBoundingClientRect();
    let x, y, tries = 0;
    do {
      x = 8 + Math.random() * (window.innerWidth - w - 16);
      y = 8 + Math.random() * (window.innerHeight - h - 16);
      tries++;
    } while (
      r && tries < 30 &&
      x < r.right + 30 && x + w > r.left - 30 && y < r.bottom + 30 && y + h > r.top - 30
    );
    setPos({ x, y, first: false });
    onDodge();
  };

  return (
    <button
      ref={ref}
      type="button"
      className="no"
      style={{ left: pos.x, top: pos.y, transition: pos.first ? "none" : undefined }}
      onPointerEnter={dodge}
      onPointerDown={dodge}
      onClick={dodge}
    >
      لا 🍒🍓
    </button>
  );
}

/* ---------- التطبيق ---------- */
export default function App() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [sel, setSel] = useState([]);
  const [dodges, setDodges] = useState(0);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const cardRef = useRef(null);
  const yesRef = useRef(null);

  const list = sel.map((i) => FOODS[i].n).join("، ");
  const toggle = (i) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const reset = () => { setStep(1); setDate(""); setSel([]); setDodges(0); setNote(""); setName(""); };

  async function send() {
    setSending(true);
    setNote("جارٍ الإرسال… 💌");
    const who = name.trim();
    const message = `وافقت على الموعد 🌸\nالاسم: ${who}\nالتاريخ: ${fmt(date)}\nالاختيارات: ${list}`;
    let ok = false;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`https://formsubmit.co/ajax/${TARGET}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `💌 ردّ ${who} على دعوة الموعد`,
          _captcha: "false",
          _honey: "",
          الاسم: who,
          التاريخ: fmt(date),
          الاختيارات: list,
          message,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const json = await res.json().catch(() => ({}));
      ok = res.ok && String(json.success) === "true";
    } catch {
      ok = false;
    }
    if (!ok) {
      // خطة بديلة: يفتح تطبيق الإيميل برسالة جاهزة
      window.location.href = `mailto:${TARGET}?subject=${encodeURIComponent(`💌 رد ${who} على دعوة الموعد`)}&body=${encodeURIComponent(message)}`;
      await new Promise((r) => setTimeout(r, 600));
    }
    setSending(false);
    setStep(5);
  }

  const header = step <= 4 && (
    <>
      <div className="dots">
        {[1, 2, 3, 4].map((i) => (
          <b key={i} className={`${i <= step ? "on" : ""} ${i === step ? "cur" : ""}`} />
        ))}
      </div>
      <div className="top">
        <span>
          {step > 1 && (
            <button className="back" onClick={() => setStep(step - 1)}>→ رجوع</button>
          )}
        </span>
        <span className="step">الخطوة {ar(step)} من ٤</span>
      </div>
    </>
  );

  return (
    <>
      <Petals />
      {step === 5 && <Petals burst />}

      <main className="card " ref={cardRef}>
        {header}

        <div className="view" key={step}>
          {step === 1 && (
            <>
              <h1>🌸 هل تريد الخروج معي في موعد؟ 💕💞🌸</h1>
              <p className="sub">سؤال واحد فقط.. وبقية الأمر أسهل مما تتوقع</p>
              <button
                ref={yesRef}
                className="btn"
                style={{ transform: `scale(${Math.min(1 + dodges * 0.06, 1.4)})` }}
                onClick={() => setStep(2)}
              >
                حسنًا ♥
              </button>
              <p className="hint">{HINTS[Math.min(dodges, HINTS.length - 1)]}</p>
            </>
          )}

          {step === 2 && (
            <>
              <h1>متى نلتقي؟ 🗓️</h1>
              <p className="sub">اختر اليوم الذي يناسبك، وسأجعل بقية الأسبوع بانتظار.</p>
              <label htmlFor="d">التاريخ</label>
              <input id="d" type="date" value={date} min={todayStr()} onChange={(e) => setDate(e.target.value)} />
              <p className="picked">{date ? `📌 ${fmt(date)}` : "لم تختر يومًا بعد"}</p>
              <button className="btn" disabled={!date} onClick={() => setStep(3)}>ثبّت هذا اليوم ♥</button>
            </>
          )}

          {step === 3 && (
            <>
              <h1>ماذا نأكل؟ 🍽️</h1>
              <p className="sub">اختر ما تشتهيه — يمكنك اختيار أكثر من طبق</p>
              <div className="grid">
                {FOODS.map((f, i) => (
                  <button key={f.n} className="food" aria-pressed={sel.includes(i)} onClick={() => toggle(i)}>
                    <span className="pl">{sel.includes(i) ? "♥" : "+"}</span>
                    <div className="pic" style={{ background: f.c }}>{f.e}</div>
                    <b>{f.n}</b>
                    <small>{f.d}</small>
                  </button>
                ))}
              </div>
              <p className="hint">
                {sel.length === 0 ? "لم تختر شيئًا بعد" : sel.length === 1 ? "اخترت طبقًا واحدًا ✨" : `اخترت ${ar(sel.length)} أطباق ✨`}
              </p>
              <button className="btn" disabled={!sel.length} onClick={() => setStep(4)}>اذهب ♥</button>
            </>
          )}

          {step === 4 && (
            <>
              <p className="big">🎉</p>
              <h1 className="center">تم الاتفاق! 💞</h1>
              <p className="sub center">لا أطيق الانتظار..</p>
              <div className="sum">📅 {fmt(date)}<br />🍽️ {list}</div>
              <div className="field">
                <label htmlFor="name">اكتبي اسمك 💗</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  maxLength={40}
                  autoComplete="off"
                  placeholder="اسمك هنا"
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && !sending && send()}
                />
              </div>
              <button className="btn" disabled={sending || !name.trim()} onClick={send}>أرسل ردّي 💌</button>
              <button className="btn alt" disabled={sending} onClick={reset}>من البداية</button>
              <p className="hint">{note}</p>
            </>
          )}

          {step === 5 && (
            <div className="center">
              <p className="big">💌</p>
              <h1>وصلني ردّك يا {name.trim()}.. وابتسمتُ كثيرًا 💞</h1>
              <p className="sub" style={{ lineHeight: 2 }}>
                شكرًا على هذا «حسنًا» الصغير الذي جعل أسبوعي أجمل.<br />
                سأنتظر يوم <b>{fmt(date)}</b> بقلبٍ يسبق الساعة 🌸
              </p>
              <div className="sum">🍽️ {list}</div>
              <p className="sub">أجمل ما في الموعد.. أنت ✨</p>
              <button className="btn alt" onClick={reset}>من البداية</button>
            </div>
          )}
        </div>
      </main>

      {step === 1 && <NoButton yesRef={yesRef} cardRef={cardRef} onDodge={() => setDodges((d) => d + 1)} />}
    </>
  );
}
