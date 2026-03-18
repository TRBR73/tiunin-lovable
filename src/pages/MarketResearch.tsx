import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

const CATEGORIES = [
  {
    id: "house",
    title: "Строительство дома (коробка)",
    subtitle: "Капитальные материалы: фундамент, стены, кровля, остекление",
    mean: 115000,
    median: 112000,
    stdDev: 21500,
    min: 79000,
    max: 151000,
    color: "hsl(var(--foreground))",
    details: [
      { label: "Фундамент (100 м²)", value: "400 000 — 1 000 000 ₽", note: "Зависит от типа: ленточный, плита, УШП" },
      { label: "Газобетонные блоки", value: "6 000 — 8 000 ₽/м³", note: "Стандартный сегмент" },
      { label: "Кирпичная коробка (100 м²)", value: "≈ 13 000 000 ₽", note: "Бизнес/Премиум сегмент" },
      { label: "Каркасные дома / SIP", value: "80 000 — 100 000 ₽/м²", note: "Эконом-сегмент" },
      { label: "Панорамное остекление", value: "4 800 — 44 000 ₽/м²", note: "ПВХ → дуб / алюминий" },
    ],
    drivers: ["Рост цен на цемент (+7–10% г/г)", "Энергоёмкость производства бетона и стали", "Стоимость арматуры A500C"],
    skew: "Лёгкий правый скос — «потолок» ограничен только архитектурными амбициями и использованием редких материалов.",
  },
  {
    id: "commercial",
    title: "Коммерческий интерьер (Grade A/B)",
    subtitle: "Офисная отделка: перегородки, фальшполы, потолки, MEP",
    mean: 58500,
    median: 54000,
    stdDev: 16800,
    min: 36000,
    max: 89000,
    color: "hsl(var(--foreground))",
    details: [
      { label: "Стеклянные перегородки (алюминий)", value: "от 2 092 ₽/м²", note: "Каркасные системы" },
      { label: "Цельностеклянные перегородки", value: "от 3 280 ₽/м²", note: "Безрамные" },
      { label: "Премиум лофт-перегородки", value: "15 000 — 25 000 ₽/м²", note: "С акустикой" },
      { label: "Фальшпол", value: "1 300 — 3 500 ₽/м²", note: "Деревянный / стальной сердечник" },
      { label: "Коммерческий ковролин / LVT", value: "1 500 — 4 500 ₽/м²", note: "Высокая проходимость" },
      { label: "Потолочные системы", value: "800 — 3 000 ₽/м²", note: "Грильято, акустические баффлы" },
    ],
    drivers: ["Инженерные системы (MEP) — 27–30% бюджета", "Рост цен на медь и электрокомпоненты", "Импортозамещение фурнитуры"],
    skew: "Бимодальное распределение — разрыв между Grade B «open space» и Grade A «кабинетные» системы.",
  },
  {
    id: "residential",
    title: "Ремонт жилых помещений",
    subtitle: "Черновые + чистовые материалы: стяжка, штукатурка, отделка",
    mean: 44000,
    median: 41500,
    stdDev: 10500,
    min: 26000,
    max: 63000,
    color: "hsl(var(--foreground))",
    details: [
      { label: "Черновые материалы", value: "6 600 — 12 000 ₽/м²", note: "Стяжка, штукатурка, ГКЛ" },
      { label: "Керамогранит / плитка", value: "1 700 — 8 000 ₽/м²", note: "Отечественная → дизайнерская" },
      { label: "Ламинат", value: "от 1 800 ₽/м²", note: "Стандарт" },
      { label: "Инженерная доска / паркет", value: "5 500 — 15 000 ₽/м²", note: "Бизнес/Премиум" },
      { label: "Премиум краска", value: "800 — 900 ₽/л", note: "Среднерыночная" },
      { label: "Обои (винил / флизелин)", value: "от 900 ₽/рулон", note: "Качественные" },
    ],
    drivers: ["Рост стоимости полимеров и химпроизводства", "Сантехника и электрика +15–20% с 2024", "Увеличение доли черновых до 25–30% бюджета"],
    skew: "Наиболее нормальное распределение — дисперсия определяется выбором отделки, а не конструктивом.",
  },
];

const formatPrice = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);

