import aboutImg from "@/assets/about-therapy.jpg";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { Button } from "@/components/ui/button";

const values = [
  { title: "Authenticity", desc: "We create a space where you can be your true self." },
  { title: "Integrity", desc: "Ethical, transparent, and compassionate care always." },
  { title: "Purpose", desc: "Guiding you toward a meaningful and fulfilling life." },
];

const AboutSection = () => {
  const { therapist } = useWellnessHub();

  return (
    <section id="about" className="bg-secondary/30 py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-4xl font-semibold text-foreground md:text-5xl">About Wellness Hub</h2>
            <p className="mt-2 font-heading text-xl italic text-primary">Empowering Your Mind and Heart</p>
            <div className="mb-6 mt-4 h-0.5 w-16 bg-primary/40" />
            <p className="mb-4 leading-relaxed text-muted-foreground">
              At Wellness Hub, our mission is to improve mental health in Africa by offering compassionate therapy and
              professional guidance. We envision a world where everyone discovers their best self and lives a
              purposeful life that feels good on the inside.
            </p>
            <div className="my-6 grid gap-3">
              {values.map((value) => (
                <div key={value.title} className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <span className="font-medium text-foreground">{value.title}</span>
                    <span className="text-muted-foreground"> - {value.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="hero" asChild>
              <a href="#team">Meet Our Therapists</a>
            </Button>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl shadow-soft">
              <img
                src={aboutImg}
                alt="Peaceful therapy office"
                loading="lazy"
                width={800}
                height={600}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-4 h-24 w-24 overflow-hidden rounded-xl border-4 border-background shadow-hover">
              <img src={therapist.image} alt={therapist.name} loading="lazy" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
