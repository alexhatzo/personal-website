import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";

interface ProjectsModalProps {
  onClose: () => void;
}

export default function ProjectsModal({ onClose }: ProjectsModalProps) {
  const { projects } = usePortfolioData();

  return (
    <Modal title="Projects" onClose={onClose}>
      <div className="space-y-6">
        {projects.map((project, index) => (
          <div
            key={index}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <h3 className="text-lg font-bold text-white mb-2">{project.title}</h3>
            <p className="text-slate-300 mb-3">{project.description}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {project.tech.map((tech, techIndex) => (
                <span
                  key={techIndex}
                  className="px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  🔗 Live Demo
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  📂 GitHub
                </a>
              )}
            </div>
          </div>
        ))}

        <p className="text-slate-500 text-sm text-center pt-4">
          More projects coming soon...
        </p>
      </div>
    </Modal>
  );
}
