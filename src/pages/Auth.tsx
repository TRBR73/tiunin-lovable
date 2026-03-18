import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        });
        if (data === true) navigate("/crm");
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Ошибка входа", description: error.message, variant: "destructive" });
    } else {
      navigate("/crm");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-12">
          <div className="text-minimal text-foreground mb-8">TIUNIN DESIGN</div>
          <h1 className="text-4xl font-light text-architectural mb-2">Вход в CRM</h1>
          <p className="text-muted-foreground">Панель управления лидами</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-minimal text-muted-foreground block mb-2">EMAIL</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tiunindesign.com"
              required
              className="bg-background border-border"
            />
          </div>

          <div>
            <label className="text-minimal text-muted-foreground block mb-2">ПАРОЛЬ</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-background border-border"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-minimal tracking-widest"
          >
            {loading ? "ВХОД..." : "ВОЙТИ"}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-border">
          <a href="/" className="text-minimal text-muted-foreground hover:text-foreground transition-colors">
            ← ВЕРНУТЬСЯ НА САЙТ
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
