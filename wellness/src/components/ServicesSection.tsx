import { Button } from "@/components/ui/button";
import { Heart, Users, Brain, Briefcase, Shield, Sparkles } from "lucide-react";
import {
  familyServiceImage,
  individualServiceImage,
  specializedServiceImage,
} from "@/lib/serviceImages";

const featuredServices = [
  { img: individualServiceImage, title: "Individual Support", desc: "Personalized therapy for adults facing challenges with stress, anxiety, depression, and finding healing from trauma." },
  { img: familyServiceImage, title: "Family & Adolescent Support", desc: "Support for families, children, and teens addressing emotional, behavioral, and developmental challenges." },
  { img: specializedServiceImage, title: "Specialized Care", desc: "Expert care for trauma, bariatric psychology, neurodivergence (ADHD, Autism, Dyslexia, Dyspraxia), oncopsychology, grief, LGBTQ+, and existential issues." },
];

const allServices = [
  { icon: Heart, title: "Individual Therapy", desc: "One-on-one CBT-based sessions for anxiety, depression, and personal growth." },
  { icon: Users, title: "Family Therapy", desc: "Strengthen family bonds and communication patterns." },
  { icon: Brain, title: "Trauma & CBT", desc: "Evidence-based approaches to heal from traumatic experiences." },
  { icon: Briefcase, title: "Corporate Wellness", desc: "Training, consultancy, and employee assistance programs." },
  { icon: Shield, title: "Grief & Loss Support", desc: "Compassionate guidance through life's most difficult transitions." },
  { icon: Sparkles, title: "Neurodivergence", desc: "Specialized support for ADHD, Autism, Dyslexia, and Dyspraxia." },
];

const ServicesSection = () => (
  <section id="services" className="py-24">
    <div className="container mx-auto px-4">
      <h2 className="font-heading text-4xl md:text-5xl font-semibold text-foreground">Our Services</h2>
      <p className="font-heading text-xl italic text-primary mt-2">How We Can Help You Thrive</p>
      <p className="text-muted-foreground mt-4 max-w-2xl">
        We provide professional, compassionate therapy and wellness support tailored to your unique needs.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {featuredServices.map((s) => (
          <div key={s.title} className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-shadow duration-300 group">
            <div className="overflow-hidden h-52">
              <img src={s.img} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <h3 className="font-heading text-xl font-semibold text-foreground">{s.title}</h3>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{s.desc}</p>
              <Button variant="hero" size="sm" className="mt-4" asChild>
                <a href="#booking">Meet Our Therapists →</a>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
        {allServices.map((s) => (
          <div key={s.title} className="bg-card/60 rounded-xl p-5 hover:shadow-card transition-shadow duration-300 border border-border/50">
            <s.icon className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-heading text-lg font-medium text-foreground">{s.title}</h4>
            <p className="text-muted-foreground text-sm mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
