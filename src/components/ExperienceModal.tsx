import { memo } from "react";
import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";
import type { ModalContentProps } from "../types/modal";

function ExperienceModal({ onClose, showNav, currentSection, onNavigate }: ModalContentProps) {
  const { experience } = usePortfolioData();

  return (
    <Modal 
      title="Experience" 
      onClose={onClose}
      showNav={showNav}
      currentSection={currentSection}
      onNavigate={onNavigate}
    >
      <div className="space-y-8">
        {/* Timeline */}
        <div className="relative">
          {experience.map((exp, index) => (
            <div key={exp.id} className="relative pl-10 sm:pl-12 pb-8 last:pb-0">
              {/* Timeline line */}
              {index !== experience.length - 1 && (
                <div className="absolute left-[13px] sm:left-[15px] top-8 w-0.5 h-full bg-slate-700" />
              )}
              {/* Timeline dot */}
              <div className="absolute left-0 top-2 w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full border-4 border-slate-900" />

              <div className="bg-slate-800/80 rounded-xl p-5 sm:p-6 border border-slate-700">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{exp.role}</h3>
                    <p className="text-blue-400 font-medium">{exp.company}</p>
                  </div>
                  <span className="text-slate-400 text-sm bg-slate-700/80 px-3 py-1.5 rounded-lg">
                    {exp.period}
                  </span>
                </div>

                <ul className="space-y-2.5 text-slate-300 mb-5">
                  {exp.description.map((item) => (
                    <li key={item} className="flex gap-3 leading-relaxed">
                      <span className="text-slate-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {exp.tech && exp.tech.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {exp.tech.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-slate-700/80 text-slate-400 text-sm rounded-lg"
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
        <div className="text-center pt-6 mt-2 border-t border-slate-700">
          <a
            href="/data/Hatzopoulos Alexandros Resume 2025.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
          >
            📄 Download Resume
          </a>
        </div>
      </div>
    </Modal>
  );
}

export default memo(ExperienceModal);