const BellCurve = ({ mean, stdDev, min, max, median }: { mean: number; stdDev: number; min: number; max: number; median: number }) => {
  const { path, fillPath, medianX, meanX } = useMemo(() => {
    const w = 400, h = 100, pad = 10;
    const pts: [number, number][] = [];
    for (let i = 0; i <= w; i++) {
      const value = min + (i / w) * (max - min);
      const z = (value - mean) / stdDev;
      const y = Math.exp(-0.5 * z * z);
      pts.push([i, pad + h - y * h]);
    }
    return {
      path: pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" "),
      fillPath: `M0,${pad + h} ${pts.map((p) => `L${p[0]},${p[1]}`).join(" ")} L${w},${pad + h} Z`,
      medianX: ((median - min) / (max - min)) * w,
      meanX: ((mean - min) / (max - min)) * w,
    };
  }, [mean, stdDev, min, max, median]);

  return (
    <svg viewBox="0 0 400 140" className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="bellFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#bellFill)" />
      <path d={path} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.3" />
      {/* Mean */}
      <line x1={meanX} y1={10} x2={meanX} y2={110} stroke="hsl(var(--foreground))" strokeWidth="1" strokeDasharray="6 4" opacity="0.4" />
      <text x={meanX} y={128} textAnchor="middle" className="fill-muted-foreground" fontSize="10">μ = {formatPrice(mean)}</text>
      {/* Median */}
      <line x1={medianX} y1={10} x2={medianX} y2={110} stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.6" />
      <text x={medianX} y={140} textAnchor="middle" className="fill-foreground" fontSize="10" fontWeight="500">Me = {formatPrice(median)}</text>
      {/* Min / Max labels */}
      <text x={4} y={128} textAnchor="start" className="fill-muted-foreground" fontSize="9">{formatPrice(min)}</text>
      <text x={396} y={128} textAnchor="end" className="fill-muted-foreground" fontSize="9">{formatPrice(max)}</text>
    </svg>
  );
};

