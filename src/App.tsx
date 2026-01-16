import { useState, useCallback } from "react";
import GameCanvas from "./game/GameCanvas";
import AboutModal from "./components/AboutModal";
import ProjectsModal from "./components/ProjectsModal";
import SkillsModal from "./components/SkillsModal";
import ExperienceModal from "./components/ExperienceModal";
import ContactModal from "./components/ContactModal";
import MobileControls from "./components/MobileControls";
import CaptureModal from "./components/CaptureModal";
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

      {/* Modal Overlays */}
      {activeSection === "about" && <AboutModal onClose={handleClose} />}
      {activeSection === "projects" && <ProjectsModal onClose={handleClose} />}
      {activeSection === "skills" && <SkillsModal onClose={handleClose} />}
      {activeSection === "experience" && <ExperienceModal onClose={handleClose} />}
      {activeSection === "contact" && <ContactModal onClose={handleClose} />}

      {/* Capture Modal - shown when a creature is captured */}
      {capturedJobId && <CaptureModal jobId={capturedJobId} onClose={handleCaptureClose} />}
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
