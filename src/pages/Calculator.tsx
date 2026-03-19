import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { usePageSEO } from "@/hooks/usePageSEO";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Home, Castle, Store, ChevronRight, ChevronLeft, FileText, Check } from "lucide-react";

type ObjectType = "new_build" | "secondary" | "house" | "commercial";

const OBJECT_TYPES: { id: ObjectType; label: string; desc: string; icon: typeof Building2 }[] = [
  { id: "new_build", label: "Новостройка", desc: "Квартира в новом доме (бетон)", icon: Building2 },
  { id: "secondary", label: "Вторичное жильё", desc: "Нужен демонтаж и обмеры", icon: Home },
  { id: "house", label: "Частная резиденция", desc: "Архитектура + интерьер", icon: Castle },
  { id: "commercial", label: "Коммерция", desc: "Офис / Ритейл / HoReCa", icon: Store },
];

const TARIFFS: Record<ObjectType, { interior: number; architecture: number }> = {
  new_build: { interior: 8500, architecture: 0 },
  secondary: { interior: 8500, architecture: 0 },
  house: { interior: 8500, architecture: 4500 },
  commercial: { interior: 6000, architecture: 0 },
};

const BASE_K: Record<ObjectType, number> = {
  new_build: 1.0,
  secondary: 1.2,
  house: 1.0,
  commercial: 1.0,
};

const TOTAL_STEPS = 4;

const MATERIAL_COSTS: Record<string, { label: string; mean: number; stdDev: number; min: number; max: number }> = {
  house: { label: "Строительство дома (коробка)", mean: 115000, stdDev: 21500, min: 79000, max: 151000 },
  commercial: { label: "Коммерческий интерьер", mean: 58500, stdDev: 16800, min: 36000, max: 89000 },
  residential: { label: "Ремонт жилых помещений", mean: 44000, stdDev: 10500, min: 26000, max: 63000 },
};

const WORK_COSTS = {
  construction: { label: "Работы строительной организации", mean: 55000, stdDev: 12000, min: 30000, max: 80000 },
  renovation: { label: "Работы ремонтной организации", mean: 32000, stdDev: 8500, min: 15000, max: 50000 },
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const formatPriceShort = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);

