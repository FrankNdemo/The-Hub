import { lazy, Suspense, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "@/components/Navbar";
import MobileContactBar from "@/components/MobileContactBar";
import DesktopWhatsAppFloat from "@/components/DesktopWhatsAppFloat";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavigationImagePreloader from "@/components/NavigationImagePreloader";
import {
  createBookingDraft,
  createExplorationCallDraft,
  emptyContactDraft,
  FormDraftProvider,
  useFormDrafts,
} from "@/context/FormDraftContext";
import { NavigationPreviewProvider, useNavigationPreview } from "@/context/NavigationPreviewContext";
import { WellnessHubProvider, useWellnessHub } from "@/context/WellnessHubContext";
import Index from "./pages/Index";

const AboutPage = lazy(() => import("./pages/AboutPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ExplorationCallPage = lazy(() => import("./pages/ExplorationCallPage"));
const JoinSessionPage = lazy(() => import("./pages/JoinSessionPage"));
const ManageBookingPage = lazy(() => import("./pages/ManageBookingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const StoryPage = lazy(() => import("./pages/StoryPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const TherapistDashboardPage = lazy(() => import("./pages/TherapistDashboardPage"));
const TherapistSessionPage = lazy(() => import("./pages/TherapistSessionPage"));

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
    <Suspense fallback={<div className="min-h-screen bg-background" aria-hidden="true" />}>
    <Routes location={routeLocation}>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/story" element={<StoryPage />} />
      <Route path="/exploration-call" element={<ExplorationCallPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/join/:token" element={<JoinSessionPage />} />
      <Route path="/manage/:token" element={<ManageBookingPage />} />
      <Route path="/therapist/portal" element={<TherapistDashboardPage />} />
      <Route path="/therapist/session/:token" element={<TherapistSessionPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
};

const NavigationDraftResetter = () => {
  const location = useLocation();
  const { setBookingDraft, setContactDraft, setExplorationCallDraft } = useFormDrafts();
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;

    if (previousPath === location.pathname) {
      return;
    }

    if (previousPath === "/contact") {
      setContactDraft(emptyContactDraft);
    }

    if (previousPath === "/booking") {
      setBookingDraft(createBookingDraft());
    }

    if (previousPath === "/exploration-call") {
      setExplorationCallDraft(createExplorationCallDraft());
    }

    previousPathRef.current = location.pathname;
  }, [location.pathname, setBookingDraft, setContactDraft, setExplorationCallDraft]);

  return null;
};

const TherapistPortalSessionGuard = () => {
  const location = useLocation();
  const { isTherapistAuthenticated, logoutTherapist } = useWellnessHub();
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const wasInPortal = previousPath === "/therapist/portal";
    const isInPortal = location.pathname === "/therapist/portal";

    previousPathRef.current = location.pathname;

    if (wasInPortal && !isInPortal && isTherapistAuthenticated) {
      void logoutTherapist();
    }
  }, [isTherapistAuthenticated, location.pathname, logoutTherapist]);

  return null;
};

const AppRouter = () => (
  <BrowserRouter>
    <WellnessHubProvider>
      <NavigationPreviewProvider>
        <FormDraftProvider>
          <ScrollAndPreviewManager />
          <NavigationDraftResetter />
          <TherapistPortalSessionGuard />
          <NavigationImagePreloader />
          <Navbar />
          <PreviewRoutes />
          <DesktopWhatsAppFloat />
          <MobileContactBar />
        </FormDraftProvider>
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
