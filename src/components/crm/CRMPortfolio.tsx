import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PortfolioItem = {
  id: string;
  title: string;
  location: string;
  year: string;
  description: string;
  extended_description: string;
  image_url: string;
  category: string;
  featured: boolean;
  show_on_hero: boolean;
  sort_order: number;
  created_at: string;
};

type PortfolioImage = {
  id: string;
  portfolio_id: string;
  image_url: string;
  is_hero: boolean;
  sort_order: number;
};

type EditState = Omit<PortfolioItem, "id" | "created_at"> & { id?: string };

const PORTFOLIO_BUCKET = "portfolio-images";

const EMPTY_ITEM: EditState = {
  title: "",
  location: "",
  year: new Date().getFullYear().toString(),
  description: "",
  extended_description: "",
  image_url: "",
  category: "",
  featured: false,
  show_on_hero: false,
  sort_order: 0,
};

const CATEGORIES = [
  "Жилые интерьеры",
  "Коммерческие объекты",
  "Частные резиденции",
  "Комплексная реализация",
];

const CRMPortfolio = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [imagesDirty, setImagesDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveSuccessTimeoutRef = useRef<number | null>(null);
  const { toast } = useToast();

  const markDirty = useCallback(() => setFormDirty(true), []);

  const clearSaveSuccessTimer = useCallback(() => {
    if (saveSuccessTimeoutRef.current !== null) {
      window.clearTimeout(saveSuccessTimeoutRef.current);
      saveSuccessTimeoutRef.current = null;
    }
  }, []);

  const showSavedIndicator = useCallback(() => {
    clearSaveSuccessTimer();
    setSaveSuccess(true);
    saveSuccessTimeoutRef.current = window.setTimeout(() => {
      setSaveSuccess(false);
      saveSuccessTimeoutRef.current = null;
    }, 3000);
  }, [clearSaveSuccessTimer]);

  const invokeCleanupUnusedImages = useCallback(async () => {
    const { error } = await supabase.functions.invoke("cleanup-portfolio-images", { body: {} });
    if (error) console.error("Cleanup error:", error);
  }, []);

  const resetEditor = useCallback(() => {
    clearSaveSuccessTimer();
    setEditing(null);
    setImages([]);
    setImagesDirty(false);
    setFormDirty(false);
    setSaveSuccess(false);
  }, [clearSaveSuccessTimer]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить портфолио", variant: "destructive" });
    } else {
      setItems((data as PortfolioItem[]) || []);
    }
    setLoading(false);
  }, [toast]);

  const invokeIntegrityCheck = useCallback(async (silent = true) => {
    const { data, error } = await supabase.functions.invoke("portfolio-integrity-check", { body: {} });

    if (error) {
      console.error("Integrity check error:", error);
      if (!silent) {
        toast({ title: "Ошибка проверки целостности", description: String(error), variant: "destructive" });
      }
      return;
    }

    if (!silent && data) {
      const fixes = data.fixesApplied ?? 0;
      toast({
        title: fixes > 0 ? `Исправлено: ${fixes}` : "Всё в порядке",
        description: fixes > 0 ? (data.fixes as string[]).join("; ") : "Целостность портфолио подтверждена",
      });
      if (fixes > 0) await fetchItems();
    } else if (data?.fixesApplied > 0) {
      await fetchItems();
    }
  }, [toast, fetchItems]);

  const fetchImages = useCallback(async (portfolioId: string) => {
    const { data, error } = await supabase
      .from("portfolio_images")
      .select("*")
      .eq("portfolio_id", portfolioId)
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить фотографии проекта", variant: "destructive" });
      setImages([]);
      return;
    }

    setImages((data as PortfolioImage[]) || []);
  }, [toast]);

  useEffect(() => {
    if (!formDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [formDirty]);

  useEffect(() => {
    const init = async () => {
      await fetchItems();
      await invokeIntegrityCheck(true);
    };
    void init();
    return () => clearSaveSuccessTimer();
  }, [clearSaveSuccessTimer, fetchItems, invokeIntegrityCheck]);

  const openNew = () => {
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) : -1;
    clearSaveSuccessTimer();
    setEditing({ ...EMPTY_ITEM, sort_order: maxOrder + 1 });
    setImages([]);
    setImagesDirty(false);
    setFormDirty(false);
    setSaveSuccess(false);
  };

  const openEdit = (item: PortfolioItem) => {
    clearSaveSuccessTimer();
    setEditing({ ...item });
    setImages([]);
    setImagesDirty(false);
    setFormDirty(false);
    setSaveSuccess(false);
    void fetchImages(item.id);
  };

  const closeEdit = async (force = false) => {
    if (!force && formDirty && !window.confirm("Есть несохранённые изменения. Вы уверены, что хотите выйти?")) {
      return;
    }

    const shouldCleanupUnusedImages = !editing?.id && images.length > 0;
    resetEditor();

    if (shouldCleanupUnusedImages) {
      await invokeCleanupUnusedImages();
    }
  };

  const handleUploadImages = async (files: FileList) => {
    if (!editing) return;

    const currentCount = images.length;
    const remaining = 10 - currentCount;
    if (remaining <= 0) {
      toast({ title: "Максимум 10 фотографий", variant: "destructive" });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    const uploadedImages: PortfolioImage[] = [];
    const hadNoImagesBeforeUpload = images.length === 0;

    try {
      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: `${file.name} слишком большой`, description: "Максимум 5 МБ", variant: "destructive" });
          continue;
        }

        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from(PORTFOLIO_BUCKET)
          .upload(fileName, file, { contentType: file.type });

        if (error) {
          toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
          continue;
        }

        const { data: urlData } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(fileName);
        uploadedImages.push({
          id: crypto.randomUUID(),
          portfolio_id: editing.id || "",
          image_url: urlData.publicUrl,
          is_hero: false,
          sort_order: currentCount + uploadedImages.length,
        });
      }

      if (uploadedImages.length > 0) {
        const nextImages = uploadedImages.map((img, idx) => ({
          ...img,
          is_hero: hadNoImagesBeforeUpload && idx === 0,
        }));

        setImages((prev) => [...prev, ...nextImages]);
        setImagesDirty(true);
        setFormDirty(true);

        if (hadNoImagesBeforeUpload) {
          setEditing((prev) => (prev ? { ...prev, image_url: nextImages[0].image_url } : prev));
        }

        toast({ title: `Загружено ${uploadedImages.length} фото` });
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (imgId: string) => {
    setImagesDirty(true);
    setFormDirty(true);

    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== imgId);

      if (filtered.length > 0 && !filtered.some((img) => img.is_hero)) {
        const nextImages = filtered.map((img, idx) => ({ ...img, is_hero: idx === 0 }));
        setEditing((current) => (current ? { ...current, image_url: nextImages[0].image_url } : current));
        return nextImages;
      }

      if (filtered.length === 0) {
        setEditing((current) => (current ? { ...current, image_url: "" } : current));
      }

      return filtered;
    });
  };

  const setHero = (imgId: string) => {
    setImagesDirty(true);
    setFormDirty(true);

    setImages((prev) => {
      const updated = prev.map((img) => ({ ...img, is_hero: img.id === imgId }));
      const heroImg = updated.find((img) => img.id === imgId);
      if (heroImg) {
        setEditing((current) => (current ? { ...current, image_url: heroImg.image_url } : current));
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!editing) return;

    if (!editing.title.trim()) {
      toast({ title: "Заполните название проекта", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const normalizedImages = images.map((img, idx) => ({
        ...img,
        sort_order: idx,
        is_hero: images.some((image) => image.is_hero) ? img.is_hero : idx === 0,
      }));
      const heroImage = normalizedImages.find((img) => img.is_hero);
      const payload = {
        title: editing.title.trim(),
        location: editing.location.trim(),
        year: editing.year.trim(),
        description: editing.description.trim(),
        extended_description: editing.extended_description.trim(),
        image_url: heroImage?.image_url || editing.image_url.trim(),
        category: editing.category.trim(),
        featured: editing.featured,
        show_on_hero: editing.show_on_hero,
        sort_order: editing.sort_order,
      };

      let portfolioId = editing.id;
      const isNewProject = !editing.id;

      if (editing.id) {
        const { error } = await supabase.from("portfolio").update(payload).eq("id", editing.id);
        if (error) {
          toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
          return;
        }
      } else {
        const { data, error } = await supabase.from("portfolio").insert(payload).select("id").single();
        if (error || !data) {
          toast({ title: "Ошибка создания", description: error?.message, variant: "destructive" });
          return;
        }
        portfolioId = data.id;
      }

      if (portfolioId && (isNewProject || imagesDirty)) {
        const { error: deleteImagesError } = await supabase.from("portfolio_images").delete().eq("portfolio_id", portfolioId);
        if (deleteImagesError) {
          toast({ title: "Ошибка сохранения фото", description: deleteImagesError.message, variant: "destructive" });
          return;
        }

        if (normalizedImages.length > 0) {
          const imagePayload = normalizedImages.map((img, idx) => ({
            portfolio_id: portfolioId!,
            image_url: img.image_url,
            is_hero: img.is_hero,
            sort_order: idx,
          }));

          const { error: insertImagesError } = await supabase.from("portfolio_images").insert(imagePayload);
          if (insertImagesError) {
            toast({ title: "Проект сохранён, но фото не обновились", description: insertImagesError.message, variant: "destructive" });
            return;
          }
        }
      }

      await invokeCleanupUnusedImages();
      await fetchItems();

      setImages(normalizedImages.map((img) => ({ ...img, portfolio_id: portfolioId || img.portfolio_id })));
      setEditing((prev) => (prev ? { ...prev, ...payload, id: portfolioId } : prev));
      setImagesDirty(false);
      setFormDirty(false);
      showSavedIndicator();
      toast({ title: isNewProject ? "Проект добавлен" : "Проект обновлён" });
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Ошибка сохранения", description: String(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);

    try {
      const { error: imagesError } = await supabase.from("portfolio_images").delete().eq("portfolio_id", id);
      if (imagesError) {
        toast({ title: "Ошибка удаления фото", description: imagesError.message, variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("portfolio").delete().eq("id", id);
      if (error) {
        toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      await invokeCleanupUnusedImages();
      toast({ title: "Проект удалён" });
    } finally {
      setDeleting(null);
    }
  };

  const toggleFeatured = async (item: PortfolioItem) => {
    const { error } = await supabase
      .from("portfolio")
      .update({ featured: !item.featured })
      .eq("id", item.id);

    if (!error) {
      setItems((prev) => prev.map((current) => (current.id === item.id ? { ...current, featured: !current.featured } : current)));
    }
  };

  const moveOrder = async (item: PortfolioItem, direction: "up" | "down") => {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((current) => current.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swapItem = sorted[swapIdx];

    await Promise.all([
      supabase.from("portfolio").update({ sort_order: swapItem.sort_order }).eq("id", item.id),
      supabase.from("portfolio").update({ sort_order: item.sort_order }).eq("id", swapItem.id),
    ]);

    await fetchItems();
  };

  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean)));
  const filtered = filterCategory === "all" ? items : items.filter((item) => item.category === filterCategory);

  if (editing !== null) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => void closeEdit()} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            ← Назад
          </button>
          <h2 className="text-xl font-light">{editing.id ? "Редактировать проект" : "Новый проект"}</h2>
          {formDirty && (
            <span className="text-xs tracking-widest text-muted-foreground ml-auto">● НЕСОХРАНЁННЫЕ ИЗМЕНЕНИЯ</span>
          )}
          {saveSuccess && (
            <span className="text-xs tracking-widest text-foreground ml-auto">✓ СОХРАНЕНО</span>
          )}
        </div>

        <div className="max-w-3xl space-y-6">
          <div className="space-y-3">
            <label className="text-minimal text-muted-foreground text-xs block">
              ФОТОГРАФИИ ПРОЕКТА ({images.length}/10)
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative group aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={img.image_url}
                      alt="Проект"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    {img.is_hero && (
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] tracking-widest px-2 py-1 bg-foreground text-background font-medium">
                          HERO
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.is_hero && (
                        <button
                          type="button"
                          onClick={() => setHero(img.id)}
                          className="text-[10px] tracking-widest px-3 py-1.5 bg-background text-foreground hover:bg-muted transition-colors"
                        >
                          HERO
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="text-[10px] tracking-widest px-3 py-1.5 border border-background text-background hover:bg-background/20 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {images.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 border-2 border-dashed border-border hover:border-foreground/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <span className="text-2xl text-muted-foreground group-hover:text-foreground transition-colors">+</span>
                <span className="text-minimal text-xs tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {uploading ? "ЗАГРУЗКА..." : "ДОБАВИТЬ ФОТО"}
                </span>
                <span className="text-xs text-muted-foreground/60">JPG, PNG, WEBP · до 5 МБ · макс. 10 фото</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void handleUploadImages(e.target.files);
                }
                e.target.value = "";
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-minimal text-muted-foreground text-xs block mb-2">НАЗВАНИЕ ПРОЕКТА *</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => {
                  setEditing({ ...editing, title: e.target.value });
                  markDirty();
                }}
                className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                placeholder="Минималистичная резиденция"
              />
            </div>
            <div>
              <label className="text-minimal text-muted-foreground text-xs block mb-2">ЛОКАЦИЯ</label>
              <input
                type="text"
                value={editing.location}
                onChange={(e) => {
                  setEditing({ ...editing, location: e.target.value });
                  markDirty();
                }}
                className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                placeholder="Москва"
              />
            </div>
            <div>
              <label className="text-minimal text-muted-foreground text-xs block mb-2">ГОД</label>
              <input
                type="text"
                value={editing.year}
                onChange={(e) => {
                  setEditing({ ...editing, year: e.target.value });
                  markDirty();
                }}
                className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                placeholder="2024"
              />
            </div>
          </div>

          <div>
            <label className="text-minimal text-muted-foreground text-xs block mb-2">ОПИСАНИЕ</label>
            <textarea
              value={editing.description}
              onChange={(e) => {
                setEditing({ ...editing, description: e.target.value });
                markDirty();
              }}
              rows={3}
              className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
              placeholder="Краткое описание проекта"
            />
          </div>

          <div>
            <label className="text-minimal text-muted-foreground text-xs block mb-2">РАСШИРЕННОЕ ОПИСАНИЕ (опционально)</label>
            <textarea
              value={editing.extended_description}
              onChange={(e) => {
                setEditing({ ...editing, extended_description: e.target.value });
                markDirty();
              }}
              rows={8}
              className="w-full bg-transparent border border-border text-foreground placeholder-muted-foreground p-4 text-sm focus:outline-none focus:border-foreground transition-colors resize-y"
              placeholder="Подробное описание проекта, которое будет отображаться на отдельной странице проекта после галереи фотографий"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-minimal text-muted-foreground text-xs block mb-2">КАТЕГОРИЯ</label>
              <select
                value={editing.category}
                onChange={(e) => {
                  setEditing({ ...editing, category: e.target.value });
                  markDirty();
                }}
                className="w-full bg-transparent border-b border-border text-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors appearance-none cursor-pointer"
              >
                <option value="">Выберите категорию</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="bg-background text-foreground">
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-minimal text-muted-foreground text-xs block mb-2">ПОРЯДОК ОТОБРАЖЕНИЯ</label>
              <input
                type="number"
                value={editing.sort_order}
                onChange={(e) => {
                  setEditing({ ...editing, sort_order: Number(e.target.value) });
                  markDirty();
                }}
                className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) => {
                  setEditing({ ...editing, featured: e.target.checked });
                  markDirty();
                }}
                className="w-4 h-4"
              />
              <span className="text-minimal text-xs tracking-widest text-muted-foreground">ИЗБРАННЫЙ ПРОЕКТ</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.show_on_hero}
                onChange={(e) => {
                  setEditing({ ...editing, show_on_hero: e.target.checked });
                  markDirty();
                }}
                className="w-4 h-4"
              />
              <span className="text-minimal text-xs tracking-widest text-muted-foreground">ПОКАЗАТЬ НА ГЛАВНОЙ (HERO)</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="text-minimal text-xs tracking-widest px-8 py-3 bg-foreground text-background hover:bg-foreground/80 transition-colors disabled:opacity-50"
            >
              {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
            </button>
            <button
              onClick={() => void closeEdit()}
              className="text-minimal text-xs tracking-widest px-8 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              ОТМЕНА
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light mb-1">Портфолио</h2>
          <p className="text-muted-foreground text-sm">
            {items.length} проектов · {items.filter((item) => item.featured).length} избранных
          </p>
        </div>
        <button
          onClick={openNew}
          className="text-minimal text-xs tracking-widest px-6 py-3 bg-foreground text-background hover:bg-foreground/80 transition-colors"
        >
          + НОВЫЙ ПРОЕКТ
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Всего", value: items.length },
          { label: "Избранных", value: items.filter((item) => item.featured).length },
          { label: "Категорий", value: categories.length },
          { label: "Показано", value: filtered.length },
        ].map((stat) => (
          <div key={stat.label} className="border border-border p-5">
            <div className="text-4xl font-light text-foreground mb-1">{stat.value}</div>
            <div className="text-minimal text-muted-foreground text-xs">{stat.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCategory("all")}
          className={`text-minimal text-xs px-3 py-2 border transition-colors duration-200 ${
            filterCategory === "all"
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          }`}
        >
          ВСЕ ({items.length})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilterCategory(category)}
            className={`text-minimal text-xs px-3 py-2 border transition-colors duration-200 ${
              filterCategory === category
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {category.toUpperCase()} ({items.filter((item) => item.category === category).length})
          </button>
        ))}
        <button
          onClick={() => void invokeIntegrityCheck(false)}
          className="text-minimal text-xs px-3 py-2 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors duration-200"
          title="Проверить целостность: hero-картинки и порядок сортировки"
        >
          ✓ ПРОВЕРКА
        </button>
        <button
          onClick={() => void fetchItems()}
          className="text-minimal text-xs px-3 py-2 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors duration-200 ml-auto"
        >
          ↻ ОБНОВИТЬ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-24 text-muted-foreground">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-border">
          <p className="text-muted-foreground">Проектов пока нет</p>
          <button
            onClick={openNew}
            className="mt-4 text-minimal text-xs underline text-muted-foreground hover:text-foreground"
          >
            Добавить первый проект
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="border border-border hover:border-foreground/30 transition-colors duration-200"
            >
              <div className="flex items-stretch">
                {item.image_url ? (
                  <div className="w-32 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-32 flex-shrink-0 bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">НЕТ ФОТО</span>
                  </div>
                )}

                <div className="flex-1 p-5 flex items-start justify-between gap-4 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-lg font-light truncate">{item.title}</span>
                      {item.featured && (
                        <span className="text-minimal text-xs px-2 py-0.5 border border-border text-foreground flex-shrink-0">
                          ИЗБРАННЫЙ
                        </span>
                      )}
                      {item.show_on_hero && (
                        <span className="text-minimal text-xs px-2 py-0.5 border border-border text-foreground flex-shrink-0">
                          ГЛАВНАЯ
                        </span>
                      )}
                      {item.category && (
                        <span className="text-minimal text-xs px-2 py-0.5 border border-border text-muted-foreground flex-shrink-0">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{item.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {item.location && <span>{item.location}</span>}
                      {item.location && item.year && <span>·</span>}
                      {item.year && <span>{item.year}</span>}
                      <span className="text-muted-foreground/40">· порядок: {item.sort_order}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => void moveOrder(item, "up")}
                        disabled={idx === 0}
                        className="text-xs px-2 py-1 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-20"
                        title="Переместить выше"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => void moveOrder(item, "down")}
                        disabled={idx === filtered.length - 1}
                        className="text-xs px-2 py-1 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-20"
                        title="Переместить ниже"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      onClick={() => void toggleFeatured(item)}
                      className="text-minimal text-xs px-3 py-1.5 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                      title={item.featured ? "Убрать из избранных" : "В избранные"}
                    >
                      ★
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="text-minimal text-xs px-3 py-1.5 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                    >
                      Ред.
                    </button>
                    <button
                      onClick={() => void handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="text-minimal text-xs px-3 py-1.5 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {deleting === item.id ? "..." : "Удалить"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CRMPortfolio;
