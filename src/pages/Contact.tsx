import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LeadFormContact from "@/components/LeadFormContact";
import { usePageSEO } from "@/hooks/usePageSEO";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

const Contact = () => {
  usePageSEO({
    title: "Контакты — Студия дизайна интерьера Tiunin Design, Москва",
    description: "Свяжитесь со студией дизайна интерьера Tiunin Design в Москве. Бесплатная консультация, расчёт стоимости от 8 500 ₽ за м².",
    canonical: "https://tiunin.ru/contact",
  });

  return (
    <div className="min-h-screen">
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://tiunin.ru/" },
        { name: "Контакты", url: "https://tiunin.ru/contact" },
      ]} />
      <Navigation />
      <section className="pt-32 pb-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-20">
              <div>
                <h1 className="text-minimal text-muted-foreground mb-4">СВЯЖИТЕСЬ С НАМИ</h1>
                <h2 className="text-4xl md:text-6xl font-light text-architectural mb-12">
                  Давайте создадим
                  <br />
                  нечто выдающееся
                </h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-minimal text-muted-foreground mb-2">ПОЧТА</h3>
                    <a href="mailto:tunin001@yandex.ru" className="text-xl hover:text-muted-foreground transition-colors duration-300">
                      tunin001@yandex.ru
                    </a>
                  </div>
                  
                  <div>
                    <h3 className="text-minimal text-muted-foreground mb-2">ТЕЛЕФОН</h3>
                    <a href="tel:+79270122612" className="text-xl hover:text-muted-foreground transition-colors duration-300">
                      +7 927 012-26-12
                    </a>
                  </div>
                </div>
              </div>
              
              <LeadFormContact />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Contact;
