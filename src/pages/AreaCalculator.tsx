import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { usePageSEO } from "@/hooks/usePageSEO";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { ArrowLeft, Calculator } from "lucide-react";

const ROOM_DEFAULTS: Record<string, { label: string; area: number; desc: string }> = {
  bedroom: { label: "Спальня", area: 16, desc: "~16 м² на комнату" },
  childRoom: { label: "Детская", area: 14, desc: "~14 м² на комнату" },
  livingRoom: { label: "Гостиная", area: 25, desc: "~25 м²" },
  kitchen: { label: "Кухня-гостиная", area: 30, desc: "~30 м²" },
  bathroom: { label: "Санузел", area: 6, desc: "~6 м² на единицу" },
  hallway: { label: "Прихожая / коридор", area: 10, desc: "~10 м²" },
  laundry: { label: "Постирочная", area: 6, desc: "~6 м²" },
};

const BEDROOM_OPTIONS = {
  ensuiteBathroom: { label: "Санузел", area: 5 },
  ensuiteWardrobe: { label: "Гардеробная", area: 6 },
};

const EXTRAS: Record<string, { label: string; area: number; desc: string }> = {
  garage: { label: "Гараж", area: 35, desc: "~35 м² (на 1-2 авто)" },
  pool: { label: "Бассейн", area: 40, desc: "~40 м² (зона бассейна)" },
  sauna: { label: "Сауна / баня", area: 15, desc: "~15 м²" },
  terrace: { label: "Терраса", area: 20, desc: "~20 м²" },
  office: { label: "Кабинет", area: 12, desc: "~12 м²" },
  gym: { label: "Спортзал", area: 20, desc: "~20 м²" },
  cinema: { label: "Кинозал", area: 18, desc: "~18 м²" },
  wardrobe: { label: "Гардеробная", area: 8, desc: "~8 м² на единицу" },
};

type BedroomOption = { ensuiteBathroom: boolean; ensuiteWardrobe: boolean };

