import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Material = {
  id: string;
  article: string;
  name: string;
  category: string;
  subcategory: string;
  collection: string;
  supplier: string;
  transparency: string;
  material_type: string;
  application: string[];
  control_type: string[];
  properties: string[];
  description: string;
  image_url: string;
  in_stock: boolean;
  featured: boolean;
  source_url: string;
  width_min: number | null;
  width_max: number | null;
  warranty: string;
  production_days: string;
};

type SortKey = "name" | "category" | "supplier" | "article";
type SortDir = "asc" | "desc";

const TRANSPARENCY_LABELS: Record<string, string> = {
  "прозрачная": "Прозрачная",
  "полупрозрачная": "Полупрозрачная",
  "dim-out": "Dim-out",
  "screen": "Screen",
  "blackout": "Blackout 100%",
};

const TRANSPARENCY_COLORS: Record<string, string> = {
  "прозрачная": "text-sky-600 border-sky-300 bg-sky-50",
  "полупрозрачная": "text-blue-600 border-blue-300 bg-blue-50",
  "dim-out": "text-amber-600 border-amber-300 bg-amber-50",
  "screen": "text-teal-600 border-teal-300 bg-teal-50",
  "blackout": "text-slate-700 border-slate-400 bg-slate-100",
};

const CRMMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterTransparency, setFilterTransparency] = useState("");
  const [filterStock, setFilterStock] = useState<"" | "in" | "out">("");
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("category");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<"table" | "cards">("table");
  const [selected, setSelected] = useState<Material | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("category", { ascending: true });
    if (error) {
      toast({ title: "Ошибка загрузки каталога", variant: "destructive" });
    } else {
      setMaterials(data || []);
    }
    setLoading(false);
  };

  // Dynamic filter options
  const categories = useMemo(() => [...new Set(materials.map((m) => m.category))].sort(), [materials]);
  const subcategories = useMemo(() =>
    [...new Set(materials.filter((m) => !filterCategory || m.category === filterCategory).map((m) => m.subcategory))].filter(Boolean).sort(),
    [materials, filterCategory]);
  const suppliers = useMemo(() => [...new Set(materials.map((m) => m.supplier))].filter(Boolean).sort(), [materials]);
  const transparencies = useMemo(() => [...new Set(materials.map((m) => m.transparency))].filter(Boolean).sort(), [materials]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = materials;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.article.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.collection.toLowerCase().includes(q)
      );
    }
    if (filterCategory) result = result.filter((m) => m.category === filterCategory);
    if (filterSubcategory) result = result.filter((m) => m.subcategory === filterSubcategory);
    if (filterSupplier) result = result.filter((m) => m.supplier === filterSupplier);
    if (filterTransparency) result = result.filter((m) => m.transparency === filterTransparency);
    if (filterStock === "in") result = result.filter((m) => m.in_stock);
    if (filterStock === "out") result = result.filter((m) => !m.in_stock);
    if (filterFeatured) result = result.filter((m) => m.featured);

    return [...result].sort((a, b) => {
      const av = a[sortKey]?.toString().toLowerCase() ?? "";
      const bv = b[sortKey]?.toString().toLowerCase() ?? "";
      return sortDir === "asc" ? av.localeCompare(bv, "ru") : bv.localeCompare(av, "ru");
    });
  }, [materials, search, filterCategory, filterSubcategory, filterSupplier, filterTransparency, filterStock, filterFeatured, sortKey, sortDir]);

  const resetFilters = () => {
    setSearch("");
    setFilterCategory("");
    setFilterSubcategory("");
    setFilterSupplier("");
    setFilterTransparency("");
    setFilterStock("");
    setFilterFeatured(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIndicator = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === "asc" ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>) : null;

  if (loading) return <div className="text-center py-24 text-muted-foreground">Загрузка каталога...</div>;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-140px)]">
      {/* ── Sidebar filters ── */}
      <aside className="w-56 flex-shrink-0 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-minimal text-xs tracking-widest text-muted-foreground">ФИЛЬТРЫ</span>
          <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors">сбросить</button>
        </div>

        {/* Search */}
        <div>
          <label className="text-minimal text-muted-foreground text-xs block mb-1.5">ПОИСК</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Артикул, название..."
            className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-minimal text-muted-foreground text-xs block mb-1.5">КАТЕГОРИЯ</label>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory(""); }}
            className="w-full bg-background border border-border text-foreground text-xs py-1.5 px-2 focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="">Все</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Subcategory */}
        {subcategories.length > 0 && (
          <div>
            <label className="text-minimal text-muted-foreground text-xs block mb-1.5">ПОДКАТЕГОРИЯ</label>
            <select
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="w-full bg-background border border-border text-foreground text-xs py-1.5 px-2 focus:outline-none focus:border-foreground transition-colors"
            >
              <option value="">Все</option>
              {subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {/* Transparency */}
        <div>
          <label className="text-minimal text-muted-foreground text-xs block mb-1.5">СВЕТОПРОПУСКАНИЕ</label>
          <select
            value={filterTransparency}
            onChange={(e) => setFilterTransparency(e.target.value)}
            className="w-full bg-background border border-border text-foreground text-xs py-1.5 px-2 focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="">Все</option>
            {transparencies.map((t) => (
              <option key={t} value={t}>{TRANSPARENCY_LABELS[t] || t}</option>
            ))}
          </select>
        </div>

        {/* Supplier */}
        <div>
          <label className="text-minimal text-muted-foreground text-xs block mb-1.5">ПРОИЗВОДИТЕЛЬ</label>
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="w-full bg-background border border-border text-foreground text-xs py-1.5 px-2 focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="">Все</option>
            {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Stock */}
        <div>
          <label className="text-minimal text-muted-foreground text-xs block mb-1.5">НАЛИЧИЕ</label>
          <div className="space-y-1">
            {[
              { value: "", label: "Все" },
              { value: "in", label: "В наличии" },
              { value: "out", label: "Под заказ" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStock(opt.value as "" | "in" | "out")}
                className={`w-full text-left text-xs px-2 py-1 border transition-colors ${
                  filterStock === opt.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterFeatured}
            onChange={(e) => setFilterFeatured(e.target.checked)}
            className="w-3.5 h-3.5"
          />
          <span className="text-minimal text-xs tracking-widest text-muted-foreground">РЕКОМЕНДУЕМЫЕ</span>
        </label>

        {/* Stats */}
        <div className="pt-4 border-t border-border space-y-1">
          <div className="text-xs text-muted-foreground">Показано: <span className="text-foreground font-medium">{filtered.length}</span></div>
          <div className="text-xs text-muted-foreground">Всего: <span className="text-foreground">{materials.length}</span></div>
          <div className="text-xs text-muted-foreground">Источник: <a href="https://decolux.pro" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">decolux.pro</a></div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-light">Каталог материалов</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Шторы, жалюзи, маркизы, карнизы — DECOLUX.PRO</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("table")}
              className={`text-minimal text-xs px-3 py-1.5 border transition-colors ${view === "table" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground"}`}
            >
              ☰ ТАБЛИЦА
            </button>
            <button
              onClick={() => setView("cards")}
              className={`text-minimal text-xs px-3 py-1.5 border transition-colors ${view === "cards" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground"}`}
            >
              ⊞ КАРТОЧКИ
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 border border-border">
            <p className="text-muted-foreground">Ничего не найдено</p>
            <button onClick={resetFilters} className="mt-3 text-xs text-muted-foreground underline hover:text-foreground">Сбросить фильтры</button>
          </div>
        ) : view === "table" ? (
          /* ── TABLE ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { key: "article" as SortKey, label: "АРТИКУЛ" },
                    { key: "name" as SortKey, label: "НАИМЕНОВАНИЕ" },
                    { key: "category" as SortKey, label: "КАТЕГОРИЯ" },
                    { key: "supplier" as SortKey, label: "ПРОИЗВОДИТЕЛЬ" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="text-left text-minimal text-muted-foreground text-xs py-2 pr-4 cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
                    >
                      {label}<SortIndicator k={key} />
                    </th>
                  ))}
                  <th className="text-left text-minimal text-muted-foreground text-xs py-2 pr-4 whitespace-nowrap">СВЕТОПРОП.</th>
                  <th className="text-left text-minimal text-muted-foreground text-xs py-2 pr-4 whitespace-nowrap">ПРИМЕНЕНИЕ</th>
                  <th className="text-left text-minimal text-muted-foreground text-xs py-2 whitespace-nowrap">СТАТУС</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{m.article}</td>
                    <td className="py-2.5 pr-4 font-light">
                      <div className="flex items-center gap-2">
                        {m.featured && <span className="text-amber-500 text-xs">★</span>}
                        {m.name}
                      </div>
                      {m.collection && <div className="text-xs text-muted-foreground">{m.collection}</div>}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="text-xs">{m.category}</div>
                      {m.subcategory && <div className="text-xs text-muted-foreground">{m.subcategory}</div>}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{m.supplier}</td>
                    <td className="py-2.5 pr-4">
                      {m.transparency ? (
                        <span className={`text-minimal text-xs px-2 py-0.5 border rounded-none ${TRANSPARENCY_COLORS[m.transparency] || "text-muted-foreground border-border"}`}>
                          {TRANSPARENCY_LABELS[m.transparency] || m.transparency}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {m.application.slice(0, 2).map((a) => (
                          <span key={a} className="text-xs text-muted-foreground border border-border px-1.5 py-0.5 whitespace-nowrap">{a}</span>
                        ))}
                        {m.application.length > 2 && <span className="text-xs text-muted-foreground">+{m.application.length - 2}</span>}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-minimal text-xs px-2 py-0.5 border ${m.in_stock ? "border-green-500/50 text-green-600" : "border-border text-muted-foreground"}`}>
                        {m.in_stock ? "В наличии" : "Под заказ"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── CARDS ── */
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelected(m)}
                className="border border-border p-4 hover:border-foreground/40 cursor-pointer transition-colors duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground mb-1">{m.article}</div>
                    <div className="font-light text-sm group-hover:text-muted-foreground transition-colors">
                      {m.featured && <span className="text-amber-500 mr-1">★</span>}
                      {m.name}
                    </div>
                  </div>
                  <span className={`text-minimal text-xs px-2 py-0.5 border flex-shrink-0 ml-2 ${m.in_stock ? "border-green-500/50 text-green-600" : "border-border text-muted-foreground"}`}>
                    {m.in_stock ? "есть" : "заказ"}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs border border-border text-muted-foreground px-2 py-0.5">{m.category}</span>
                    {m.subcategory && <span className="text-xs text-muted-foreground">{m.subcategory}</span>}
                  </div>
                  {m.transparency && (
                    <span className={`inline-block text-minimal text-xs px-2 py-0.5 border ${TRANSPARENCY_COLORS[m.transparency] || "text-muted-foreground border-border"}`}>
                      {TRANSPARENCY_LABELS[m.transparency] || m.transparency}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{m.description}</p>

                <div className="flex flex-wrap gap-1">
                  {m.properties.slice(0, 3).map((p) => (
                    <span key={p} className="text-xs text-muted-foreground border border-border/50 px-1.5 py-0.5">{p}</span>
                  ))}
                </div>

                {m.supplier && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">{m.supplier}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative bg-background border-l border-border w-full max-w-md h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div>
                <div className="font-mono text-xs text-muted-foreground">{selected.article}</div>
                <h3 className="text-lg font-light mt-0.5">{selected.name}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {selected.featured && (
                  <span className="text-minimal text-xs px-2 py-1 border border-amber-400 text-amber-600">★ РЕКОМЕНДУЕТСЯ</span>
                )}
                <span className={`text-minimal text-xs px-2 py-1 border ${selected.in_stock ? "border-green-500/50 text-green-600" : "border-border text-muted-foreground"}`}>
                  {selected.in_stock ? "В НАЛИЧИИ" : "ПОД ЗАКАЗ"}
                </span>
                {selected.transparency && (
                  <span className={`text-minimal text-xs px-2 py-1 border ${TRANSPARENCY_COLORS[selected.transparency] || "text-muted-foreground border-border"}`}>
                    {TRANSPARENCY_LABELS[selected.transparency] || selected.transparency}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
              </div>

              {/* Specs */}
              <div className="space-y-3">
                <h4 className="text-minimal text-muted-foreground text-xs tracking-widest">ХАРАКТЕРИСТИКИ</h4>
                {[
                  { label: "Категория", value: selected.category },
                  { label: "Подкатегория", value: selected.subcategory },
                  { label: "Коллекция", value: selected.collection },
                  { label: "Производитель", value: selected.supplier },
                  { label: "Тип материала", value: selected.material_type },
                  { label: "Производство", value: selected.production_days },
                  { label: "Гарантия", value: selected.warranty },
                  selected.width_min ? { label: "Ширина", value: `${selected.width_min}–${selected.width_max} см` } : null,
                ].filter(Boolean).map((spec) => spec && spec.value && (
                  <div key={spec.label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-muted-foreground text-xs flex-shrink-0">{spec.label}</span>
                    <span className="text-right text-xs">{spec.value}</span>
                  </div>
                ))}
              </div>

              {/* Control types */}
              {selected.control_type.length > 0 && (
                <div>
                  <h4 className="text-minimal text-muted-foreground text-xs tracking-widest mb-2">УПРАВЛЕНИЕ</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.control_type.map((c) => (
                      <span key={c} className="text-xs border border-border text-muted-foreground px-2 py-1">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application */}
              {selected.application.length > 0 && (
                <div>
                  <h4 className="text-minimal text-muted-foreground text-xs tracking-widest mb-2">ПРИМЕНЕНИЕ</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.application.map((a) => (
                      <span key={a} className="text-xs border border-border text-muted-foreground px-2 py-1">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Properties */}
              {selected.properties.length > 0 && (
                <div>
                  <h4 className="text-minimal text-muted-foreground text-xs tracking-widest mb-2">СВОЙСТВА</h4>
                  <ul className="space-y-1">
                    {selected.properties.map((p) => (
                      <li key={p} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="text-foreground">✔</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Source */}
              <div className="pt-4 border-t border-border">
                <a
                  href={selected.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-minimal text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  → Источник: decolux.pro
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMMaterials;
