import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";
import type { Experience, ProjectCategory, SkillCategory } from "../types/portfolio";

interface CaptureModalProps {
  jobId: string; // Actually creatureId - can be job-*, project-*, or skill-*
  onClose: () => void;
}

// Sparkle component for celebration effect
function Sparkle({ delay, left, top }: { delay: number; left: string; top: string }) {
  return (
    <div
      className="absolute text-yellow-400 animate-sparkle pointer-events-none"
      style={{
        left,
        top,
        animationDelay: `${delay}ms`,
      }}
    >
      ✦
    </div>
  );
}

// Generate sparkle positions
const sparkles = [
  { delay: 0, left: "10%", top: "20%" },
  { delay: 100, left: "85%", top: "15%" },
  { delay: 200, left: "15%", top: "60%" },
  { delay: 300, left: "80%", top: "70%" },
  { delay: 150, left: "50%", top: "10%" },
  { delay: 250, left: "30%", top: "80%" },
  { delay: 50, left: "70%", top: "40%" },
  { delay: 350, left: "20%", top: "40%" },
];

// ============================================================================
// Sub-components for different capture types
// ============================================================================

function ExperienceContent({ job }: { job: Experience }) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <p className="text-yellow-400 font-bold text-2xl animate-pulse">
          Experience Captured!
        </p>
      </div>

      <div className="bg-slate-800/80 rounded-xl p-6 sm:p-8 border border-yellow-500/30 animate-cardReveal shadow-xl shadow-yellow-500/10">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{job.role}</h3>
            <p className="text-blue-400 font-medium text-lg">{job.company}</p>
          </div>
          <span className="text-slate-300 text-sm bg-slate-700/80 px-4 py-2 rounded-full">
            {job.period}
          </span>
        </div>

        <ul className="space-y-3 text-slate-300 mb-6">
          {job.description.map((item, index) => (
            <li key={index} className="flex gap-3 leading-relaxed">
              <span className="text-yellow-500 mt-1">★</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {job.tech && (
          <div className="pt-5 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 mb-3 font-medium">Technologies:</p>
            <div className="flex flex-wrap gap-2">
              {job.tech.map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-slate-700/80 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ProjectContent({ category }: { category: ProjectCategory }) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="text-6xl mb-4 animate-bounce">🔨</div>
        <p className="text-green-400 font-bold text-2xl animate-pulse">
          Projects Smashed!
        </p>
      </div>

      <div className="bg-slate-800/80 rounded-xl p-6 sm:p-8 border border-green-500/30 animate-cardReveal shadow-xl shadow-green-500/10">
        {/* Category Header */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-4xl">{category.icon}</span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">{category.name} Projects</h3>
        </div>

        {/* Projects in this category */}
        <div className="space-y-5">
          {category.projects.map((project, index) => (
            <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
              <div className="flex justify-between items-start gap-3 mb-2">
                <h4 className="text-lg font-semibold text-white">{project.title}</h4>
                <div className="flex gap-2 flex-shrink-0">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      📂
                    </a>
                  )}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 text-sm transition-colors"
                    >
                      🔗
                    </a>
                  )}
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="px-2 py-1 bg-slate-600/80 text-slate-300 text-xs rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SkillsContent({ category }: { category: SkillCategory }) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="text-6xl mb-4 animate-bounce">🏹</div>
        <p className="text-blue-400 font-bold text-2xl animate-pulse">
          Skill Unlocked!
        </p>
      </div>

      <div className="bg-slate-800/80 rounded-xl p-6 sm:p-8 border border-blue-500/30 animate-cardReveal shadow-xl shadow-blue-500/10">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-4xl">{category.icon}</span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">{category.name}</h3>
        </div>

        <div className="flex flex-wrap gap-3">
          {category.skills.map((skill, index) => (
            <span
              key={index}
              className="px-4 py-2.5 bg-blue-600/20 text-blue-200 text-sm rounded-xl border border-blue-500/20 hover:bg-blue-600/40 hover:border-blue-500/40 transition-all"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Main CaptureModal Component
// ============================================================================

export default function CaptureModal({ jobId: creatureId, onClose }: CaptureModalProps) {
  const { experience, projects, skills } = usePortfolioData();

  // Determine type and index from creatureId
  // Format: "job-0", "project-1", "skill-2", etc.
  const [type, indexStr] = creatureId.split("-");
  const index = parseInt(indexStr, 10);

  // Get the appropriate data based on type
  let content: React.ReactNode = null;

  if (type === "job" && !isNaN(index) && index < experience.length) {
    const job = experience[index];
    content = <ExperienceContent job={job} />;
  } else if (type === "project" && !isNaN(index) && index < projects.categories.length) {
    const category = projects.categories[index];
    content = <ProjectContent category={category} />;
  } else if (type === "skill" && !isNaN(index) && index < skills.categories.length) {
    const category = skills.categories[index];
    content = <SkillsContent category={category} />;
  }

  // Fallback for unknown creature
  if (!content) {
    return (
      <Modal title="Captured!" onClose={onClose}>
        <p className="text-slate-400">Unknown creature captured: {creatureId}</p>
      </Modal>
    );
  }

  return (
    <Modal title="Got it!" onClose={onClose}>
      <div className="relative">
        {/* Sparkle effects */}
        {sparkles.map((sparkle, i) => (
          <Sparkle key={i} {...sparkle} />
        ))}

        {content}

        {/* Close instruction */}
        <p className="text-center text-slate-500 text-sm mt-8 pt-6 border-t border-slate-700/50">
          Press ESC or click outside to continue exploring
        </p>
      </div>
    </Modal>
  );
}
