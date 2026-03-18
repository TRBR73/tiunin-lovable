import igorPhoto from "@/assets/igor-tiunin.jpg";
import unionLogo from "@/assets/union-architects-russia.png";

const About = () => {
  return (
    <section id="about" className="py-32 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-minimal text-muted-foreground mb-4">О СТУДИИ</h2>
              <h3 className="text-4xl md:text-6xl font-light text-architectural mb-12">
                Дизайн — это не декор
              </h3>
              
              <div className="space-y-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Дизайн-студия Игоря Тюнина — это команда с 20-летним опытом 
                  проектирования интерьеров в Москве. Мы работаем с квартирами, 
                  частными резиденциями и коммерческими пространствами — 
                  от концепции до авторского надзора.
                </p>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Стоимость дизайн-проекта — от 8 500 ₽ за м². 
                  Каждый проект включает 3D-визуализацию, комплектацию 
                  и сопровождение на всех этапах реализации.
                </p>
              </div>

              <div className="pt-8 border-t border-border mt-12">
                <div className="grid grid-cols-3 gap-8 items-center">
                  <div>
                    <h4 className="text-minimal text-muted-foreground mb-2">ОПЫТ</h4>
                    <p className="text-xl">20+ лет</p>
                  </div>
                  <div>
                    <h4 className="text-minimal text-muted-foreground mb-2">ОСНОВАТЕЛЬ</h4>
                    <p className="text-xl">Игорь Тюнин</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <img 
                      src={unionLogo} 
                      alt="Член Союза Архитекторов России" 
                      className="w-20 h-auto opacity-60"
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">Член Союза Архитекторов России</p>
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
  );
};

export default About;
