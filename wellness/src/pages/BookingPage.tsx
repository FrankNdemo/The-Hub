import { Link } from "react-router-dom";

import BookingSection from "@/components/BookingSection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { softPageBackgroundStyle } from "@/lib/pageBackground";

const BookingPage = () => (
  <div className="min-h-screen" style={softPageBackgroundStyle}>
    <div className="pt-8">
      <BookingSection />

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl rounded-[2.25rem] border border-border/60 bg-card px-6 py-8 shadow-card sm:px-8">
            <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Need a different path first?</p>
            <h2 className="mt-4 text-center font-heading text-4xl font-semibold text-foreground">
              You can also reach out before booking.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-muted-foreground leading-8">
              If you are unsure which service fits best, send a message and we can help you decide before you choose a
              session date.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="hero" className="w-full rounded-full sm:w-auto" asChild>
                <Link to="/contact">Contact the Practice</Link>
              </Button>
              <Button variant="heroBorder" className="w-full rounded-full sm:w-auto" asChild>
                <Link to="/team">View Therapist Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
    <Footer />
  </div>
);

export default BookingPage;
