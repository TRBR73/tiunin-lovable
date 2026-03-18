import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePageSEO } from "@/hooks/usePageSEO";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import project1 from "@/assets/project-1.jpg";
import project2 from "@/assets/project-2.jpg";
import project3 from "@/assets/project-3.jpg";

type PortfolioItem = {
  id: string;
  title: string;
  location: string;
  year: string;
  description: string;
  image_url: string;
  category: string;
  featured: boolean;
  sort_order: number;
};

const resolveImage = (url: string) => {
  if (url.includes("project-1")) return project1;
  if (url.includes("project-2")) return project2;
  if (url.includes("project-3")) return project3;
  return url;
};

const Work = () => {
  usePageSEO({
    title: "Проекты дизайна интерьера — портфолио Tiunin Design, Москва",
    description: "Портфолио проектов студии Tiunin Design: квартиры, частные резиденции и коммерческие пространства в Москве. Смотрите реализованные работы.",
    canonical: "https://tiunin.ru/work",
  });

  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ВСЕ");

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error || !data) {
        setProjects([]);
      } else {
        setProjects(data as PortfolioItem[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const categories = ["ВСЕ", ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))];
  const filtered = activeCategory === "ВСЕ" ? projects : projects.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://tiunin.ru/" },
        { name: "Проекты", url: "https://tiunin.ru/work" },
      ]} />
      <Navigation />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h1 className="text-6xl md:text-8xl font-light text-architectural mb-8">
                НАШИ РАБОТЫ
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl">
                Подборка наших архитектурных проектов, каждый из которых рассказывает 
                уникальную историю через продуманный дизайн и внимание к деталям.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-8 justify-center md:justify-start">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`text-minimal transition-colors duration-300 relative group ${
                    activeCategory === category 
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category.toUpperCase()}
                  <span className={`absolute bottom-0 left-0 w-full h-px bg-foreground transition-transform duration-300 origin-left ${
                    activeCategory === category 
                      ? "scale-x-100" 
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-16 lg:gap-20">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="w-full h-[60vh] bg-muted-foreground/10" />
                    <div className="mt-8 h-8 bg-muted-foreground/10 w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-16 lg:gap-20">
                {filtered.map((project) => (
                  <Link
                    key={project.id}
                    to={project.id.startsWith("fallback") ? "#" : `/project/${project.id}`}
                    className="group cursor-pointer block"
                  >
                    <div className="relative overflow-hidden mb-8">
                      <img 
                        src={resolveImage(project.image_url)} 
                        alt={project.title}
                        className="w-full h-[60vh] object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {project.category && (
                        <div className="absolute top-6 left-6 bg-background/90 backdrop-blur-sm px-4 py-2">
                          <span className="text-minimal text-foreground">
                            {project.category.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {project.featured && (
                        <div className="absolute top-6 right-6 bg-background/90 backdrop-blur-sm px-4 py-2">
                          <span className="text-minimal text-foreground text-xs">★ ИЗБРАННЫЙ</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl lg:text-3xl font-light text-architectural mb-2 group-hover:text-muted-foreground transition-colors duration-500">
                          {project.title}
                        </h3>
                        <p className="text-minimal text-muted-foreground">
                          {[project.location, project.year].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <p className="text-muted-foreground leading-relaxed line-clamp-2">
                        {project.description}
                      </p>
                      <span className="text-minimal text-xs text-muted-foreground group-hover:text-foreground transition-colors inline-block pt-2">
                        ПОДРОБНЕЕ →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-32 bg-muted">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-light text-architectural mb-8">
              Готовы начать
              <br />
              ваш проект?
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Давайте обсудим, как воплотить ваше архитектурное видение в жизнь
            </p>
            <a 
              href="/contact" 
              className="inline-block text-minimal text-foreground hover:text-muted-foreground transition-colors duration-300 relative group"
            >
              СВЯЗАТЬСЯ С НАМИ
              <span className="absolute bottom-0 left-0 w-full h-px bg-foreground group-hover:bg-muted-foreground transition-colors duration-300"></span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Work;
