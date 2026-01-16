import { useState, useCallback } from "react";
import GameCanvas from "./game/GameCanvas";
import AboutModal from "./components/AboutModal";
import ProjectsModal from "./components/ProjectsModal";
import SkillsModal from "./components/SkillsModal";
import ExperienceModal from "./components/ExperienceModal";
import ContactModal from "./components/ContactModal";
import MobileControls from "./components/MobileControls";
import CaptureModal from "./components/CaptureModal";
import WelcomeOverlay from "./components/WelcomeOverlay";
import { PortfolioProvider, usePortfolio } from "./context/PortfolioContext";

type Section = "about" | "projects" | "skills" | "experience" | "contact" | null;

function LoadingScreen() {
  return (
    <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🎮</div>
        <p className="text-white text-lg">Loading portfolio...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
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

  const handleZoneEnter = useCallback((section: string) => {
    setActiveSection(section as Section);
  }, []);

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

  if (isLoading) {
    return <LoadingScreen />;
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
    <div className="relative w-full h-screen overflow-hidden">
      {/* Game Canvas - Full screen background */}
      <GameCanvas 
        onZoneEnter={handleZoneEnter} 
        onCapture={handleCapture}
        buildingsData={data.buildings}
      />

      {/* Mobile Controls - only visible on small screens and no modal open */}
      {!activeSection && !capturedJobId && <MobileControls />}

      {/* Modal Overlays with section navigation */}
      {activeSection === "about" && <AboutModal onClose={handleClose} {...modalNavProps} />}
      {activeSection === "projects" && <ProjectsModal onClose={handleClose} {...modalNavProps} />}
      {activeSection === "skills" && <SkillsModal onClose={handleClose} {...modalNavProps} />}
      {activeSection === "experience" && <ExperienceModal onClose={handleClose} {...modalNavProps} />}
      {activeSection === "contact" && <ContactModal onClose={handleClose} {...modalNavProps} />}

      {/* Capture Modal - shown when a creature is captured */}
      {capturedJobId && <CaptureModal jobId={capturedJobId} onClose={handleCaptureClose} />}

      {/* Welcome Overlay - shown on first visit */}
      <WelcomeOverlay />
    </div>
  );
}

function App() {
  return (
    <PortfolioProvider>
      <AppContent />
    </PortfolioProvider>
  );
}

export default App;