const MarketResearch = () => {
  usePageSEO({
    title: "Исследование рынка стоимости ремонта и строительства — Tiunin Design",
    description: "Анализ рыночных цен на ремонт, строительство и материалы в Москве. Медианные значения, распределение и ключевые драйверы стоимости.",
    canonical: "https://tiunin.ru/market-research",
  });

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://tiunin.ru/" },
        { name: "Калькулятор", url: "https://tiunin.ru/calculator" },
        { name: "Исследование рынка", url: "https://tiunin.ru/market-research" },
      ]} />
      <Navigation />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Header */}
          <div className="mb-4">
            <Link to="/calculator" className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-widest">
              ← КАЛЬКУЛЯТОР
            </Link>
          </div>
          <div className="mb-16">
            <div className="text-minimal tracking-widest text-muted-foreground mb-4">ИССЛЕДОВАНИЕ РЫНКА</div>
            <h1 className="text-3xl md:text-4xl font-light text-architectural mb-4">
              Стоимость строительных материалов в Москве и МО
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Статистический анализ распределения цен на строительные материалы по данным I квартала 2026 года.
              Все значения в рублях за м² и не включают стоимость работ.
            </p>
          </div>

          {/* Macro context */}
          <div className="mb-16 p-6 border border-border rounded-sm bg-muted/30">
            <div className="text-minimal tracking-widest text-muted-foreground mb-4">МАКРОЭКОНОМИЧЕСКИЙ КОНТЕКСТ</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-light text-architectural">+4–6%</div>
                <div className="text-xs text-muted-foreground mt-1">Годовой рост стоимости стройматериалов</div>
              </div>
              <div>
                <div className="text-2xl font-light text-architectural">+43%</div>
                <div className="text-xs text-muted-foreground mt-1">Кумулятивный рост цен с 2020 года</div>
              </div>
              <div>
                <div className="text-2xl font-light text-architectural">+63%</div>
                <div className="text-xs text-muted-foreground mt-1">Рост цен на металлоконструкции с 2020</div>
              </div>
            </div>
          </div>

          {/* Summary table */}
          <div className="mb-16">
            <div className="text-minimal tracking-widest text-muted-foreground mb-6">СВОДНАЯ ТАБЛИЦА РАСПРЕДЕЛЕНИЙ</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Категория</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">μ (среднее)</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">Me (медиана)</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">σ (ст.откл.)</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">P5 (мин)</th>
                    <th className="text-right py-3 pl-3 font-medium text-muted-foreground">P95 (макс)</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((cat) => (
                    <tr key={cat.id} className="border-b border-border/50">
                      <td className="py-3 pr-4 font-medium">{cat.title}</td>
                      <td className="text-right py-3 px-3">{formatPrice(cat.mean)}</td>
                      <td className="text-right py-3 px-3 font-medium">{formatPrice(cat.median)}</td>
                      <td className="text-right py-3 px-3 text-muted-foreground">{formatPrice(cat.stdDev)}</td>
                      <td className="text-right py-3 px-3 text-muted-foreground">{formatPrice(cat.min)}</td>
                      <td className="text-right py-3 pl-3 text-muted-foreground">{formatPrice(cat.max)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Все значения в ₽/м². P5 и P95 — 5-й и 95-й перцентили соответственно.</p>
          </div>

          {/* Category cards */}
          {CATEGORIES.map((cat, idx) => (
            <div key={cat.id} className="mb-20">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-xs text-muted-foreground tracking-widest">0{idx + 1}</span>
                <h2 className="text-2xl font-light text-architectural">{cat.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8 ml-10">{cat.subtitle}</p>

              {/* Bell curve */}
              <div className="mb-8 max-w-2xl ml-10">
                <BellCurve mean={cat.mean} stdDev={cat.stdDev} min={cat.min} max={cat.max} median={cat.median} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ml-10">
                {/* Material details */}
                <div>
                  <div className="text-xs tracking-widest text-muted-foreground mb-4">ЦЕНОВЫЕ ОРИЕНТИРЫ</div>
                  <div className="space-y-3">
                    {cat.details.map((d, i) => (
                      <div key={i} className="flex justify-between items-baseline gap-4 py-2 border-b border-border/30">
                        <div>
                          <div className="text-sm">{d.label}</div>
                          <div className="text-xs text-muted-foreground">{d.note}</div>
                        </div>
                        <div className="text-sm font-medium whitespace-nowrap">{d.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drivers + skew */}
                <div className="space-y-6">
                  <div>
                    <div className="text-xs tracking-widest text-muted-foreground mb-4">ДРАЙВЕРЫ ЦЕН</div>
                    <ul className="space-y-2">
                      {cat.drivers.map((d, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-foreground mt-1 shrink-0">→</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs tracking-widest text-muted-foreground mb-3">ХАРАКТЕР РАСПРЕДЕЛЕНИЯ</div>
                    <p className="text-sm text-muted-foreground">{cat.skew}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-sm">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Среднее (μ)</span>
                      <span className="font-medium">{formatPrice(cat.mean)} ₽/м²</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Медиана (Me)</span>
                      <span className="font-medium">{formatPrice(cat.median)} ₽/м²</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Стд. отклонение (σ)</span>
                      <span className="font-medium">{formatPrice(cat.stdDev)} ₽/м²</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Forecast */}
          <div className="border-t border-border pt-12 mb-16">
            <div className="text-minimal tracking-widest text-muted-foreground mb-6">ПРОГНОЗ</div>
            <div className="max-w-2xl space-y-4">
              <p className="text-sm text-muted-foreground">
                По прогнозу на 2026–2027 гг., среднее значение (μ) продолжит рост на 5–7% в год, 
                привязанное к стоимости промышленной энергии и логистической инфляции. При этом стандартное 
                отклонение (σ) будет сокращаться по мере локализации высокотехнологичного производства.
              </p>
              <p className="text-sm text-muted-foreground">
                Для застройщиков и собственников данные Q1 2026 подчёркивают важность раннего закупа 
                материалов — сроки поставки специализированных позиций составляют 6–8 недель.
              </p>
            </div>
          </div>

          {/* Sources */}
          <div className="border-t border-border pt-8">
            <div className="text-xs tracking-widest text-muted-foreground mb-4">ИСТОЧНИКИ ДАННЫХ</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Банки.ру, ГДВЛ, Nikoliers, JLL Global Office Fit-Out Cost Guide 2025, Turner & Townsend, 
              Домклик, Sostav.ru, Клерк.ру, ПрофРемСтрой, аналитика Q1 2026. Полный список из 41 источника 
              доступен в исследовательском отчёте.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              to="/calculator"
              className="inline-block border border-foreground text-foreground px-8 py-3 text-minimal tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              РАССЧИТАТЬ СТОИМОСТЬ ПРОЕКТА →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarketResearch;
