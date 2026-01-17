import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";

type Section = "about" | "projects" | "skills" | "experience" | "contact";

interface AboutModalProps {
  onClose: () => void;
  showNav?: boolean;
  currentSection?: Section;
  onNavigate?: (section: Section) => void;
}

export default function AboutModal({ onClose, showNav, currentSection, onNavigate }: AboutModalProps) {
  const { about } = usePortfolioData();

  return (
    <Modal 
      title="About Me" 
      onClose={onClose}
      showNav={showNav}
      currentSection={currentSection}
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-5 sm:gap-6 pb-2">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-700/80 rounded-xl flex items-center justify-center text-5xl shrink-0">
            {about.avatar}
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{about.name}</h3>
            <p className="text-slate-400 text-lg">{about.title}</p>
          </div>
        </div>

        <div className="space-y-4">
          {about.bio.map((paragraph, index) => (
            <p key={index} className="leading-relaxed text-slate-300">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="pt-6 mt-6 border-t border-slate-700">
          <h4 className="font-semibold text-white text-lg mb-4">Quick Facts</h4>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-lg">📍</span>
              <span><span className="text-slate-400">Location:</span> {about.quickFacts.location}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">🎓</span>
              <span><span className="text-slate-400">Education:</span> {about.quickFacts.education}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">💼</span>
              <span><span className="text-slate-400">Currently:</span> {about.quickFacts.status}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">🎮</span>
              <span><span className="text-slate-400">Fun fact:</span> {about.quickFacts.funFact}</span>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
