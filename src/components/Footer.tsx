import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const Footer = () => {
  const [mode, setMode] = useState<"idle" | "login">("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    setIsAdmin(data === true);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setMode("idle");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Ошибка входа", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Добро пожаловать!", description: "Вы успешно вошли в систему." });
      resetForm();
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    toast({ title: "Вы вышли из системы" });
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="text-minimal text-background/50 tracking-widest">TIUNIN DESIGN</div>
            <p className="text-background/60 text-sm leading-relaxed">
              Пространство, в котором стиль встречается с комфортом.
            </p>
            <div className="space-y-2 text-sm text-background/50">
              <div>tunin001@yandex.ru</div>
              <div>+7 927 012-26-12</div>
              <div><div>г. Самара, ул. Чкалова, 72</div></div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-6">
            <div className="text-minimal text-background/50 tracking-widest">НАВИГАЦИЯ</div>
            <nav className="space-y-3">
              {[
                { href: "/work", label: "ПРОЕКТЫ" },
                { href: "/services", label: "УСЛУГИ" },
                { href: "/about", label: "О НАС" },
                { href: "/blog", label: "БЛОГ" },
                { href: "/contact", label: "КОНТАКТЫ" },
              ].map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block text-minimal text-background/50 hover:text-background transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Auth */}
          <div className="space-y-6">
            {user ? (
              <>
                <div className="text-minimal text-background/50 tracking-widest">АККАУНТ</div>
                <div className="space-y-4">
                  <p className="text-sm text-background/60">{user.email}</p>
                  {isAdmin && (
                    <Link
                      to="/crm"
                      className="block text-minimal text-background/70 hover:text-background transition-colors duration-300"
                    >
                      → ПЕРЕЙТИ В CRM
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-minimal text-background/40 hover:text-background/70 transition-colors duration-300"
                  >
                    ВЫЙТИ
                  </button>
                </div>
              </>
            ) : mode === "idle" ? (
              <>
                <div className="text-minimal text-background/50 tracking-widest">ДОСТУП</div>
                <div className="space-y-3">
                  <p className="text-sm text-background/50">
                    Войдите для доступа к панели управления.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setMode("login")}
                      className="text-minimal text-background/60 hover:text-background border border-background/20 hover:border-background/50 px-4 py-2 transition-all duration-300"
                    >
                      ВОЙТИ
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-minimal text-background/50 tracking-widest">ВХОД</div>
                  <button
                    onClick={resetForm}
                    className="text-background/30 hover:text-background/60 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleLogin} className="space-y-3">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="bg-transparent border-background/20 text-background placeholder:text-background/30 focus-visible:ring-background/30 h-9 text-sm"
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    required
                    className="bg-transparent border-background/20 text-background placeholder:text-background/30 focus-visible:ring-background/30 h-9 text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 text-minimal tracking-widest bg-background text-foreground hover:bg-background/90"
                  >
                    {loading ? "..." : "ВОЙТИ"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/10 space-y-4">
          <div className="text-xs text-background/30 leading-relaxed">
            ИП Тюнин Игорь Игоревич · ИНН 631106914354 · ОГРНИП 315631300096159
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-background/30">
              © {new Date().getFullYear()} Tiunin Design. Все права защищены.
            </div>
            <Link to="/privacy" className="text-xs text-background/30 hover:text-background/60 transition-colors">
              Политика конфиденциальности
            </Link>
            <div className="text-xs text-background/30 text-minimal">
              ХАРАКТЕР · ГАРМОНИЯ · ФУНКЦИЯ
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
