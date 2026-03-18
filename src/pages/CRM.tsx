import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CRMLeads from "@/components/crm/CRMLeads";
import CRMBlog from "@/components/crm/CRMBlog";
import CRMMaterials from "@/components/crm/CRMMaterials";
import CRMPortfolio from "@/components/crm/CRMPortfolio";

type Section = "leads" | "blog" | "materials" | "portfolio";

const NAV_ITEMS: { key: Section; label: string; icon: string }[] = [
  { key: "leads", label: "Лиды", icon: "◈" },
  { key: "blog", label: "Блог", icon: "◇" },
  { key: "materials", label: "Материалы", icon: "○" },
  { key: "portfolio", label: "Портфолио", icon: "◻" },
];

const CRM = () => {
  const [section, setSection] = useState<Section>("leads");
  const [userEmail, setUserEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email || "");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user.email || "");
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast({ title: "Вы вышли из системы" });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0 bg-foreground text-background flex flex-col transition-all duration-300 sticky top-0 h-screen`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-background/10 flex items-center gap-3 min-h-[57px]">
          {sidebarOpen && (
            <a href="/" className="text-minimal text-background/70 hover:text-background transition-colors truncate text-xs tracking-widest">
              TIUNIN DESIGN
            </a>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="ml-auto text-background/40 hover:text-background transition-colors flex-shrink-0 text-lg leading-none"
            title={sidebarOpen ? "Свернуть" : "Развернуть"}
          >
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                section === item.key
                  ? "bg-background/10 text-background"
                  : "text-background/50 hover:text-background hover:bg-background/5"
              }`}
            >
              <span className="text-lg flex-shrink-0 w-6 text-center">{item.icon}</span>
              {sidebarOpen && (
                <span className="text-minimal text-xs tracking-widest">{item.label.toUpperCase()}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-background/10 space-y-3">
          {sidebarOpen && (
            <p className="text-xs text-background/40 truncate">{userEmail}</p>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-background/40 hover:text-background transition-colors"
            title="Выйти"
          >
            <span className="text-lg flex-shrink-0 w-6 text-center">⎋</span>
            {sidebarOpen && <span className="text-minimal text-xs tracking-widest">ВЫЙТИ</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-minimal text-muted-foreground text-xs tracking-widest">CRM</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-minimal text-xs tracking-widest">
              {NAV_ITEMS.find((i) => i.key === section)?.label.toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-muted-foreground hidden md:block">{userEmail}</span>
        </header>

        {/* Section content */}
        <div className="p-8">
          {section === "leads" && <CRMLeads />}
          {section === "blog" && <CRMBlog />}
          {section === "materials" && <CRMMaterials />}
          {section === "portfolio" && <CRMPortfolio />}
        </div>
      </main>
    </div>
  );
};

export default CRM;