const AreaCalculator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("return") || "/calculator";

  usePageSEO({
    title: "Расчёт площади дома по комнатам — Tiunin Design",
    description: "Онлайн-калькулятор площади загородного дома. Рассчитайте площадь по количеству этажей, комнат, санузлов, наличию гаража, бассейна и сауны.",
    canonical: "https://tiunin.ru/area-calculator",
  });

  const [floors, setFloors] = useState(2);
  const [rooms, setRooms] = useState<Record<string, number>>({
    bedroom: 2,
    childRoom: 1,
    livingRoom: 1,
    kitchen: 1,
    bathroom: 2,
    hallway: 1,
    laundry: 0,
  });
  const [bedroomOptions, setBedroomOptions] = useState<BedroomOption[]>([
    { ensuiteBathroom: false, ensuiteWardrobe: false },
    { ensuiteBathroom: false, ensuiteWardrobe: false },
  ]);
  const [extras, setExtras] = useState<Record<string, boolean>>({
    garage: false,
    pool: false,
    sauna: false,
    terrace: false,
    office: false,
    gym: false,
    cinema: false,
    wardrobe: false,
  });

  const updateRoom = (key: string, delta: number) => {
    const newCount = Math.max(0, Math.min(10, (rooms[key] || 0) + delta));
    setRooms((prev) => ({ ...prev, [key]: newCount }));

    if (key === "bedroom") {
      setBedroomOptions((prev) => {
        if (newCount > prev.length) {
          return [
            ...prev,
            ...Array.from({ length: newCount - prev.length }, () => ({
              ensuiteBathroom: false,
              ensuiteWardrobe: false,
            })),
          ];
        }
        return prev.slice(0, newCount);
      });
    }
  };

  const toggleBedroomOption = (index: number, option: keyof BedroomOption) => {
    setBedroomOptions((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [option]: !item[option] } : item
      )
    );
  };

  const totalArea = useMemo(() => {
    let area = 0;
    Object.entries(rooms).forEach(([key, count]) => {
      area += (ROOM_DEFAULTS[key]?.area || 0) * count;
    });
    // Bedroom ensuite options
    bedroomOptions.forEach((opt) => {
      if (opt.ensuiteBathroom) area += BEDROOM_OPTIONS.ensuiteBathroom.area;
      if (opt.ensuiteWardrobe) area += BEDROOM_OPTIONS.ensuiteWardrobe.area;
    });
    Object.entries(extras).forEach(([key, enabled]) => {
      if (enabled) area += EXTRAS[key]?.area || 0;
    });
    const overhead = 1 + (floors - 1) * 0.12;
    area *= overhead;
    return Math.round(area);
  }, [rooms, extras, floors, bedroomOptions]);

  const handleApply = () => {
    navigate(`/calculator?area=${totalArea}&step=2`);
  };

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://tiunin.ru/" },
        { name: "Калькулятор", url: "https://tiunin.ru/calculator" },
        { name: "Расчёт площади", url: "https://tiunin.ru/area-calculator" },
      ]} />
      <Navigation />
      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <button
            onClick={() => navigate(returnTo)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к калькулятору
          </button>

          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-light text-architectural mb-4">
              Расчёт площади объекта
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Определите ориентировочную площадь дома, исходя из количества помещений и дополнительных зон.
            </p>
          </div>

          {/* Floors */}
          <section className="mb-10">
            <div className="text-minimal tracking-widest text-muted-foreground mb-4">ЭТАЖНОСТЬ</div>
            <div className="flex items-center gap-6">
              <Slider
                value={[floors]}
                onValueChange={(v) => setFloors(v[0])}
                min={1}
                max={4}
                step={1}
                className="flex-1"
              />
              <span className="text-2xl font-light text-architectural w-12 text-right">{floors}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Каждый дополнительный этаж добавляет ~12% на лестницы, холлы и стены
            </p>
          </section>

          {/* Rooms */}
          <section className="mb-10">
            <div className="text-minimal tracking-widest text-muted-foreground mb-6">ПОМЕЩЕНИЯ</div>
            <div className="space-y-3">
              {Object.entries(ROOM_DEFAULTS).map(([key, config]) => (
                <div key={key}>
                  <div className="flex items-center justify-between p-4 border border-border rounded-sm hover:border-foreground/20 transition-colors">
                    <div>
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-xs text-muted-foreground">{config.desc}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateRoom(key, -1)}
                        className="w-8 h-8 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{rooms[key] || 0}</span>
                      <button
                        onClick={() => updateRoom(key, 1)}
                        className="w-8 h-8 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Bedroom ensuite options */}
                  {key === "bedroom" && rooms.bedroom > 0 && (
                    <div className="ml-4 mt-2 space-y-2 mb-1">
                      {bedroomOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-3 border border-border/60 rounded-sm bg-muted/30"
                        >
                          <span className="text-xs text-muted-foreground w-20 shrink-0">
                            Спальня {idx + 1}
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={opt.ensuiteBathroom}
                              onCheckedChange={() => toggleBedroomOption(idx, "ensuiteBathroom")}
                            />
                            <span className="text-xs">Санузел (+{BEDROOM_OPTIONS.ensuiteBathroom.area} м²)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={opt.ensuiteWardrobe}
                              onCheckedChange={() => toggleBedroomOption(idx, "ensuiteWardrobe")}
                            />
                            <span className="text-xs">Гардеробная (+{BEDROOM_OPTIONS.ensuiteWardrobe.area} м²)</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Extras */}
          <section className="mb-12">
            <div className="text-minimal tracking-widest text-muted-foreground mb-6">ДОПОЛНИТЕЛЬНЫЕ ЗОНЫ</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(EXTRAS).map(([key, config]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-4 border border-border rounded-sm cursor-pointer hover:border-foreground/20 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{config.desc}</div>
                  </div>
                  <Switch
                    checked={extras[key] || false}
                    onCheckedChange={(v) => setExtras((prev) => ({ ...prev, [key]: v }))}
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Result */}
          <div className="sticky bottom-6 z-10">
            <div className="bg-foreground text-background rounded-sm p-6 flex items-center justify-between shadow-2xl">
              <div>
                <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Расчётная площадь</div>
                <div className="text-3xl font-light">{totalArea} м²</div>
              </div>
              <Button
                onClick={handleApply}
                variant="secondary"
                className="h-12 px-6 text-sm font-semibold uppercase tracking-wider"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Применить
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AreaCalculator;
