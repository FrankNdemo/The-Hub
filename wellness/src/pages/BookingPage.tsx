import bookingSessionMobileHero from "@/assets/booking-session-mobile-hero.jpg";
import BookingSection from "@/components/BookingSection";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { softPageBackgroundStyle } from "@/lib/pageBackground";

const BookingPage = () => (
  <div className="min-h-screen" style={softPageBackgroundStyle}>
    <div className="relative lg:hidden">
      <PageHeader
        title="Schedule your appointment"
        description="Tuesday to Saturday, 10:00 AM to 7:00 PM"
        detailLabel=""
        detailItems={[]}
        backgroundImage={bookingSessionMobileHero}
        backgroundPosition="center 56%"
        contentClassName="pt-24"
        descriptionClassName="font-light tracking-[0.08em] text-white/95"
      />
    </div>
    <div className="lg:pt-8">
      <BookingSection />
    </div>
    <Footer />
  </div>
);

export default BookingPage;
