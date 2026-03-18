import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

const Portfolio = () => {
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("show_on_hero", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error || !data) {
        setProjects([]);
      } else {
        setProjects(data as PortfolioItem[]);
      }
      setLoading(false);
    };

    fetchPortfolio();
  }, []);

  if (!loading && projects.length === 0) {
    return null;
  }

  return (
    <section id="work" className="py-32 bg-muted">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-minimal text-muted-foreground mb-4">ИЗБРАННЫЕ РАБОТЫ</h2>
            <h3 className="text-4xl md:text-6xl font-light text-architectural">
              Наши проекты
            </h3>
          </div>

          {loading ? (
            <div className="space-y-32">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full h-[70vh] bg-muted-foreground/10" />
                  <div className="mt-8 grid md:grid-cols-3 gap-8">
                    <div className="h-8 bg-muted-foreground/10" />
                    <div className="md:col-span-2 h-8 bg-muted-foreground/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-32">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={resolveImage(project.image_url)}
                      alt={project.title}
                      className="w-full h-[70vh] object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = project1;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {project.featured && (
                      <div className="absolute top-6 right-6">
                        <span className="text-minimal text-xs tracking-widest bg-background/90 text-foreground px-3 py-1.5">
                          ИЗБРАННЫЙ ПРОЕКТ
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 grid md:grid-cols-3 gap-8">
                    <div>
                      <h4 className="text-2xl font-light text-architectural mb-2">
                        {project.title}
                      </h4>
                      <p className="text-minimal text-muted-foreground">
                        {[project.location, project.year].filter(Boolean).join(", ")}
                      </p>
                      {project.category && (
                        <p className="text-minimal text-muted-foreground/60 text-xs mt-1">
                          {project.category.toUpperCase()}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-muted-foreground leading-relaxed">
                        {project.description}
                      </p>
                      <span className="text-minimal text-xs text-muted-foreground group-hover:text-foreground transition-colors inline-block mt-4">
                        ПОДРОБНЕЕ →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
