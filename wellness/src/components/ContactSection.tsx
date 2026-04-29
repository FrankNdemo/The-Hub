import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";

import { primaryTherapist } from "@/data/siteData";

const ContactSection = () => (
  <section id="contact" className="py-24">
    <div className="container mx-auto px-4">
      <h2 className="font-heading text-4xl font-semibold text-foreground text-center md:text-5xl">Get In Touch</h2>
      <p className="text-center text-muted-foreground mt-3">We&apos;d love to hear from you.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
        {[
          { icon: MapPin, title: "Location", lines: primaryTherapist.location },
          { icon: Phone, title: "Phone", lines: [primaryTherapist.phone] },
          { icon: MessageCircle, title: "WhatsApp", lines: [primaryTherapist.phone] },
          { icon: Clock, title: "Hours", lines: ["Tue - Sat", "10:00 AM - 7:00 PM"] },
        ].map((c) => (
          <div key={c.title} className="bg-card rounded-xl p-6 shadow-card text-center">
            <c.icon className="w-8 h-8 text-primary mx-auto mb-3" />
            <h4 className="font-heading text-lg font-medium text-foreground">{c.title}</h4>
            {c.lines.map((line) => (
              <p key={line} className="text-sm text-muted-foreground mt-1">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ContactSection;
