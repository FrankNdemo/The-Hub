import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const TeamSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const { therapist } = useWellnessHub();

  return (
    <section id="team" className="bg-secondary/30 py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center font-heading text-4xl font-semibold text-foreground md:text-5xl">
          Meet Our Team
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          Compassionate professionals dedicated to your mental health journey.
        </p>

        <div
          ref={ref}
          className={`mt-12 flex justify-center transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-300 hover:shadow-hover">
            <div className="h-80 overflow-hidden">
              <img
                src={therapist.image}
                alt={therapist.name}
                loading="lazy"
                className="h-full w-full object-cover object-top"
              />
            </div>

            <div className="p-6">
              <h3 className="text-center font-heading text-2xl font-semibold text-foreground">{therapist.name}</h3>
              <p className="mt-1 text-center font-medium text-primary">{therapist.title}</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="mb-1 font-heading text-xs font-semibold uppercase tracking-wider text-foreground">
                    Qualifications
                  </p>
                  <p className="text-muted-foreground">{therapist.qualifications}</p>
                </div>
                <div>
                  <p className="mb-1 font-heading text-xs font-semibold uppercase tracking-wider text-foreground">
                    Approach
                  </p>
                  <p className="text-muted-foreground">{therapist.approach}</p>
                </div>
                <div>
                  <p className="mb-1 font-heading text-xs font-semibold uppercase tracking-wider text-foreground">
                    Experience
                  </p>
                  <p className="text-muted-foreground">{therapist.experience}</p>
                </div>
                <div>
                  <p className="mb-1 font-heading text-xs font-semibold uppercase tracking-wider text-foreground">
                    Focus Areas
                  </p>
                  <p className="text-muted-foreground">{therapist.focusAreas}</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-wider text-foreground">
                  Specialties
                </p>
                <div className="flex flex-wrap gap-2">
                  {therapist.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button variant="hero" asChild>
                  <Link to="/booking">Book a Session with {therapist.name.split(" ")[0]}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
