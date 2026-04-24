import BookingSection from "@/components/BookingSection";
import Footer from "@/components/Footer";
import { softPageBackgroundStyle } from "@/lib/pageBackground";

const BookingPage = () => (
  <div className="min-h-screen" style={softPageBackgroundStyle}>
    <div className="pt-8">
      <BookingSection />
    </div>
    <Footer />
  </div>
);

export default BookingPage;
