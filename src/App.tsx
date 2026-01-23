import { useState, useCallback, lazy, Suspense } from "react";
import GameCanvas from "./game/GameCanvas";
import MobileControls from "./components/MobileControls";

// Lazy load modal components to improve initial load performance
const AboutModal = lazy(() => import("./components/AboutModal"));
const ProjectsModal = lazy(() => import("./components/ProjectsModal"));
const SkillsModal = lazy(() => import("./components/SkillsModal"));
const ExperienceModal = lazy(() => import("./components/ExperienceModal"));
const ContactModal = lazy(() => import("./components/ContactModal"));
const CaptureModal = lazy(() => import("./components/CaptureModal"));
import WelcomeOverlay from "./components/WelcomeOverlay";
import LandscapePrompt from "./components/LandscapePrompt";
import SkipButton from "./components/SkipButton";
import StaticPortfolio from "./components/StaticPortfolio";
import MuteButton from "./components/MuteButton";
import ErrorBoundary from "./components/ErrorBoundary";
import { PortfolioProvider, usePortfolio } from "./context/PortfolioContext";
import { useBackgroundMusic } from "./hooks/useBackgroundMusic";

type Section = "about" | "projects" | "skills" | "experience" | "contact" | null;

function LoadingSkeleton() {
  return (
    <div className="w-full h-dvh bg-slate-900 overflow-hidden">
      {/* Header skeleton */}
      <div className="w-full px-6 py-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo placeholder */}
          <div className="animate-pulse bg-slate-800 rounded-lg h-8 w-32" />
          {/* Nav items placeholder */}
          <div className="hidden md:flex items-center gap-6">
            <div className="animate-pulse bg-slate-800 rounded h-4 w-16" />
            <div className="animate-pulse bg-slate-800 rounded h-4 w-20" />
            <div className="animate-pulse bg-slate-800 rounded h-4 w-14" />
            <div className="animate-pulse bg-slate-800 rounded h-4 w-18" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero section */}
        <div className="mb-16">
          <div className="animate-pulse bg-slate-800 rounded-lg h-12 w-3/4 mb-4" />
          <div className="animate-pulse bg-slate-800 rounded-lg h-6 w-1/2 mb-2" />
          <div className="animate-pulse bg-slate-800 rounded-lg h-6 w-2/3" />
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
            >
              {/* Card image placeholder */}
              <div className="animate-pulse bg-slate-700 rounded-lg h-40 w-full mb-4" />
              {/* Card title placeholder */}
              <div className="animate-pulse bg-slate-700 rounded h-5 w-3/4 mb-3" />
              {/* Card description placeholders */}
              <div className="animate-pulse bg-slate-700 rounded h-3 w-full mb-2" />
              <div className="animate-pulse bg-slate-700 rounded h-3 w-5/6 mb-2" />
              <div className="animate-pulse bg-slate-700 rounded h-3 w-4/6" />
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700">
          <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading portfolio...</span>
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="w-full h-dvh bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400 text-lg">Failed to load portfolio data</p>
        <p className="text-slate-400 text-sm mt-2">{message}</p>
      </div>
    </div>
  );
}

type NavigableSection = "about" | "projects" | "skills" | "experience" | "contact";

function AppContent() {
  const { data, isLoading, error } = usePortfolio();
  const [activeSection, setActiveSection] = useState<Section>(null);
  const [capturedJobId, setCapturedJobId] = useState<string | null>(null);
  const [staticView, setStaticView] = useState(false);
  const { isMuted, isPlaying, play: playMusic, toggleMute } = useBackgroundMusic();

  const handleClose = useCallback(() => {
    setActiveSection(null);
  }, []);

  const handleNavigate = useCallback((section: NavigableSection) => {
    setActiveSection(section);
  }, []);

  const handleCapture = useCallback((creatureId: string) => {
    setCapturedJobId(creatureId);
  }, []);

  const handleCaptureClose = useCallback(() => {
    setCapturedJobId(null);
  }, []);

  const handleSectionInteract = useCallback((section: string) => {
    setActiveSection(section as Section);
  }, []);

  const handleSkipToStatic = useCallback(() => {
    if (!isMuted) {
      toggleMute();
    }
    setStaticView(true);
  }, [isMuted, toggleMute]);

  const handleBackToGame = useCallback(() => {
    setStaticView(false);
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !data) {
    return <ErrorScreen message={error || "Data not available"} />;
  }

  // Common props for section modals
  const modalNavProps = {
    showNav: true,
    currentSection: activeSection as NavigableSection,
    onNavigate: handleNavigate,
  };

  return (
    <>
      {/* Static Portfolio - overlays when active */}
      {staticView && <StaticPortfolio onBackToGame={handleBackToGame} />}

      {/* Game View - hidden but mounted when static view is active */}
      <div className={`relative w-full h-dvh overflow-hidden bg-[#0a0a0a] ${staticView ? 'hidden' : ''}`}>
        {/* Landscape rotation prompt for mobile portrait */}
        <LandscapePrompt onSkip={handleSkipToStatic} />

        {/* Desktop skip button */}
        <SkipButton onClick={handleSkipToStatic} />

        {/* Mute button - only show when music has started */}
        {isPlaying && <MuteButton isMuted={isMuted} onToggle={toggleMute} />}

        {/* Game Canvas - Full screen background */}
        <GameCanvas 
          onCapture={handleCapture}
          onSectionInteract={handleSectionInteract}
          buildingsData={data.buildings}
          aboutData={data.about}
          contactData={data.contact}
          experienceData={data.experience}
          projectsData={data.projects}
          skillsData={data.skills}
        />

        {/* Mobile Controls - only visible on small screens and no modal open */}
        {!activeSection && !capturedJobId && <MobileControls onSkip={handleSkipToStatic} />}

        {/* Modal Overlays with section navigation - lazy loaded for performance */}
        <Suspense fallback={null}>
          {activeSection === "about" && <AboutModal onClose={handleClose} {...modalNavProps} />}
          {activeSection === "projects" && <ProjectsModal onClose={handleClose} {...modalNavProps} />}
          {activeSection === "skills" && <SkillsModal onClose={handleClose} {...modalNavProps} />}
          {activeSection === "experience" && <ExperienceModal onClose={handleClose} {...modalNavProps} />}
          {activeSection === "contact" && <ContactModal onClose={handleClose} {...modalNavProps} />}
        </Suspense>

        {/* Capture Modal - shown when a creature is captured - lazy loaded */}
        <Suspense fallback={null}>
          {capturedJobId && <CaptureModal jobId={capturedJobId} onClose={handleCaptureClose} />}
        </Suspense>

        {/* Welcome Overlay - shown on first visit */}
        <WelcomeOverlay onSkip={handleSkipToStatic} onStart={playMusic} />
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <PortfolioProvider>
        <AppContent />
      </PortfolioProvider>
    </ErrorBoundary>
  );
}

export default App;
