import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  service: string | null;
  source: string;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  contacted: "Связались",
  in_progress: "В работе",
  closed: "Закрыт",
  rejected: "Отклонён",
};

const SOURCE_LABELS: Record<string, string> = {
  hero_form: "Hero-форма",
  contact_form: "Контактная форма",
  consultation_form: "Форма консультации",
};

const SERVICE_LABELS: Record<string, string> = {
  residential: "Жилые объекты",
  commercial: "Коммерческие объекты",
  renovation: "Реновация",
  consultation: "Консультация",
};

const CRMLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить лиды", variant: "destructive" });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: "Не удалось обновить статус", variant: "destructive" });
    } else {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      toast({ title: "Статус обновлён" });
    }
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: "Не удалось удалить лид", variant: "destructive" });
    } else {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Лид удалён" });
    }
  };

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const counts = {
    all: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    in_progress: leads.filter((l) => l.status === "in_progress").length,
    closed: leads.filter((l) => l.status === "closed").length,
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Всего лидов", value: counts.all, color: "text-foreground" },
          { label: "Новых", value: counts.new, color: "text-blue-500" },
          { label: "В работе", value: counts.in_progress, color: "text-yellow-500" },
          { label: "Закрытых", value: counts.closed, color: "text-green-500" },
        ].map((stat) => (
          <div key={stat.label} className="border border-border p-5">
            <div className={`text-4xl font-light ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-minimal text-muted-foreground text-xs">{stat.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "ВСЕ" },
          { key: "new", label: "НОВЫЕ" },
          { key: "contacted", label: "СВЯЗАЛИСЬ" },
          { key: "in_progress", label: "В РАБОТЕ" },
          { key: "closed", label: "ЗАКРЫТЫЕ" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-minimal text-xs px-3 py-2 border transition-colors duration-200 ${
              filter === key
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {label} ({counts[key as keyof typeof counts] ?? leads.length})
          </button>
        ))}
        <button
          onClick={fetchLeads}
          className="text-minimal text-xs px-3 py-2 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors duration-200 ml-auto"
        >
          ↻ ОБНОВИТЬ
        </button>
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="text-center py-24 text-muted-foreground">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-border">
          <p className="text-muted-foreground">Лидов пока нет</p>
          <p className="text-sm text-muted-foreground mt-2">Они появятся здесь после отправки форм на сайте</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div key={lead.id} className="border border-border p-5 hover:border-foreground/30 transition-colors duration-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-lg font-light">{lead.name}</span>
                    <span className={`text-minimal text-xs px-2 py-1 border ${
                      lead.status === "new" ? "border-blue-500/50 text-blue-500" :
                      lead.status === "in_progress" ? "border-yellow-500/50 text-yellow-500" :
                      lead.status === "closed" ? "border-green-500/50 text-green-500" :
                      "border-border text-muted-foreground"
                    }`}>
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                    <span className="text-minimal text-xs text-muted-foreground px-2 py-1 border border-border">
                      {SOURCE_LABELS[lead.source] || lead.source}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-minimal text-muted-foreground text-xs block mb-1">EMAIL</span>
                      <a href={`mailto:${lead.email}`} className="hover:text-muted-foreground transition-colors">{lead.email}</a>
                    </div>
                    {lead.phone && (
                      <div>
                        <span className="text-minimal text-muted-foreground text-xs block mb-1">ТЕЛЕФОН</span>
                        <a href={`tel:${lead.phone}`} className="hover:text-muted-foreground transition-colors">{lead.phone}</a>
                      </div>
                    )}
                    {lead.service && (
                      <div>
                        <span className="text-minimal text-muted-foreground text-xs block mb-1">УСЛУГА</span>
                        <span>{SERVICE_LABELS[lead.service] || lead.service}</span>
                      </div>
                    )}
                  </div>

                  {lead.message && (
                    <div className="mt-3 p-3 bg-muted/30 border-l-2 border-border">
                      <span className="text-minimal text-muted-foreground text-xs block mb-1">СООБЩЕНИЕ</span>
                      <p className="text-sm text-muted-foreground">{lead.message}</p>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-muted-foreground">{formatDate(lead.created_at)}</div>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[150px]">
                  <span className="text-minimal text-muted-foreground text-xs mb-1">ИЗМЕНИТЬ СТАТУС</span>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => updateStatus(lead.id, key)}
                      disabled={lead.status === key}
                      className={`text-xs text-left px-3 py-1.5 border transition-colors duration-200 ${
                        lead.status === key
                          ? "border-foreground bg-foreground text-background cursor-default"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="text-xs text-left px-3 py-1.5 border border-red-500/30 text-red-500/70 hover:border-red-500 hover:text-red-500 transition-colors duration-200 mt-2"
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

export default CRMLeads;
