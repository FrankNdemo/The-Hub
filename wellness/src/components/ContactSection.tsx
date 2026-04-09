import { MapPin, Mail, Phone, Clock } from "lucide-react";

const ContactSection = () => (
  <section id="contact" className="py-24">
    <div className="container mx-auto px-4">
      <h2 className="font-heading text-4xl md:text-5xl font-semibold text-foreground text-center">Get In Touch</h2>
      <p className="text-center text-muted-foreground mt-3">We'd love to hear from you.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
        {[
          { icon: MapPin, title: "Location", lines: ["Nairobi, Westlands", "1st Floor Realite building", "Crescent Lane off Parklands Road"] },
          { icon: Phone, title: "Phone", lines: ["+254 726 759 850"] },
          { icon: Mail, title: "Email", lines: ["likentnerg@gmail.com"] },
          { icon: Clock, title: "Hours", lines: ["Tue – Sat", "10:00 AM – 7:00 PM"] },
        ].map((c) => (
          <div key={c.title} className="bg-card rounded-xl p-6 shadow-card text-center">
            <c.icon className="w-8 h-8 text-primary mx-auto mb-3" />
            <h4 className="font-heading text-lg font-medium text-foreground">{c.title}</h4>
            {c.lines.map((l) => (
              <p key={l} className="text-sm text-muted-foreground mt-1">{l}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ContactSection;
