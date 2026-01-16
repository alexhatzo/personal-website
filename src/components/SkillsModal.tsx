import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";

interface SkillsModalProps {
  onClose: () => void;
}

export default function SkillsModal({ onClose }: SkillsModalProps) {
  const { skills } = usePortfolioData();

  return (
    <Modal title="Skills" onClose={onClose}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.categories.map((category, index) => (
          <div
            key={index}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700"
          >
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span>{category.icon}</span>
              {category.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill, skillIndex) => (
                <span
                  key={skillIndex}
                  className="px-3 py-1 bg-slate-700 text-slate-200 text-sm rounded-full hover:bg-slate-600 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h4 className="font-semibold text-white mb-2">Currently Learning 📚</h4>
        <p className="text-slate-300 text-sm">
          {skills.currentlyLearning}
        </p>
      </div>
    </Modal>
  );
}
