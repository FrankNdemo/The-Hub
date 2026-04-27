import { Link } from "react-router-dom";
import { Award, BookOpen, GraduationCap, Heart } from "lucide-react";

import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { pageHeaderBackgrounds, softPageBackgroundStyle } from "@/lib/pageBackground";

const TeamPage = () => {
  const { therapist } = useWellnessHub();

  return (
    <div className="min-h-screen" style={softPageBackgroundStyle}>
    <PageHeader
      title="Our Team"
      contentClassName="pt-6 sm:pt-8 lg:pt-10"
      descriptionClassName="mt-6 sm:mt-8"
      description="“Your feelings are valid. Your story matters.”"
      detailLabel="Professional profile"
      detailItems={[
        `Led by ${therapist.name}, ${therapist.title}.`,
        "Warm, structured care for emotional safety and growth.",
        "Experience across individuals, adolescents, families, and workplaces.",
      ]}
      backgroundImage={pageHeaderBackgrounds.team.src}
      backgroundPosition={pageHeaderBackgrounds.team.position}
      backgroundImageClassName={pageHeaderBackgrounds.team.className}
    />

    <section className="pb-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-[2.25rem] border border-border/60 bg-card shadow-card">
              <div className="h-[420px] overflow-hidden">
                <img src={therapist.image} alt={therapist.name} className="h-full w-full object-cover object-[center_18%]" />
              </div>
              <div className="wellness-panel p-6 text-center lg:text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Specialties</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {therapist.specialties.map((specialty) => (
                    <span key={specialty} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-border/60 bg-card p-6 text-center shadow-card sm:p-8 lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Professional profile</p>
            <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground">{therapist.name}</h2>
            <p className="mt-2 text-lg text-primary">{therapist.title}</p>

            <p className="mt-6 text-muted-foreground leading-8">{therapist.bio}</p>
            <p className="mt-4 text-muted-foreground leading-8">
              {therapist.name.split(" ")[0]} supports individuals, adolescents, families, and workplaces navigating
              stress, grief, emotional overwhelm, identity exploration, trauma recovery, and long-term wellbeing.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                { icon: GraduationCap, label: "Qualifications", value: therapist.qualifications },
                { icon: BookOpen, label: "Approach", value: therapist.approach },
                { icon: Award, label: "Experience", value: therapist.experience },
                { icon: Heart, label: "Focus Areas", value: therapist.focusAreas },
              ].map((item) => (
                <div key={item.label} className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center shadow-soft lg:text-left">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary lg:mx-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-primary/65">{item.label}</p>
                  <p className="mt-2 text-sm leading-7 text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] bg-secondary/45 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Works best for</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  "Anxiety support and emotional regulation",
                  "Grief, loss, and life transitions",
                  "Family communication and adolescent care",
                  "Neurodivergent support and strengths-based guidance",
                ].map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-background/90 p-4 text-center text-sm leading-7 text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-2.5 sm:flex sm:flex-row sm:justify-center lg:justify-start">
              <Button
                variant="hero"
                className="h-10 min-w-0 rounded-full px-3 text-[0.78rem] tracking-normal sm:h-10 sm:w-auto sm:px-6 sm:text-sm"
                asChild
              >
                <Link to="/booking">
                  <span className="sm:hidden">Book Session</span>
                  <span className="hidden sm:inline">Book a Session with {therapist.name.split(" ")[0]}</span>
                </Link>
              </Button>
              <Button
                variant="heroBorder"
                className="h-10 min-w-0 rounded-full px-3 text-[0.78rem] tracking-normal sm:h-10 sm:w-auto sm:px-6 sm:text-sm"
                asChild
              >
                <Link to="/contact">
                  <span className="sm:hidden">Contact Us</span>
                  <span className="hidden sm:inline">Contact the Practice</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Footer />
    </div>
  );
};

export default TeamPage;
