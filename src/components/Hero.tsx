import { useEffect, useRef } from "react";
import heroImage from "@/assets/hero-architecture.jpg";

const Hero = () => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Preload hero image for fastest paint
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = heroImage;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <img
        ref={imgRef}
        src={heroImage}
        alt="Дизайн интерьера"
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 hero-overlay" />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-4xl">
          <p className="text-sm md:text-base tracking-[0.3em] uppercase text-white/60 font-light mb-6 reveal">
            Архитектурная студия Игоря Тюнина
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-light text-white text-architectural mb-8 reveal">
            ХАРАКТЕР
            <br />
            ГАРМОНИЯ
            <br />
            ФУНКЦИЯ
          </h1>
          <p className="text-base md:text-lg text-white/50 font-light tracking-wide max-w-xl reveal-delayed mb-12">
            Квартиры, дома, коммерческие пространства — от концепции до реализации
          </p>
          <a
            href="#contact"
            className="inline-block reveal-delayed text-minimal tracking-widest py-4 px-10 border border-white/60 text-white hover:bg-white hover:text-black transition-all duration-300"
          >
            РАССЧИТАТЬ СТОИМОСТЬ
          </a>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 reveal-delayed">
        <div className="w-px h-16 bg-white/40" />
      </div>
    </section>
  );
};

export default Hero;
