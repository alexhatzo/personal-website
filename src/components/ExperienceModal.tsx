import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";

interface ExperienceModalProps {
  onClose: () => void;
}

export default function ExperienceModal({ onClose }: ExperienceModalProps) {
  const { experience } = usePortfolioData();

  return (
    <Modal title="Experience" onClose={onClose}>
      <div className="space-y-6">
        {/* Timeline */}
        <div className="relative">
          {experience.map((exp, index) => (
            <div key={exp.id} className="relative pl-8 pb-6 last:pb-0">
              {/* Timeline line */}
              {index !== experience.length - 1 && (
                <div className="absolute left-[11px] top-6 w-0.5 h-full bg-slate-700" />
              )}
              {/* Timeline dot */}
              <div className="absolute left-0 top-1.5 w-6 h-6 bg-blue-500 rounded-full border-4 border-slate-900" />

              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{exp.role}</h3>
                    <p className="text-blue-400">{exp.company}</p>
                  </div>
                  <span className="text-slate-400 text-sm bg-slate-700 px-2 py-1 rounded">
                    {exp.period}
                  </span>
                </div>

                <ul className="space-y-1 text-slate-300 text-sm mb-3">
                  {exp.description.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex gap-2">
                      <span className="text-slate-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {exp.tech && exp.tech.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {exp.tech.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Resume link */}
        <div className="text-center pt-4 border-t border-slate-700">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            📄 Download Resume
          </a>
        </div>
      </div>
    </Modal>
  );
}
