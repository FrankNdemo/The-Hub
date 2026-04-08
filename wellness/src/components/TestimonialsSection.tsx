import { Quote } from "lucide-react";

const testimonials = [
  { text: "The Wellness Hub gave me the tools to understand my anxiety and finally feel in control of my life. I'm forever grateful.", name: "Sarah M.", role: "Individual Therapy Client" },
  { text: "Caroline's approach is warm, professional, and truly life-changing. My family is in a much better place thanks to her guidance.", name: "James K.", role: "Family Therapy Client" },
  { text: "As an HR manager, the corporate wellness sessions transformed our workplace culture. Highly recommend!", name: "Aisha N.", role: "Corporate Client" },
];

const TestimonialsSection = () => (
  <section className="py-24 bg-secondary/30">
    <div className="container mx-auto px-4">
      <h2 className="font-heading text-4xl md:text-5xl font-semibold text-foreground text-center">What Our Clients Say</h2>
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-card rounded-2xl p-8 shadow-card relative">
            <Quote className="w-8 h-8 text-primary/20 absolute top-6 right-6" />
            <p className="text-muted-foreground leading-relaxed italic">"{t.text}"</p>
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="font-medium text-foreground">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
