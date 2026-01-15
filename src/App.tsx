import { useState, useCallback } from "react";
import GameCanvas from "./game/GameCanvas";
import AboutModal from "./components/AboutModal";
import ProjectsModal from "./components/ProjectsModal";
import SkillsModal from "./components/SkillsModal";
import ExperienceModal from "./components/ExperienceModal";
import ContactModal from "./components/ContactModal";
import MobileControls from "./components/MobileControls";

type Section = "about" | "projects" | "skills" | "experience" | "contact" | null;

function App() {
  const [activeSection, setActiveSection] = useState<Section>(null);

  const handleZoneEnter = useCallback((section: string) => {
    setActiveSection(section as Section);
  }, []);

  const handleClose = useCallback(() => {
    setActiveSection(null);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Game Canvas - Full screen background */}
      <GameCanvas onZoneEnter={handleZoneEnter} />

      {/* Mobile Controls - only visible on small screens */}
      {!activeSection && <MobileControls />}

      {/* Modal Overlays */}
      {activeSection === "about" && <AboutModal onClose={handleClose} />}
      {activeSection === "projects" && <ProjectsModal onClose={handleClose} />}
      {activeSection === "skills" && <SkillsModal onClose={handleClose} />}
      {activeSection === "experience" && <ExperienceModal onClose={handleClose} />}
      {activeSection === "contact" && <ContactModal onClose={handleClose} />}
    </div>
  );
}

export default App;
