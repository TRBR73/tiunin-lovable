import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-32 pb-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-8xl md:text-9xl font-light text-architectural mb-8">404</h1>
          <p className="text-xl text-muted-foreground mb-12">Страница не найдена</p>
          <Link
            to="/"
            className="inline-block text-minimal tracking-widest py-4 px-10 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
          >
            НА ГЛАВНУЮ
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default NotFound;
