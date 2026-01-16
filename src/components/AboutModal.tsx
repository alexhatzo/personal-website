import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  const { about } = usePortfolioData();

  return (
    <Modal title="About Me" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center text-4xl">
            {about.avatar}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{about.name}</h3>
            <p className="text-slate-400">{about.title}</p>
          </div>
        </div>

        {about.bio.map((paragraph, index) => (
          <p key={index} className="leading-relaxed">
            {paragraph}
          </p>
        ))}

        <div className="pt-4 border-t border-slate-700">
          <h4 className="font-semibold text-white mb-2">Quick Facts</h4>
          <ul className="space-y-1 text-slate-300">
            <li>📍 Location: {about.quickFacts.location}</li>
            <li>🎓 Education: {about.quickFacts.education}</li>
            <li>💼 Currently: {about.quickFacts.status}</li>
            <li>🎮 Fun fact: {about.quickFacts.funFact}</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
