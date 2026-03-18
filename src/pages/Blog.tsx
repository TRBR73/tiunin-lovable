import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/usePageSEO";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  read_time: string;
  category: string;
  image_url: string;
};

const Blog = () => {
  usePageSEO({
    title: "Блог о дизайне интерьера — статьи и идеи от Tiunin Design",
    description: "Статьи о дизайне интерьера, архитектуре и трендах от студии Tiunin Design. Полезные советы и вдохновение для вашего проекта.",
    canonical: "https://tiunin.ru/blog",
  });

  const [activeCategory, setActiveCategory] = useState("ВСЕ");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, author, date, read_time, category, image_url")
        .eq("published", true)
        .order("date", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const categories = ["ВСЕ", ...Array.from(new Set(posts.map((p) => p.category))).filter(Boolean)];

  const filteredPosts = activeCategory === "ВСЕ"
    ? posts
    : posts.filter((post) => post.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://tiunin.ru/" },
        { name: "Блог", url: "https://tiunin.ru/blog" },
      ]} />
      <Navigation />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h1 className="text-6xl md:text-8xl font-light text-architectural mb-8">СТАТЬИ</h1>
              <p className="text-xl text-muted-foreground max-w-3xl">
                Исследуем пересечение архитектуры, дизайна и человеческого опыта
                через вдумчивый анализ и современные перспективы.
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
                  {category}
                  <span className={`absolute bottom-0 left-0 w-full h-px bg-foreground transition-transform duration-300 origin-left ${
                    activeCategory === category
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`} />
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
              <div className="text-center py-24 text-muted-foreground">Загрузка...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">Статей пока нет</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
                {filteredPosts.map((post) => (
                  <article key={post.id} className="group">
                    <Link to={`/blog/${post.slug}`} className="block">
                      <div className="relative overflow-hidden mb-6">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {post.category && (
                          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1">
                            <span className="text-xs text-foreground font-medium">{post.category}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center text-xs text-muted-foreground space-x-4">
                          <span>{post.date}</span>
                          {post.read_time && <><span>•</span><span>{post.read_time}</span></>}
                          {post.author && <><span>•</span><span>{post.author}</span></>}
                        </div>

                        <h2 className="text-xl lg:text-2xl font-light text-architectural group-hover:text-muted-foreground transition-colors duration-500">
                          {post.title}
                        </h2>

                        <p className="text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>

                        <div className="pt-4">
                          <span className="text-minimal text-foreground hover:text-muted-foreground transition-colors duration-300 relative group-hover:underline">
                            ЧИТАТЬ ДАЛЕЕ
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
