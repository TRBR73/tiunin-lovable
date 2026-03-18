import LeadFormContact from "@/components/LeadFormContact";

const Contact = () => {
  return (
    <section id="contact" className="py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20">
            <div>
              <h2 className="text-minimal text-muted-foreground mb-4">СВЯЖИТЕСЬ С НАМИ</h2>
              <h3 className="text-4xl md:text-6xl font-light text-architectural mb-12">
                Давайте создадим
                <br />
                нечто выдающееся
              </h3>

              <div className="space-y-8">
                <div>
                  <h4 className="text-minimal text-muted-foreground mb-2">ПОЧТА</h4>
                  <a href="mailto:tunin001@yandex.ru" className="text-xl hover:text-muted-foreground transition-colors duration-300">
                    tunin001@yandex.ru
                  </a>
                </div>

                <div>
                  <h4 className="text-minimal text-muted-foreground mb-2">ТЕЛЕФОН</h4>
                  <a href="tel:+79270122612" className="text-xl hover:text-muted-foreground transition-colors duration-300">
                    +7 927 012-26-12
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <LeadFormContact />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
