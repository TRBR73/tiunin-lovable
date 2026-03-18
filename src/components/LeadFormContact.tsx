import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LeadFormContact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
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
      message: message.trim() || null,
      source: "contact_form",
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
      <div className="border border-border bg-muted/30 p-8 text-center">
        <div className="w-12 h-12 border border-foreground/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-foreground font-light text-lg">Заявка принята</p>
        <p className="text-muted-foreground text-sm mt-2">Мы свяжемся с вами в ближайшее время</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-muted/30 p-8 space-y-4">
      <h3 className="text-foreground text-minimal tracking-widest mb-6">ОСТАВИТЬ ЗАЯВКУ</h3>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ваше имя"
        required
        maxLength={100}
        className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-3 text-sm focus:outline-none focus:border-foreground/70 transition-colors"
      />

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        maxLength={255}
        className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-3 text-sm focus:outline-none focus:border-foreground/70 transition-colors"
      />

      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Телефон (необязательно)"
        maxLength={20}
        className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-3 text-sm focus:outline-none focus:border-foreground/70 transition-colors"
      />

      <select
        value={service}
        onChange={(e) => setService(e.target.value)}
        className="w-full bg-transparent border-b border-border text-foreground py-3 text-sm focus:outline-none focus:border-foreground/70 transition-colors appearance-none cursor-pointer"
        style={{ color: service ? undefined : "hsl(var(--muted-foreground))" }}
      >
        <option value="">Выберите услугу</option>
        <option value="private_residence">Частные резиденции</option>
        <option value="premium_interior">Интерьеры</option>
        <option value="commercial">Коммерческие пространства</option>
        <option value="turnkey_renovation">Комплексное управление реализацией</option>
        <option value="procurement">Комплектация</option>
        <option value="supervision">Авторский надзор</option>
      </select>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Сообщение (необязательно)"
        maxLength={1000}
        rows={3}
        className="w-full bg-transparent border-b border-border text-foreground placeholder-muted-foreground py-3 text-sm focus:outline-none focus:border-foreground/70 transition-colors resize-none"
      />

      <label className="flex items-start gap-3 mt-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-1 accent-foreground"
        />
        <span className="text-xs text-muted-foreground leading-relaxed">
          Нажимая кнопку «Отправить», я даю{" "}
          <Link to="/privacy" className="text-foreground underline hover:text-foreground/80 transition-colors">
            согласие на обработку персональных данных
          </Link>{" "}
          в соответствии с ФЗ-152.
        </span>
      </label>

      <button
        type="submit"
        disabled={loading || !consent}
        className="w-full mt-4 py-4 border border-foreground/60 text-foreground text-minimal tracking-widest hover:bg-foreground hover:text-background transition-all duration-300 disabled:opacity-50"
      >
        {loading ? "ОТПРАВКА..." : "ОТПРАВИТЬ"}
      </button>
    </form>
  );
};

export default LeadFormContact;
