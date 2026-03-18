import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import igorPhoto from "@/assets/igor-tiunin.jpg";
import unionLogo from "@/assets/union-architects-russia.png";
import { usePageSEO } from "@/hooks/usePageSEO";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

const About = () => {
  usePageSEO({
    title: "О студии Tiunin Design — дизайн интерьера в Москве, 20+ лет опыта",
    description: "Студия дизайна интерьера Игоря Тюнина в Москве. 20+ лет опыта проектирования квартир, домов и коммерческих помещений. От концепции до реализации.",
    canonical: "https://tiunin.ru/about",
  });

  return (
    <div className="min-h-screen">
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://tiunin.ru/" },
        { name: "О студии", url: "https://tiunin.ru/about" },
      ]} />
      <Navigation />
      <section className="pt-32 pb-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-20 items-start">
              <div>
                <h1 className="text-minimal text-muted-foreground mb-4">О СТУДИИ</h1>
                <h2 className="text-4xl md:text-6xl font-light text-architectural mb-12">
                  Дизайн — это не декор
                </h2>
                
                <div className="space-y-8">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Дизайн-студия Игоря Тюнина — это команда с 20-летним опытом 
                    проектирования и реализации частных и коммерческих объектов. 
                    Мы верим, что дизайн — это не декор, а архитектура пространства 
                    и образ жизни.
                  </p>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Каждый проект начинается с глубокого понимания клиента, его 
                    привычек и ценностей. Мы создаём пространства, в которых 
                    стиль встречается с комфортом, а форма находит смысл.
                  </p>
                </div>

              <div className="pt-8 border-t border-border mt-12">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-start">
                    <div>
                      <h3 className="text-minimal text-muted-foreground mb-2">ОПЫТ</h3>
                      <p className="text-xl">20+ лет</p>
                    </div>
                    <div>
                      <h3 className="text-minimal text-muted-foreground mb-2">ОСНОВАТЕЛЬ</h3>
                      <p className="text-xl">Игорь Тюнин</p>
                    </div>
                    <div>
                      <h3 className="text-minimal text-muted-foreground mb-2">ПРОЕКТЫ</h3>
                      <p className="text-xl">150+</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <img 
                        src={unionLogo} 
                        alt="Член Союза Архитекторов России" 
                        className="w-20 h-auto opacity-60"
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-center">Член Союза Архитекторов</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="relative overflow-hidden rounded-lg">
                  <img 
                    src={igorPhoto} 
                    alt="Игорь Тюнин — основатель студии дизайна интерьера" 
                    className="w-full object-cover aspect-[3/4]"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4">Игорь Тюнин — основатель студии</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default About;
