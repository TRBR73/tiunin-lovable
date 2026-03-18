import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import { usePageSEO } from "@/hooks/usePageSEO";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

// Lazy load below-the-fold sections
const Services = lazy(() => import("@/components/Services"));
const About = lazy(() => import("@/components/About"));
const Portfolio = lazy(() => import("@/components/Portfolio"));
const Contact = lazy(() => import("@/components/Contact"));
const Footer = lazy(() => import("@/components/Footer"));

const SectionFallback = () => (
  <div className="py-32 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  usePageSEO({
    title: "Дизайн интерьера в Москве от 8 500 ₽/м² — Tiunin Design",
    description: "Студия дизайна интерьера в Москве. Проектирование квартир, домов, коммерческих помещений от 8 500 ₽ за м². 3D-визуализация, авторский надзор, комплексное управление реализацией. 20+ лет опыта.",
    canonical: "https://tiunin.ru/",
  });

  return (
    <div className="min-h-screen">
      <BreadcrumbJsonLd items={[{ name: "Главная", url: "https://tiunin.ru/" }]} />
      <Navigation />
      <Hero />
      <Suspense fallback={<SectionFallback />}>
        <Services />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <About />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Portfolio />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Contact />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
