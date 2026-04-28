import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "@/components/Navbar";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavigationPreviewProvider, useNavigationPreview } from "@/context/NavigationPreviewContext";
import { WellnessHubProvider } from "@/context/WellnessHubContext";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import ExplorationCallPage from "./pages/ExplorationCallPage";
import Index from "./pages/Index";
import JoinSessionPage from "./pages/JoinSessionPage";
import ManageBookingPage from "./pages/ManageBookingPage";
import NotFound from "./pages/NotFound";
import ServicesPage from "./pages/ServicesPage";
import TeamPage from "./pages/TeamPage";
import TherapistDashboardPage from "./pages/TherapistDashboardPage";
import TherapistSessionPage from "./pages/TherapistSessionPage";

const queryClient = new QueryClient();

const ScrollAndPreviewManager = () => {
  const location = useLocation();
  const { previewPath } = useNavigationPreview();
  const savedScrollRef = useRef<number | null>(null);
  const previousLocationRef = useRef({ pathname: location.pathname, key: location.key });

  useEffect(() => {
    const previousLocation = previousLocationRef.current;
    const navigated =
      previousLocation.pathname !== location.pathname || previousLocation.key !== location.key;

    if (navigated) {
      savedScrollRef.current = null;
      previousLocationRef.current = { pathname: location.pathname, key: location.key };

      if (!location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    }
  }, [location.hash, location.key, location.pathname]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = decodeURIComponent(location.hash.slice(1));

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "auto", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (previewPath && previewPath !== location.pathname) {
      if (savedScrollRef.current === null) {
        savedScrollRef.current = window.scrollY;
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    if (!previewPath && savedScrollRef.current !== null) {
      window.scrollTo({ top: savedScrollRef.current, left: 0, behavior: "auto" });
      savedScrollRef.current = null;
    }
  }, [location.pathname, previewPath]);

  return null;
};

const PreviewRoutes = () => {
  const location = useLocation();
  const { previewPath } = useNavigationPreview();

  const routeLocation =
    previewPath && previewPath !== location.pathname
      ? {
          ...location,
          pathname: previewPath,
        }
      : location;

  return (
    <Routes location={routeLocation}>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/exploration-call" element={<ExplorationCallPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/join/:token" element={<JoinSessionPage />} />
      <Route path="/manage/:token" element={<ManageBookingPage />} />
      <Route path="/therapist/portal" element={<TherapistDashboardPage />} />
      <Route path="/therapist/session/:token" element={<TherapistSessionPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AppRouter = () => (
  <BrowserRouter>
    <WellnessHubProvider>
      <NavigationPreviewProvider>
        <ScrollAndPreviewManager />
        <Navbar />
        <PreviewRoutes />
      </NavigationPreviewProvider>
    </WellnessHubProvider>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRouter />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
