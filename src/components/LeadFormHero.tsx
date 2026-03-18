import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LeadFormHero = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      service: service || null,
      source: "hero_form",
      status: "new",
    });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось отправить заявку. Попробуйте ещё раз.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Заявка отправлена!", description: "Мы свяжемся с вами в ближайшее время." });
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 text-center">
        <div className="w-12 h-12 border border-white/60 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-light text-lg">Заявка принята</p>
        <p className="text-white/60 text-sm mt-2">Мы свяжемся с вами в ближайшее время</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 space-y-4">
      <h3 className="text-white text-minimal tracking-widest mb-6">ОСТАВИТЬ ЗАЯВКУ</h3>

      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
          required
          maxLength={100}
          className="w-full bg-transparent border-b border-white/30 text-white placeholder-white/40 py-3 text-sm focus:outline-none focus:border-white/70 transition-colors"
        />
      </div>

      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          maxLength={255}
          className="w-full bg-transparent border-b border-white/30 text-white placeholder-white/40 py-3 text-sm focus:outline-none focus:border-white/70 transition-colors"
        />
      </div>

      <div>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон (необязательно)"
          maxLength={20}
          className="w-full bg-transparent border-b border-white/30 text-white placeholder-white/40 py-3 text-sm focus:outline-none focus:border-white/70 transition-colors"
        />
      </div>

      <div>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full bg-transparent border-b border-white/30 text-white py-3 text-sm focus:outline-none focus:border-white/70 transition-colors appearance-none cursor-pointer"
          style={{ color: service ? "white" : "rgba(255,255,255,0.4)" }}
        >
          <option value="" style={{ color: "#333", background: "#fff" }}>Выберите услугу</option>
          <option value="private_residence" style={{ color: "#333", background: "#fff" }}>Частные резиденции</option>
          <option value="premium_interior" style={{ color: "#333", background: "#fff" }}>Интерьеры</option>
          <option value="commercial" style={{ color: "#333", background: "#fff" }}>Коммерческие пространства</option>
          <option value="turnkey_renovation" style={{ color: "#333", background: "#fff" }}>Комплексное управление реализацией</option>
          <option value="procurement" style={{ color: "#333", background: "#fff" }}>Комплектация</option>
          <option value="supervision" style={{ color: "#333", background: "#fff" }}>Авторский надзор</option>
        </select>
      </div>

      <label className="flex items-start gap-3 mt-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-1 accent-white"
        />
        <span className="text-xs text-white/50 leading-relaxed">
          Нажимая кнопку «Отправить», я даю{" "}
          <Link to="/privacy" className="text-white/70 underline hover:text-white transition-colors">
            согласие на обработку персональных данных
          </Link>{" "}
          в соответствии с ФЗ-152.
        </span>
      </label>

      <button
        type="submit"
        disabled={loading || !consent}
        className="w-full mt-4 py-4 border border-white/60 text-white text-minimal tracking-widest hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
      >
        {loading ? "ОТПРАВКА..." : "ОТПРАВИТЬ"}
      </button>
    </form>
  );
};

export default LeadFormHero;
