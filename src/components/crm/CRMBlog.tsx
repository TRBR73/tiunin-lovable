import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  published: boolean;
  created_at: string;
};

type EditState = Omit<BlogPost, "id" | "created_at"> & { id?: string };

const EMPTY_POST: EditState = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  author: "",
  date: new Date().toISOString().slice(0, 10),
  read_time: "",
  category: "",
  image_url: "",
  published: true,
};

const CRMBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить статьи", variant: "destructive" });
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const openNew = () => setEditing({ ...EMPTY_POST });
  const openEdit = (post: BlogPost) => setEditing({ ...post });
  const closeEdit = () => setEditing(null);

  const handleUploadImage = async (file: File) => {
    if (!editing) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Файл слишком большой", description: "Максимум 5 МБ", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("portfolio-images")
      .upload(fileName, file, { contentType: file.type });
    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);
    setEditing({ ...editing, image_url: urlData.publicUrl });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim()) {
      toast({ title: "Заполните заголовок и slug", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      slug: editing.slug.trim(),
      title: editing.title.trim(),
      excerpt: editing.excerpt.trim(),
      content: editing.content.trim(),
      author: editing.author.trim(),
      date: editing.date,
      read_time: editing.read_time.trim(),
      category: editing.category.trim(),
      image_url: editing.image_url.trim(),
      published: editing.published,
    };

    if (editing.id) {
      // Update
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Статья обновлена" });
        fetchPosts();
        closeEdit();
      }
    } else {
      // Insert
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) {
        toast({ title: "Ошибка создания", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Статья создана" });
        fetchPosts();
        closeEdit();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Статья удалена" });
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ published: !post.published })
      .eq("id", post.id);
    if (!error) {
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, published: !p.published } : p));
    }
  };

  // ── Editor view ──
  if (editing !== null) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-8">
          <button onClick={closeEdit} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            ← Назад
          </button>
          <h2 className="text-xl font-light">{editing.id ? "Редактировать статью" : "Новая статья"}</h2>
        </div>

        <div className="max-w-3xl space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-minimal text-muted-foreground text-xs block mb-2">ЗАГОЛОВОК *</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                placeholder="Заголовок статьи"
              />
            </div>
            <div>
              <label className="text-minimal text-muted-foreground text-xs block mb-2">SLUG * (URL)</label>
              <input
                type="text"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors font-mono"
                placeholder="my-article-slug"
              />
            </div>
          </div>

          <div>
            <label className="text-minimal text-muted-foreground text-xs block mb-2">КРАТКОЕ ОПИСАНИЕ</label>
            <textarea
              value={editing.excerpt}
              onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              rows={2}
              className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
              placeholder="Краткое описание для превью"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-minimal text-muted-foreground text-xs block mb-2">АВТОР</label>
              <input
                type="text"
                value={editing.author}
                onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                placeholder="Имя автора"
              />
            </div>
            <div>
              <label className="text-minimal text-muted-foreground text-xs block mb-2">ДАТА</label>
              <input
                type="date"
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                className="w-full bg-transparent border-b border-border text-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-minimal text-muted-foreground text-xs block mb-2">КАТЕГОРИЯ</label>
            <input
              type="text"
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value.toUpperCase() })}
              className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors max-w-xs"
              placeholder="ДИЗАЙН"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="text-minimal text-muted-foreground text-xs block mb-2">ИЗОБРАЖЕНИЕ</label>
            {editing.image_url ? (
              <div className="relative group w-full max-w-md aspect-video overflow-hidden bg-muted">
                <img src={editing.image_url} alt="Превью" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] tracking-widest px-3 py-1.5 bg-background text-foreground hover:bg-background/80 transition-colors"
                  >
                    ЗАМЕНИТЬ
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, image_url: "" })}
                    className="text-[10px] tracking-widest px-3 py-1.5 border border-background text-background hover:bg-background/20 transition-colors"
                  >
                    УДАЛИТЬ
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full max-w-md h-32 border-2 border-dashed border-border hover:border-foreground/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <span className="text-2xl text-muted-foreground group-hover:text-foreground transition-colors">+</span>
                <span className="text-minimal text-xs tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {uploading ? "ЗАГРУЗКА..." : "ДОБАВИТЬ ФОТО"}
                </span>
                <span className="text-xs text-muted-foreground/60">JPG, PNG, WEBP · до 5 МБ</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleUploadImage(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>

          <div>
            <label className="text-minimal text-muted-foreground text-xs block mb-2">КОНТЕНТ (Markdown)</label>
            <textarea
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              rows={16}
              className="w-full bg-transparent border border-border text-foreground placeholder-muted-foreground p-4 text-sm focus:outline-none focus:border-foreground transition-colors resize-y font-mono"
              placeholder="# Заголовок статьи&#10;&#10;Текст статьи в формате Markdown..."
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-minimal text-xs tracking-widest text-muted-foreground">ОПУБЛИКОВАТЬ</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-minimal text-xs tracking-widest px-8 py-3 bg-foreground text-background hover:bg-foreground/80 transition-colors disabled:opacity-50"
            >
              {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
            </button>
            <button
              onClick={closeEdit}
              className="text-minimal text-xs tracking-widest px-8 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              ОТМЕНА
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light mb-1">Статьи блога</h2>
          <p className="text-muted-foreground text-sm">{posts.length} статей</p>
        </div>
        <button
          onClick={openNew}
          className="text-minimal text-xs tracking-widest px-6 py-3 bg-foreground text-background hover:bg-foreground/80 transition-colors"
        >
          + НОВАЯ СТАТЬЯ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-24 text-muted-foreground">Загрузка...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 border border-border">
          <p className="text-muted-foreground">Статей пока нет</p>
          <button onClick={openNew} className="mt-4 text-minimal text-xs underline text-muted-foreground hover:text-foreground">
            Создать первую статью
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="border border-border p-5 hover:border-foreground/30 transition-colors duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="text-lg font-light truncate">{post.title}</span>
                    <span className={`text-minimal text-xs px-2 py-0.5 border flex-shrink-0 ${
                      post.published
                        ? "border-green-500/50 text-green-500"
                        : "border-border text-muted-foreground"
                    }`}>
                      {post.published ? "ОПУБЛИКОВАНО" : "ЧЕРНОВИК"}
                    </span>
                    {post.category && (
                      <span className="text-minimal text-xs px-2 py-0.5 border border-border text-muted-foreground">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{post.date}</span>
                    {post.author && <><span>·</span><span>{post.author}</span></>}
                    {post.read_time && <><span>·</span><span>{post.read_time}</span></>}
                    <span className="font-mono">/{post.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePublish(post)}
                    className="text-minimal text-xs px-3 py-1.5 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  >
                    {post.published ? "Скрыть" : "Опубл."}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    className="text-minimal text-xs px-3 py-1.5 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  >
                    Ред.
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-minimal text-xs px-3 py-1.5 border border-red-500/30 text-red-500/70 hover:border-red-500 hover:text-red-500 transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CRMBlog;