const Calculator = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  usePageSEO({
    title: "Калькулятор стоимости дизайн-проекта — Tiunin Design, Москва",
    description: "Рассчитайте стоимость дизайн-проекта интерьера онлайн. Калькулятор учитывает площадь, тип объекта, техническую сложность и стоимость реализации.",
    canonical: "https://tiunin.ru/calculator",
  });

  const [step, setStep] = useState(() => {
    const paramStep = searchParams.get("step");
    return paramStep ? Math.max(1, Math.min(4, parseInt(paramStep, 10) || 1)) : 1;
  });
  const [objectType, setObjectType] = useState<ObjectType | null>(() => {
    // Auto-select "house" when coming from area-calculator (step=2 + area param)
    const paramStep = searchParams.get("step");
    const paramArea = searchParams.get("area");
    if (paramStep === "2" && paramArea) return "house";
    return null;
  });
  const [area, setArea] = useState(() => {
    const paramArea = searchParams.get("area");
    return paramArea ? Math.max(30, Math.min(1000, parseInt(paramArea, 10) || 100)) : 100;
  });
  const [designProject, setDesignProject] = useState(true);
  const [architectureProject, setArchitectureProject] = useState(false);
  const [management, setManagement] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [ventilation, setVentilation] = useState(false);
  const [smartHome, setSmartHome] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [consent, setConsent] = useState(false);

  // Realization cost sliders (per m²)
  const [workCost, setWorkCost] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  // Additional sliders for house: renovation work + interior materials
  const [renovationWorkCost, setRenovationWorkCost] = useState(0);
  const [interiorMaterialCost, setInteriorMaterialCost] = useState(0);

  // Initialize slider defaults when objectType changes
  const workConfig = objectType === "house" ? WORK_COSTS.construction : WORK_COSTS.renovation;
  const materialConfig = objectType === "house" ? MATERIAL_COSTS.house
    : objectType === "commercial" ? MATERIAL_COSTS.commercial
    : MATERIAL_COSTS.residential;

  // Reset sliders to mean when object type changes
  useEffect(() => {
    if (objectType) {
      const wc = objectType === "house" ? WORK_COSTS.construction : WORK_COSTS.renovation;
      const mc = objectType === "house" ? MATERIAL_COSTS.house
        : objectType === "commercial" ? MATERIAL_COSTS.commercial
        : MATERIAL_COSTS.residential;
      setWorkCost(wc.mean);
      setMaterialCost(mc.mean);
      if (objectType === "house") {
        setRenovationWorkCost(WORK_COSTS.renovation.mean);
        setInteriorMaterialCost(MATERIAL_COSTS.residential.mean);
      } else {
        setRenovationWorkCost(0);
        setInteriorMaterialCost(0);
      }
    }
  }, [objectType]);

  // Lead form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canNext = step === 1 ? objectType !== null : true;

  const calc = useMemo(() => {
    if (!objectType) return { design: 0, arch: 0, mgmt: 0, realization: 0, workTotal: 0, materialTotal: 0, renovationWorkTotal: 0, interiorMaterialTotal: 0, total: 0, grandTotal: 0, k: 1 };
    const tariff = TARIFFS[objectType];
    let k = BASE_K[objectType];
    if (replanning) k += 0.15;
    if (ventilation) k += 0.05;
    if (smartHome) k += 0.05;
    if (urgent) k += 0.2;

    const design = designProject ? area * tariff.interior * k : 0;
    const arch = architectureProject && objectType === "house" ? area * tariff.architecture * k : 0;
    const workTotal = area * workCost;
    const materialTotal = area * materialCost;
    const renovationWorkTotal = objectType === "house" ? area * renovationWorkCost : 0;
    const interiorMaterialTotal = objectType === "house" ? area * interiorMaterialCost : 0;
    const realization = workTotal + materialTotal + renovationWorkTotal + interiorMaterialTotal;
    const mgmt = management ? realization * 0.06 : 0;
    const total = design + arch + mgmt;
    const grandTotal = total + realization;
    return { design, arch, mgmt, realization, workTotal, materialTotal, renovationWorkTotal, interiorMaterialTotal, total, grandTotal, k };
  }, [objectType, area, designProject, architectureProject, management, replanning, ventilation, smartHome, urgent, workCost, materialCost, renovationWorkCost, interiorMaterialCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const params = { objectType, area, designProject, architectureProject, management, replanning, ventilation, smartHome, urgent, workCost, materialCost, renovationWorkCost, interiorMaterialCost, realization: calc.realization, estimate: calc.total };
    const { error } = await supabase.from("leads").insert({
      name,
      email,
      phone: phone || null,
      source: "calculator",
      message: JSON.stringify(params, null, 2),
      service: objectType === "house" ? "Архитектура + Интерьер" : objectType === "commercial" ? "Коммерция" : "Дизайн интерьера",
    });
    if (error) {
      toast({ title: "Ошибка", description: "Не удалось отправить заявку. Попробуйте позже.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Заявка отправлена!", description: "Мы свяжемся с вами в ближайшее время." });
    }
    setSubmitting(false);
  };

  const LiveEstimate = () => (
    <div className="space-y-6">
      <div className="text-minimal tracking-widest text-muted-foreground">ЖИВАЯ СМЕТА</div>
      <div className="space-y-4">
        {calc.design > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Дизайн-проект</span>
            <span className="text-sm font-medium">{formatPrice(calc.design)}</span>
          </div>
        )}
        {calc.arch > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Архитектурный проект</span>
            <span className="text-sm font-medium">{formatPrice(calc.arch)}</span>
          </div>
        )}
        {designProject && (
          <>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Комплектация</span>
              <span className="text-sm font-medium text-muted-foreground">Включено</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Авторский надзор</span>
              <span className="text-sm font-medium text-muted-foreground">Включено</span>
            </div>
          </>
        )}
        {calc.realization > 0 && (
          <>
            <div className="border-t border-border pt-3 mt-3">
              <div className="text-xs tracking-widest text-muted-foreground mb-2">СТОИМОСТЬ РЕАЛИЗАЦИИ</div>
            </div>
            {calc.workTotal > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">{objectType === "house" ? "Работы (строительство)" : "Работы"}</span>
                <span className="text-sm font-medium">{formatPrice(calc.workTotal)}</span>
              </div>
            )}
            {calc.materialTotal > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">{objectType === "house" ? "Материалы (коробка)" : "Материалы"}</span>
                <span className="text-sm font-medium">{formatPrice(calc.materialTotal)}</span>
              </div>
            )}
            {calc.renovationWorkTotal > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Работы (ремонт)</span>
                <span className="text-sm font-medium">{formatPrice(calc.renovationWorkTotal)}</span>
              </div>
            )}
            {calc.interiorMaterialTotal > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Материалы (интерьер)</span>
                <span className="text-sm font-medium">{formatPrice(calc.interiorMaterialTotal)}</span>
              </div>
            )}
          </>
        )}
        {calc.mgmt > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Управление (6%)</span>
            <span className="text-sm font-medium">{formatPrice(calc.mgmt)}</span>
          </div>
        )}
        {calc.k > 1 && (
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Коэффициент сложности</span>
            <span className="text-sm font-medium">×{calc.k.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs text-muted-foreground tracking-widest">НАШИ УСЛУГИ</span>
            <span className="text-sm font-medium">{formatPrice(calc.total)}</span>
          </div>
          {calc.realization > 0 && (
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-xs text-muted-foreground tracking-widest">РЕАЛИЗАЦИЯ</span>
              <span className="text-sm font-medium">{formatPrice(calc.realization)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-3 border-t border-foreground/20">
            <span className="text-minimal tracking-widest">ПОЛНАЯ СТОИМОСТЬ</span>
            <span className="text-2xl font-light text-architectural">{formatPrice(calc.grandTotal)}</span>
          </div>
        </div>
        {area < 50 && (
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-sm">
            Для малых площадей действует фиксированный тариф. Свяжитесь с нами для уточнения.
          </div>
        )}
      </div>
      <div className="mt-4 text-[10px] leading-relaxed text-muted-foreground/70">
        Расчёт носит информационный характер и&nbsp;не&nbsp;является публичной офертой (ст.&nbsp;437 ГК&nbsp;РФ). Итоговая стоимость может отличаться от&nbsp;предварительной калькуляции в&nbsp;пределах ±20% в&nbsp;зависимости от&nbsp;индивидуальных особенностей объекта.
      </div>
    </div>
  );

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-12">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors duration-300 ${
            i + 1 === step ? "bg-foreground text-background" :
            i + 1 < step ? "bg-foreground/80 text-background" : "bg-muted text-muted-foreground"
          }`}>
            {i + 1 < step ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < TOTAL_STEPS - 1 && <div className={`w-8 h-px ${i + 1 < step ? "bg-foreground" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://tiunin.ru/" },
        { name: "Калькулятор", url: "https://tiunin.ru/calculator" },
      ]} />
      <Navigation />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="mb-16">
            <div className="text-minimal tracking-widest text-muted-foreground mb-4">КАЛЬКУЛЯТОР</div>
            <h1 className="text-4xl md:text-5xl font-light text-architectural mb-4">
              Рассчитайте стоимость проекта
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Ответьте на несколько вопросов, чтобы получить предварительную оценку бюджета вашего проекта.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Wizard */}
            <div className="lg:col-span-2">
              <StepIndicator />

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h2 className="text-2xl font-light text-architectural">Выберите тип объекта</h2>
                  <p className="text-sm text-muted-foreground">Это определит базовую сложность и подход к проектированию.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {OBJECT_TYPES.map((t) => {
                      const Icon = t.icon;
                      const selected = objectType === t.id;
                      return (
                        <Card
                          key={t.id}
                          onClick={() => setObjectType(t.id)}
                          className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-elegant ${
                            selected ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30"
                          }`}
                        >
                          <Icon className={`w-6 h-6 mb-4 ${selected ? "text-background" : "text-muted-foreground"}`} />
                          <div className={`text-sm font-medium mb-1 ${selected ? "text-background" : ""}`}>{t.label}</div>
                          <div className={`text-xs ${selected ? "text-background/70" : "text-muted-foreground"}`}>{t.desc}</div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-8 animate-fade-in-up">
                  <h2 className="text-2xl font-light text-architectural">Площадь объекта</h2>
                  <p className="text-sm text-muted-foreground">Укажите общую площадь вашего объекта в квадратных метрах.</p>
                  {objectType === "house" && (
                    <Link
                      to="/area-calculator?return=/calculator"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-sm px-4 py-2.5 transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      Не знаете площадь? Рассчитайте по комнатам
                    </Link>
                  )}
                  <div className="space-y-8">
                    <div className="text-center">
                      <span className="text-6xl font-light text-architectural">{area}</span>
                      <span className="text-2xl font-light text-muted-foreground ml-2">м²</span>
                    </div>
                    <Slider
                      value={[area]}
                      onValueChange={(v) => setArea(v[0])}
                      min={30}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>30 м²</span>
                      <span>1000 м²</span>
                    </div>
                    {area < 50 && (
                      <div className="bg-muted p-4 rounded-sm text-sm text-muted-foreground">
                        Для площадей менее 50 м² действует фиксированный тариф. Мы уточним стоимость индивидуально.
                      </div>
                    )}
                    {/* Visual doc stack */}
                    <div className="flex flex-col items-center gap-2 pt-4">
                      <div className="flex items-end gap-[3px]">
                        {Array.from({ length: Math.max(1, Math.min(12, Math.ceil(area / 80))) }, (_, i) => (
                          <div
                            key={i}
                            className="animate-fade-in"
                            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                          >
                            <FileText
                              className="text-muted-foreground/60"
                              style={{
                                width: 18,
                                height: 22,
                                opacity: 0.4 + (i / 12) * 0.6,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Объём документации — <span className="font-medium text-foreground">{Math.ceil(area / 10)} листов</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-8 animate-fade-in-up">
                  <h2 className="text-2xl font-light text-architectural">Состав услуг</h2>
                  <p className="text-sm text-muted-foreground">Выберите необходимые услуги для вашего проекта.</p>
                  <div className="space-y-6">
                    {objectType === "house" && (
                      <label className="flex items-start gap-4 p-5 border border-border rounded-sm cursor-pointer hover:border-foreground/30 transition-colors">
                        <Checkbox
                          checked={architectureProject}
                          onCheckedChange={(v) => setArchitectureProject(v === true)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-medium">Архитектурный проект</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Полный комплект архитектурных решений для загородного дома — {formatPrice(4500)}/м²
                          </div>
                        </div>
                      </label>
                    )}
                    <label className="flex items-start gap-4 p-5 border border-border rounded-sm cursor-pointer hover:border-foreground/30 transition-colors">
                      <Checkbox checked={designProject} onCheckedChange={(v) => setDesignProject(v === true)} className="mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">
                          Дизайн-проект интерьера
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Полный комплект рабочей документации — {formatPrice(objectType === "commercial" ? 6000 : 8500)}/м²
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-4 p-5 border border-muted bg-muted/50 rounded-sm">
                      <Checkbox checked={designProject} disabled className="mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Авторское сопровождение и комплектация</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Включено в дизайн-проект интерьера
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-4 p-5 border border-border rounded-sm cursor-pointer hover:border-foreground/30 transition-colors">
                      <Checkbox checked={management} onCheckedChange={(v) => setManagement(v === true)} className="mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Управление реализацией (Project Management)</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Координация подрядчиков, контроль качества и сроков — 6% от стоимости реализации
                        </div>
                      </div>
                    </label>

                    {/* Realization cost sliders */}
                    <div className="border-t border-border pt-6 mt-6 space-y-8">
                      <div>
                        <div className="text-minimal tracking-widest text-muted-foreground mb-6">СТОИМОСТЬ РЕАЛИЗАЦИИ</div>
                        <p className="text-xs text-muted-foreground mb-6">
                          Укажите ориентировочную стоимость работ и материалов для расчёта управления проектом.
                        </p>
                      </div>

                      {/* Work cost slider */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium">{workConfig.label}</span>
                          <span className="text-sm font-medium">{formatPriceShort(workCost)} ₽/м²</span>
                        </div>
                        {/* Bell curve visualization */}
                        <div className="relative mt-2">
                          <svg viewBox="0 0 300 80" className="w-full h-20" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="bellGradientWork" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.06" />
                                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.01" />
                              </linearGradient>
                              <linearGradient id="bellGradientWorkActive" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.02" />
                              </linearGradient>
                            </defs>
                            {(() => {
                              const { min, max, mean, stdDev } = workConfig;
                              const h = 70;
                              const pad = 5;
                              const w = 300;
                              const pts: [number, number][] = [];
                              for (let i = 0; i <= w; i++) {
                                const value = min + (i / w) * (max - min);
                                const z = (value - mean) / stdDev;
                                const y = Math.exp(-0.5 * z * z);
                                pts.push([i, pad + h - y * h]);
                              }
                              const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
                              const fillPath = `M0,${pad + h} ${pts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${w},${pad + h} Z`;
                              
                              const regionLeft = Math.max(0, ((mean - stdDev * 0.67) - min) / (max - min) * w);
                              const regionRight = Math.min(w, ((mean + stdDev * 0.67) - min) / (max - min) * w);
                              const regionPts = pts.filter(p => p[0] >= regionLeft && p[0] <= regionRight);
                              const regionFill = regionPts.length > 0 
                                ? `M${regionLeft},${pad + h} ${regionPts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${regionRight},${pad + h} Z`
                                : '';

                              const indicatorX = workCost > 0 ? ((workCost - min) / (max - min)) * w : -10;
                              const meanX = ((mean - min) / (max - min)) * w;

                              return (
                                <>
                                  <path d={fillPath} fill="url(#bellGradientWork)" />
                                  {regionFill && <path d={regionFill} fill="url(#bellGradientWorkActive)" />}
                                  <path d={linePath} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.2" />
                                  <line x1={meanX} y1={pad} x2={meanX} y2={pad + h} stroke="hsl(var(--muted-foreground))" strokeWidth="0.7" strokeDasharray="4 3" opacity="0.5" />
                                  {workCost > 0 && (
                                    <>
                                      <line x1={indicatorX} y1={0} x2={indicatorX} y2={pad + h} stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                                      <circle cx={indicatorX} cy={(() => {
                                        const z = (workCost - mean) / stdDev;
                                        return pad + h - Math.exp(-0.5 * z * z) * h;
                                      })()} r="3" fill="hsl(var(--foreground))" />
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </svg>
                          <div className="flex justify-between items-start mt-[-4px]">
                            <span className="text-[10px] text-muted-foreground/60">бюджетный</span>
                            <div className="flex flex-col items-center" style={{ position: 'absolute', left: `${((workConfig.mean - workConfig.min) / (workConfig.max - workConfig.min)) * 100}%`, transform: 'translateX(-50%)' }}>
                              <Link to="/market-research" className="text-[10px] text-muted-foreground font-medium underline underline-offset-2 hover:text-foreground transition-colors">медиана рынка</Link>
                              <span className="text-[10px] text-muted-foreground/70">{formatPriceShort(workConfig.mean)} ₽</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground/60">премиум</span>
                          </div>
                        </div>
                        <Slider
                          value={[workCost]}
                          onValueChange={(v) => setWorkCost(v[0])}
                          min={workConfig.min}
                          max={workConfig.max}
                          step={1000}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatPriceShort(workConfig.min)} ₽/м²</span>
                          <span>{formatPriceShort(workConfig.max)} ₽/м²</span>
                        </div>
                        {workCost > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Итого за {area} м²: <span className="font-medium text-foreground">{formatPrice(area * workCost)}</span>
                          </div>
                        )}
                      </div>

                      {/* Material cost slider with normal distribution */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium">Материалы — {materialConfig.label}</span>
                          <span className="text-sm font-medium">{formatPriceShort(materialCost)} ₽/м²</span>
                        </div>
                        {/* Bell curve visualization */}
                        <div className="relative mt-2">
                          <svg viewBox="0 0 300 80" className="w-full h-20" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="bellGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.06" />
                                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.01" />
                              </linearGradient>
                              <linearGradient id="bellGradientActive" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.02" />
                              </linearGradient>
                            </defs>
                            {(() => {
                              const { min, max, mean, stdDev } = materialConfig;
                              const h = 70;
                              const pad = 5;
                              const w = 300;
                              const pts: [number, number][] = [];
                              for (let i = 0; i <= w; i++) {
                                const value = min + (i / w) * (max - min);
                                const z = (value - mean) / stdDev;
                                const y = Math.exp(-0.5 * z * z);
                                pts.push([i, pad + h - y * h]);
                              }
                              const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
                              const fillPath = `M0,${pad + h} ${pts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${w},${pad + h} Z`;
                              
                              // Highlighted region: mean ± 0.5*stdDev (most popular ~38%)
                              const regionLeft = Math.max(0, ((mean - stdDev * 0.67) - min) / (max - min) * w);
                              const regionRight = Math.min(w, ((mean + stdDev * 0.67) - min) / (max - min) * w);
                              const regionPts = pts.filter(p => p[0] >= regionLeft && p[0] <= regionRight);
                              const regionFill = regionPts.length > 0 
                                ? `M${regionLeft},${pad + h} ${regionPts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${regionRight},${pad + h} Z`
                                : '';

                              const indicatorX = materialCost > 0 ? ((materialCost - min) / (max - min)) * w : -10;
                              const meanX = ((mean - min) / (max - min)) * w;

                              return (
                                <>
                                  <path d={fillPath} fill="url(#bellGradient)" />
                                  {regionFill && <path d={regionFill} fill="url(#bellGradientActive)" />}
                                  <path d={linePath} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.2" />
                                  {/* Mean dashed line */}
                                  <line x1={meanX} y1={pad} x2={meanX} y2={pad + h} stroke="hsl(var(--muted-foreground))" strokeWidth="0.7" strokeDasharray="4 3" opacity="0.5" />
                                  {/* Current value line */}
                                  {materialCost > 0 && (
                                    <>
                                      <line x1={indicatorX} y1={0} x2={indicatorX} y2={pad + h} stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                                      <circle cx={indicatorX} cy={(() => {
                                        const z = (materialCost - mean) / stdDev;
                                        return pad + h - Math.exp(-0.5 * z * z) * h;
                                      })()} r="3" fill="hsl(var(--foreground))" />
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </svg>
                          {/* Labels */}
                          <div className="flex justify-between items-start mt-[-4px]">
                            <span className="text-[10px] text-muted-foreground/60">бюджетный</span>
                            <div className="flex flex-col items-center" style={{ position: 'absolute', left: `${((materialConfig.mean - materialConfig.min) / (materialConfig.max - materialConfig.min)) * 100}%`, transform: 'translateX(-50%)' }}>
                              <Link to="/market-research" className="text-[10px] text-muted-foreground font-medium underline underline-offset-2 hover:text-foreground transition-colors">медиана рынка</Link>
                              <span className="text-[10px] text-muted-foreground/70">{formatPriceShort(materialConfig.mean)} ₽</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground/60">премиум</span>
                          </div>
                        </div>
                        <Slider
                          value={[materialCost]}
                          onValueChange={(v) => setMaterialCost(v[0])}
                          min={materialConfig.min}
                          max={materialConfig.max}
                          step={1000}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatPriceShort(materialConfig.min)} ₽/м²</span>
                          <span>{formatPriceShort(materialConfig.max)} ₽/м²</span>
                        </div>
                        {materialCost > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Итого за {area} м²: <span className="font-medium text-foreground">{formatPrice(area * materialCost)}</span>
                          </div>
                        )}
                      </div>

                      {/* Additional sliders for house: renovation work + interior materials */}
                      {objectType === "house" && (
                        <>
                          {/* Renovation work slider */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm font-medium">{WORK_COSTS.renovation.label}</span>
                              <span className="text-sm font-medium">{formatPriceShort(renovationWorkCost)} ₽/м²</span>
                            </div>
                            <div className="relative mt-2">
                              <svg viewBox="0 0 300 80" className="w-full h-20" preserveAspectRatio="none">
                                <defs>
                                  <linearGradient id="bellGradientRenWork" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.06" />
                                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.01" />
                                  </linearGradient>
                                  <linearGradient id="bellGradientRenWorkActive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.12" />
                                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.02" />
                                  </linearGradient>
                                </defs>
                                {(() => {
                                  const cfg = WORK_COSTS.renovation;
                                  const { min, max, mean, stdDev } = cfg;
                                  const h = 70, pad = 5, w = 300;
                                  const pts: [number, number][] = [];
                                  for (let i = 0; i <= w; i++) {
                                    const value = min + (i / w) * (max - min);
                                    const z = (value - mean) / stdDev;
                                    pts.push([i, pad + h - Math.exp(-0.5 * z * z) * h]);
                                  }
                                  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
                                  const fillPath = `M0,${pad + h} ${pts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${w},${pad + h} Z`;
                                  const regionLeft = Math.max(0, ((mean - stdDev * 0.67) - min) / (max - min) * w);
                                  const regionRight = Math.min(w, ((mean + stdDev * 0.67) - min) / (max - min) * w);
                                  const regionPts = pts.filter(p => p[0] >= regionLeft && p[0] <= regionRight);
                                  const regionFill = regionPts.length > 0 ? `M${regionLeft},${pad + h} ${regionPts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${regionRight},${pad + h} Z` : '';
                                  const indicatorX = renovationWorkCost > 0 ? ((renovationWorkCost - min) / (max - min)) * w : -10;
                                  const meanX = ((mean - min) / (max - min)) * w;
                                  return (
                                    <>
                                      <path d={fillPath} fill="url(#bellGradientRenWork)" />
                                      {regionFill && <path d={regionFill} fill="url(#bellGradientRenWorkActive)" />}
                                      <path d={linePath} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.2" />
                                      <line x1={meanX} y1={pad} x2={meanX} y2={pad + h} stroke="hsl(var(--muted-foreground))" strokeWidth="0.7" strokeDasharray="4 3" opacity="0.5" />
                                      {renovationWorkCost > 0 && (
                                        <>
                                          <line x1={indicatorX} y1={0} x2={indicatorX} y2={pad + h} stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                                          <circle cx={indicatorX} cy={pad + h - Math.exp(-0.5 * ((renovationWorkCost - mean) / stdDev) ** 2) * h} r="3" fill="hsl(var(--foreground))" />
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </svg>
                              <div className="flex justify-between items-start mt-[-4px]">
                                <span className="text-[10px] text-muted-foreground/60">бюджетный</span>
                                <div className="flex flex-col items-center" style={{ position: 'absolute', left: `${((WORK_COSTS.renovation.mean - WORK_COSTS.renovation.min) / (WORK_COSTS.renovation.max - WORK_COSTS.renovation.min)) * 100}%`, transform: 'translateX(-50%)' }}>
                                  <Link to="/market-research" className="text-[10px] text-muted-foreground font-medium underline underline-offset-2 hover:text-foreground transition-colors">медиана рынка</Link>
                                  <span className="text-[10px] text-muted-foreground/70">{formatPriceShort(WORK_COSTS.renovation.mean)} ₽</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground/60">премиум</span>
                              </div>
                            </div>
                            <Slider value={[renovationWorkCost]} onValueChange={(v) => setRenovationWorkCost(v[0])} min={WORK_COSTS.renovation.min} max={WORK_COSTS.renovation.max} step={1000} className="w-full" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{formatPriceShort(WORK_COSTS.renovation.min)} ₽/м²</span>
                              <span>{formatPriceShort(WORK_COSTS.renovation.max)} ₽/м²</span>
                            </div>
                            {renovationWorkCost > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Итого за {area} м²: <span className="font-medium text-foreground">{formatPrice(area * renovationWorkCost)}</span>
                              </div>
                            )}
                          </div>

                          {/* Interior materials slider */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm font-medium">Материалы — {MATERIAL_COSTS.residential.label}</span>
                              <span className="text-sm font-medium">{formatPriceShort(interiorMaterialCost)} ₽/м²</span>
                            </div>
                            <div className="relative mt-2">
                              <svg viewBox="0 0 300 80" className="w-full h-20" preserveAspectRatio="none">
                                <defs>
                                  <linearGradient id="bellGradientIntMat" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.06" />
                                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.01" />
                                  </linearGradient>
                                  <linearGradient id="bellGradientIntMatActive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.12" />
                                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.02" />
                                  </linearGradient>
                                </defs>
                                {(() => {
                                  const cfg = MATERIAL_COSTS.residential;
                                  const { min, max, mean, stdDev } = cfg;
                                  const h = 70, pad = 5, w = 300;
                                  const pts: [number, number][] = [];
                                  for (let i = 0; i <= w; i++) {
                                    const value = min + (i / w) * (max - min);
                                    const z = (value - mean) / stdDev;
                                    pts.push([i, pad + h - Math.exp(-0.5 * z * z) * h]);
                                  }
                                  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
                                  const fillPath = `M0,${pad + h} ${pts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${w},${pad + h} Z`;
                                  const regionLeft = Math.max(0, ((mean - stdDev * 0.67) - min) / (max - min) * w);
                                  const regionRight = Math.min(w, ((mean + stdDev * 0.67) - min) / (max - min) * w);
                                  const regionPts = pts.filter(p => p[0] >= regionLeft && p[0] <= regionRight);
                                  const regionFill = regionPts.length > 0 ? `M${regionLeft},${pad + h} ${regionPts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${regionRight},${pad + h} Z` : '';
                                  const indicatorX = interiorMaterialCost > 0 ? ((interiorMaterialCost - min) / (max - min)) * w : -10;
                                  const meanX = ((mean - min) / (max - min)) * w;
                                  return (
                                    <>
                                      <path d={fillPath} fill="url(#bellGradientIntMat)" />
                                      {regionFill && <path d={regionFill} fill="url(#bellGradientIntMatActive)" />}
                                      <path d={linePath} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.2" />
                                      <line x1={meanX} y1={pad} x2={meanX} y2={pad + h} stroke="hsl(var(--muted-foreground))" strokeWidth="0.7" strokeDasharray="4 3" opacity="0.5" />
                                      {interiorMaterialCost > 0 && (
                                        <>
                                          <line x1={indicatorX} y1={0} x2={indicatorX} y2={pad + h} stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                                          <circle cx={indicatorX} cy={pad + h - Math.exp(-0.5 * ((interiorMaterialCost - mean) / stdDev) ** 2) * h} r="3" fill="hsl(var(--foreground))" />
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </svg>
                              <div className="flex justify-between items-start mt-[-4px]">
                                <span className="text-[10px] text-muted-foreground/60">бюджетный</span>
                                <div className="flex flex-col items-center" style={{ position: 'absolute', left: `${((MATERIAL_COSTS.residential.mean - MATERIAL_COSTS.residential.min) / (MATERIAL_COSTS.residential.max - MATERIAL_COSTS.residential.min)) * 100}%`, transform: 'translateX(-50%)' }}>
                                  <Link to="/market-research" className="text-[10px] text-muted-foreground font-medium underline underline-offset-2 hover:text-foreground transition-colors">медиана рынка</Link>
                                  <span className="text-[10px] text-muted-foreground/70">{formatPriceShort(MATERIAL_COSTS.residential.mean)} ₽</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground/60">премиум</span>
                              </div>
                            </div>
                            <Slider value={[interiorMaterialCost]} onValueChange={(v) => setInteriorMaterialCost(v[0])} min={MATERIAL_COSTS.residential.min} max={MATERIAL_COSTS.residential.max} step={1000} className="w-full" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{formatPriceShort(MATERIAL_COSTS.residential.min)} ₽/м²</span>
                              <span>{formatPriceShort(MATERIAL_COSTS.residential.max)} ₽/м²</span>
                            </div>
                            {interiorMaterialCost > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Итого за {area} м²: <span className="font-medium text-foreground">{formatPrice(area * interiorMaterialCost)}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {(workCost > 0 || materialCost > 0 || renovationWorkCost > 0 || interiorMaterialCost > 0) && (
                        <div className="bg-muted p-4 rounded-sm space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Бюджет реализации</span>
                            <span className="font-medium">{formatPrice(calc.realization)}</span>
                          </div>
                          {management && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Управление (6%)</span>
                              <span className="font-medium">{formatPrice(calc.mgmt)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && !submitted && (
                <div className="space-y-8 animate-fade-in-up">
                  <h2 className="text-2xl font-light text-architectural">Техническая сложность</h2>
                  <p className="text-sm text-muted-foreground">Дополнительные факторы, влияющие на глубину проработки проекта.</p>
                  <div className="space-y-6">
                    {objectType !== "house" && (
                      <div className="flex items-center justify-between p-5 border border-border rounded-sm">
                        <div>
                          <div className="text-sm font-medium">Перепланировка и согласование</div>
                          <div className="text-xs text-muted-foreground mt-1">Разработка и согласование перепланировки в государственных органах</div>
                        </div>
                        <Switch checked={replanning} onCheckedChange={setReplanning} />
                      </div>
                    )}
                    <div className="flex items-center justify-between p-5 border border-border rounded-sm">
                      <div>
                        <div className="text-sm font-medium">Проект вентиляции</div>
                        <div className="text-xs text-muted-foreground mt-1">Проектирование приточно-вытяжной вентиляции и кондиционирования</div>
                      </div>
                      <Switch checked={ventilation} onCheckedChange={setVentilation} />
                    </div>
                    <div className="flex items-center justify-between p-5 border border-border rounded-sm">
                      <div>
                        <div className="text-sm font-medium">«Умный дом»</div>
                        <div className="text-xs text-muted-foreground mt-1">Проектирование системы автоматизации и управления инженерными системами</div>
                      </div>
                      <Switch checked={smartHome} onCheckedChange={setSmartHome} />
                    </div>
                    <div className="flex items-center justify-between p-5 border border-border rounded-sm">
                      <div>
                        <div className="text-sm font-medium">Ограничения по срокам</div>
                        <div className="text-xs text-muted-foreground mt-1">Наценка за срочность выполнения проекта</div>
                      </div>
                      <Switch checked={urgent} onCheckedChange={setUrgent} />
                    </div>
                  </div>

                  {/* Lead Form */}
                  <div className="mt-12 pt-8 border-t border-border">
                    <div className="max-w-md">
                      <h3 className="text-xl font-light text-architectural mb-3">Получите детальную смету</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Мы рассчитали предварительный бюджет вашего проекта. Чтобы получить детальную смету в PDF с графиком работ и спецификацией материалов, оставьте ваши контакты.
                      </p>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ваше имя"
                          required
                          className="h-11"
                        />
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Телефон"
                          className="h-11"
                        />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="E-mail"
                          required
                          className="h-11"
                        />
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={consent}
                            onCheckedChange={(v) => setConsent(v === true)}
                            className="mt-0.5"
                            required
                          />
                          <span className="text-xs text-muted-foreground">
                            Я согласен на обработку{" "}
                            <Link to="/privacy-policy" className="underline hover:text-foreground transition-colors" target="_blank">
                              персональных данных
                            </Link>
                          </span>
                        </label>
                        <Button type="submit" disabled={submitting || !consent} className="w-full h-12 tracking-widest text-sm font-semibold uppercase">
                          {submitting ? "Отправка..." : "Получить смету"}
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Success */}
              {submitted && (
                <div className="text-center py-20 space-y-6 animate-fade-in-up">
                  <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-light text-architectural">Спасибо за заявку!</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Мы свяжемся с вами в ближайшее время и подготовим детальную смету вашего проекта.
                  </p>
                  <Link to="/" className="inline-block text-minimal tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    ← НА ГЛАВНУЮ
                  </Link>
                </div>
              )}

              {/* Navigation */}
              {!submitted && (
                <div className="flex justify-between mt-12">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="text-minimal tracking-widest gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> НАЗАД
                  </Button>
                  {step < TOTAL_STEPS && (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step + 1)}
                      disabled={!canNext}
                      className="text-minimal tracking-widest gap-2 border-foreground text-foreground hover:bg-foreground hover:text-background"
                    >
                      ДАЛЕЕ <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Right: Live Estimate */}
            {!submitted && (
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-28">
                  <Card className="p-8">
                    <LiveEstimate />
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Calculator;
