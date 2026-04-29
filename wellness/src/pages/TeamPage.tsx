import { Link } from "react-router-dom";
import { Award, BookOpen, GraduationCap, Heart } from "lucide-react";

import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { pageHeaderBackgrounds, softPageBackgroundStyle } from "@/lib/pageBackground";

const TeamPage = () => {
  const { therapist, therapists } = useWellnessHub();
  const teamMembers = therapists.length ? therapists : [therapist];

  return (
    <div className="min-h-screen" style={softPageBackgroundStyle}>
      <PageHeader
        title="Our Team"
        contentClassName="pt-6 sm:pt-8 lg:pt-10"
        descriptionClassName="mt-6 sm:mt-8"
        description="Your feelings are valid. Your story matters."
        detailLabel="Professional profile"
        detailItems={[
          `Care from ${teamMembers.map((member) => member.name).join(" and ")}.`,
          "Warm, structured care for emotional safety and growth.",
          "Experience across individuals, adolescents, families, and workplaces.",
        ]}
        backgroundImage={pageHeaderBackgrounds.team.src}
        backgroundPosition={pageHeaderBackgrounds.team.position}
        backgroundImageClassName={pageHeaderBackgrounds.team.className}
      />

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl space-y-10">
            {teamMembers.map((member) => (
              <article id={member.id} key={member.id} className="scroll-mt-28 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                <div className="overflow-hidden rounded-none border border-border/60 bg-card shadow-card lg:sticky lg:top-28 lg:self-start">
                  <div className="h-[360px] overflow-hidden bg-secondary/35">
                    <img src={member.image} alt={member.name} className="h-full w-full object-contain object-center" />
                  </div>
                  <div className="wellness-panel p-6 text-center lg:text-left">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Specialties</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {member.specialties.map((specialty) => (
                        <span key={specialty} className="flex min-h-12 items-center border-l-2 border-primary/35 bg-primary/6 px-3 py-2 text-sm font-medium leading-5 text-primary">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-none border border-border/60 bg-card p-6 text-center shadow-card sm:p-8 lg:text-left">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Professional profile</p>
                  <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground">{member.name}</h2>
                  <p className="mt-2 text-lg text-primary">{member.title}</p>

                  <p className="mt-6 text-muted-foreground leading-8">{member.bio}</p>
                  <p className="mt-4 text-muted-foreground leading-8">
                    Sessions are structured, compassionate, and practical, with care shaped around the person in front
                    of the therapist.
                  </p>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {[
                      { icon: GraduationCap, label: "Qualifications", value: member.qualifications },
                      { icon: BookOpen, label: "Approach", value: member.approach },
                      { icon: Award, label: "Experience", value: member.experience },
                      { icon: Heart, label: "Focus Areas", value: member.focusAreas },
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
                      {member.specialties.slice(0, 4).map((item) => (
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
                      <Link to={`/booking?therapist=${member.id}`}>
                        <span className="sm:hidden">Book Session</span>
                        <span className="hidden sm:inline">Book a Session with {member.name.split(" ")[0]}</span>
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
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TeamPage;
