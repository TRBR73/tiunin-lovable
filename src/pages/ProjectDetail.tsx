import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

type Project = {
  id: string;
  title: string;
  location: string;
  year: string;
  description: string;
  extended_description: string;
  image_url: string;
  category: string;
  featured: boolean;
};

type ProjectImage = {
  id: string;
  image_url: string;
  is_hero: boolean;
  sort_order: number;
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const [{ data: proj }, { data: imgs }] = await Promise.all([
        supabase.from("portfolio").select("*").eq("id", id).single(),
        supabase.from("portfolio_images").select("*").eq("portfolio_id", id).order("sort_order", { ascending: true }),
      ]);
      setProject(proj as Project | null);
      setImages((imgs as ProjectImage[]) || []);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-20 container mx-auto px-6">
          <div className="animate-pulse space-y-8 max-w-7xl mx-auto">
            <div className="h-8 bg-muted-foreground/10 w-48" />
            <div className="h-[60vh] bg-muted-foreground/10" />
            <div className="h-24 bg-muted-foreground/10 max-w-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-20 container mx-auto px-6 text-center">
          <h1 className="text-4xl font-light mb-4">Проект не найден</h1>
          <Link to="/work" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            ← Вернуться к проектам
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = images.find((i) => i.is_hero) || images[0];
  const heroUrl = heroImage?.image_url || project.image_url;
  const galleryImages = images.length > 0 ? images : (project.image_url ? [{ id: "main", image_url: project.image_url, is_hero: true, sort_order: 0 }] : []);

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://tiunin.ru/" },
        { name: "Проекты", url: "https://tiunin.ru/work" },
        { name: project.title, url: `https://tiunin.ru/project/${project.id}` },
      ]} />
      <Navigation />

      {/* Hero */}
      <section className="pt-24">
        {heroUrl && (
          <div className="w-full h-[70vh] md:h-[80vh] overflow-hidden relative">
            <img
              src={heroUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
              <div className="max-w-7xl mx-auto">
                <Link to="/work" className="text-minimal text-xs tracking-widest text-background/70 hover:text-background transition-colors mb-4 inline-block">
                  ← ПРОЕКТЫ
                </Link>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-background mb-4">
                  {project.title}
                </h1>
                <div className="flex items-center gap-6 text-background/70">
                  {project.location && <span className="text-minimal text-sm">{project.location}</span>}
                  {project.year && <span className="text-minimal text-sm">{project.year}</span>}
                  {project.category && <span className="text-minimal text-sm">{project.category}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Description */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {galleryImages.length > 1 && (
        <section className="pb-32">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-minimal text-muted-foreground mb-8">ГАЛЕРЕЯ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {galleryImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`overflow-hidden cursor-pointer group ${idx === 0 ? "md:col-span-2" : ""}`}
                    onClick={() => setSelectedImage(img.image_url)}
                  >
                    <img
                      src={img.image_url}
                      alt={`${project.title} — ${idx + 1}`}
                      className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                        idx === 0 ? "h-[50vh]" : "h-[40vh]"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Extended Description */}
      {project.extended_description && (
        <section className="pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-minimal text-muted-foreground mb-8">ПОДРОБНЕЕ О ПРОЕКТЕ</h2>
              <div className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.extended_description}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-6 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground text-2xl transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
          <img
            src={selectedImage}
            alt={project.title}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}

      {/* CTA */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-light text-architectural mb-6">
            Хотите подобный проект?
          </h2>
          <a
            href="/contact"
            className="inline-block text-minimal text-foreground hover:text-muted-foreground transition-colors duration-300 relative group"
          >
            СВЯЗАТЬСЯ С НАМИ
            <span className="absolute bottom-0 left-0 w-full h-px bg-foreground group-hover:bg-muted-foreground transition-colors duration-300"></span>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProjectDetail;
