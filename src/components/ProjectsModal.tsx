import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";

type Section = "about" | "projects" | "skills" | "experience" | "contact";

interface ProjectsModalProps {
  onClose: () => void;
  showNav?: boolean;
  currentSection?: Section;
  onNavigate?: (section: Section) => void;
}

export default function ProjectsModal({ onClose, showNav, currentSection, onNavigate }: ProjectsModalProps) {
  const { projects } = usePortfolioData();

  return (
    <Modal 
      title="Projects" 
      onClose={onClose}
      showNav={showNav}
      currentSection={currentSection}
      onNavigate={onNavigate}
    >
      <div className="space-y-8">
        {projects.map((project, index) => (
          <div
            key={index}
            className="bg-slate-800/80 rounded-xl p-6 sm:p-8 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <h3 className="text-xl font-bold text-white mb-3">{project.title}</h3>
            <p className="text-slate-300 mb-5 leading-relaxed">{project.description}</p>

            <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
              {project.tech.map((tech, techIndex) => (
                <span
                  key={techIndex}
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
                >
                  🔗 Live Demo
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  📂 GitHub
                </a>
              )}
            </div>
          </div>
        ))}

        <p className="text-slate-500 text-sm text-center pt-6">
          More projects coming soon...
        </p>
      </div>
    </Modal>
  );
}
