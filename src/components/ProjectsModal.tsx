import { memo } from "react";
import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";
import type { ModalContentProps } from "../types/modal";

function ProjectsModal({ onClose, showNav, currentSection, onNavigate }: ModalContentProps) {
  const { projects } = usePortfolioData();

  return (
    <Modal 
      title="Projects" 
      onClose={onClose}
      showNav={showNav}
      currentSection={currentSection}
      onNavigate={onNavigate}
    >
      <div className="space-y-10">
        {projects.categories.map((category) => (
          <div key={category.name}>
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{category.icon}</span>
              <h2 className="text-2xl font-bold text-white">{category.name}</h2>
              <div className="flex-1 h-px bg-slate-700 ml-2" />
            </div>

            {/* Projects in this category */}
            <div className="space-y-6">
              {category.projects.map((project) => (
                <div
                  key={project.title}
                  className="bg-slate-800/80 rounded-xl p-6 sm:p-8 border border-slate-700 hover:border-slate-500 transition-colors"
                >
                  <h3 className="text-xl font-bold text-white mb-3">{project.title}</h3>
                  <p className="text-slate-300 mb-5 leading-relaxed">{project.description}</p>

                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
                    {project.tech.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 bg-slate-700/80 text-slate-300 text-sm rounded-lg"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-5 pt-2">
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        aria-label={`View live project: ${project.title}`}
                      >
                        🔗 Link
                      </a>
                    )}
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        aria-label={`View source code on GitHub: ${project.title}`}
                      >
                        📂 GitHub
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default memo(ProjectsModal);
