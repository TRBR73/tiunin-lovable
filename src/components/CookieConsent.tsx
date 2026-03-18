import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "tiunin_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-foreground text-background p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-2xl">
          <p className="text-sm text-background/70 flex-1 leading-relaxed">
            Мы используем файлы cookie для корректной работы сайта и улучшения качества обслуживания. 
            Продолжая использовать сайт, вы соглашаетесь с{" "}
            <Link to="/privacy" className="text-background underline hover:text-background/90 transition-colors">
              Политикой конфиденциальности
            </Link>.
          </p>
          <button
            onClick={accept}
            className="shrink-0 px-6 py-2.5 bg-background text-foreground text-minimal tracking-widest text-xs hover:bg-background/90 transition-colors"
          >
            ПРИНЯТЬ
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
