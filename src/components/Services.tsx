import { useState } from "react";
import { ChevronDown } from "lucide-react";

const Services = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const services = [
    {
      number: "01",
      title: "ЧАСТНЫЕ РЕЗИДЕНЦИИ",
      description: "Проектирование частных резиденций и коттеджей с учётом индивидуального стиля жизни",
      details: [
        { code: "ЭП", name: "Эскизный проект" },
        { code: "АР", name: "Архитектурные решения" },
        { code: "КР", name: "Конструктивные решения" },
      ],
    },
    {
      number: "02",
      title: "ИНТЕРЬЕРЫ",
      description: "Разработка интерьеров премиального уровня — от концепции до реализации",
      details: [
        { code: null, name: "3D визуализация" },
        { code: null, name: "Комплектация" },
        { code: null, name: "Авторский надзор" },
      ],
    },
    {
      number: "03",
      title: "КОММЕРЧЕСКИЕ ПРОСТРАНСТВА",
      description: "Дизайн коммерческих пространств, улучшающих бизнес-среду и клиентский опыт",
      details: [
        { code: null, name: "3D визуализация" },
        { code: null, name: "Комплектация" },
        { code: null, name: "Авторский надзор" },
      ],
    },
    {
      number: "04",
      title: "КОМПЛЕКСНОЕ УПРАВЛЕНИЕ РЕАЛИЗАЦИЕЙ",
      description: "Строительство через партнёров и ремонт под ключ — полный контроль на каждом этапе",
      details: [
        { code: null, name: "Приёмка объекта" },
        { code: null, name: "Разработка сметы" },
        { code: null, name: "Комплектация и закупка строительных материалов" },
      ],
    },
  ];

  const principles = [
    "Индивидуальность",
    "Комплексный подход",
    "Безупречное качество",
    "Прозрачность и ответственность",
    "Эстетика вне времени"
  ];

  return (
    <section id="services" className="py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-minimal text-muted-foreground mb-4">НАПРАВЛЕНИЯ</h2>
            <h3 className="text-4xl md:text-6xl font-light text-architectural">
              Чем мы занимаемся
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            {services.map((service, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div
                  key={index}
                  className="group border border-border hover:border-foreground/30 transition-all duration-500 cursor-pointer"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-6">
                        <span className="text-minimal text-muted-foreground font-medium">
                          {service.number}
                        </span>
                        <div>
                          <h4 className="text-xl font-light mb-3 text-architectural group-hover:text-foreground transition-colors duration-500">
                            {service.title}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed text-sm">
                            {service.description}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground shrink-0 mt-1 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>

                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? "max-h-60 opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"}`}
                    >
                      <div className="border-t border-border pt-6 space-y-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Включает</p>
                        {service.details.map((detail, i) => (
                          <div key={i} className="flex items-center space-x-3">
                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full shrink-0" />
                            <span className="text-sm text-foreground/80">
                              {detail.code && (
                                <span className="text-muted-foreground font-medium mr-2">({detail.code})</span>
                              )}
                              {detail.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-24 pt-16 border-t border-border">
            <h3 className="text-minimal text-muted-foreground mb-8">НАШИ ПРИНЦИПЫ</h3>
            <div className="flex flex-wrap gap-4">
              {principles.map((principle, index) => (
                <span
                  key={index}
                  className="px-6 py-3 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-300"
                >
                  {principle}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
