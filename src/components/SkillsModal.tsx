import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";

type Section = "about" | "projects" | "skills" | "experience" | "contact";

interface SkillsModalProps {
  onClose: () => void;
  showNav?: boolean;
  currentSection?: Section;
  onNavigate?: (section: Section) => void;
}

export default function SkillsModal({ onClose, showNav, currentSection, onNavigate }: SkillsModalProps) {
  const { skills } = usePortfolioData();

  return (
    <Modal 
      title="Skills" 
      onClose={onClose}
      showNav={showNav}
      currentSection={currentSection}
      onNavigate={onNavigate}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {skills.categories.map((category, index) => (
          <div
            key={index}
            className="bg-slate-800/80 rounded-xl p-5 sm:p-6 border border-slate-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-xl">{category.icon}</span>
              {category.name}
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {category.skills.map((skill, skillIndex) => (
                <span
                  key={skillIndex}
                  className="px-3.5 py-1.5 bg-slate-700/80 text-slate-200 text-sm rounded-full hover:bg-slate-600 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 sm:p-6 bg-slate-800/50 rounded-xl border border-slate-700">
        <h4 className="font-semibold text-white text-lg mb-3">Currently Learning 📚</h4>
        <p className="text-slate-300 leading-relaxed">
          {skills.currentlyLearning}
        </p>
      </div>
    </Modal>
  );
}
