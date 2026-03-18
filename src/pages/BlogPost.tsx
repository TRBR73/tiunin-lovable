import { useParams, Link } from "react-router-dom";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  read_time: string;
  category: string;
  image_url: string;
};

type RelatedPost = Pick<BlogPost, "id" | "slug" | "title" | "date" | "read_time" | "image_url" | "category">;

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", id)
        .eq("published", true)
        .single();

      if (data) {
        setPost(data);
        // fetch related
        const { data: rel } = await supabase
          .from("blog_posts")
          .select("id, slug, title, date, read_time, image_url, category")
          .eq("published", true)
          .eq("category", data.category)
          .neq("slug", id)
          .limit(2);
        setRelated(rel || []);
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const renderContent = (content: string) =>
    content
      .split("\n")
      .map((line) => {
        if (line.startsWith("# "))
          return `<h1 class="text-3xl md:text-4xl font-light text-architectural mb-8 mt-12">${escapeHtml(line.substring(2))}</h1>`;
        if (line.startsWith("## "))
          return `<h2 class="text-2xl md:text-3xl font-light text-architectural mb-6 mt-10">${escapeHtml(line.substring(3))}</h2>`;
        if (line.startsWith("### "))
          return `<h3 class="text-xl md:text-2xl font-medium text-foreground mb-4 mt-8">${escapeHtml(line.substring(4))}</h3>`;
        if (line.startsWith("- **") && line.endsWith("**"))
          return `<li class="ml-6 mb-2"><strong class="text-foreground">${escapeHtml(line.substring(4, line.length - 2))}</strong></li>`;
        if (line.startsWith("- "))
          return `<li class="ml-6 mb-2">${escapeHtml(line.substring(2))}</li>`;
        if (line.trim() === "") return "<br>";
        return `<p class="mb-4">${escapeHtml(line)}</p>`;
      })
      .join("");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 text-center text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-32">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-light text-architectural mb-8">Статья не найдена</h1>
              <Link to="/blog" className="text-minimal text-foreground hover:text-muted-foreground transition-colors duration-300">
                ← НАЗАД К БЛОГУ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://tiunin.ru/" },
        { name: "Блог", url: "https://tiunin.ru/blog" },
        { name: post.title, url: `https://tiunin.ru/blog/${post.slug}` },
      ]} />
      <Navigation />

      <article className="pt-32 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/blog"
              className="inline-block text-minimal text-muted-foreground hover:text-foreground transition-colors duration-300 mb-12"
            >
              ← НАЗАД К БЛОГУ
            </Link>

            <div className="mb-8">
              <div className="flex items-center text-minimal text-muted-foreground space-x-4 mb-6">
                {post.category && <span className="bg-muted px-3 py-1 text-foreground">{post.category}</span>}
                <span>{post.date}</span>
                {post.read_time && <><span>•</span><span>{post.read_time}</span></>}
                {post.author && <><span>•</span><span>{post.author}</span></>}
              </div>

              <h1 className="text-4xl md:text-6xl font-light text-architectural mb-6">{post.title}</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">{post.excerpt}</p>
            </div>

            {post.image_url && (
              <div className="w-full h-96 mb-12 overflow-hidden">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            )}

            <div className="prose prose-lg max-w-none">
              <div
                className="text-muted-foreground leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
              />
            </div>

            {post.author && (
              <div className="mt-16 pt-8 border-t border-border">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-full" />
                  <div>
                    <h3 className="text-lg font-medium text-foreground">{post.author}</h3>
                    <p className="text-muted-foreground">Архитектор и автор</p>
                  </div>
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="mt-20">
                <h3 className="text-2xl font-light text-architectural mb-8">Похожие статьи</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {related.map((rp) => (
                    <Link key={rp.id} to={`/blog/${rp.slug}`} className="group">
                      <div className="w-full h-48 mb-4 overflow-hidden">
                        <img
                          src={rp.image_url}
                          alt={rp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <h4 className="text-lg font-light text-architectural group-hover:text-muted-foreground transition-colors duration-300 mb-2">
                        {rp.title}
                      </h4>
                      <p className="text-minimal text-muted-foreground">
                        {rp.date}{rp.read_time && ` • ${rp.read_time}`}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default BlogPost;
