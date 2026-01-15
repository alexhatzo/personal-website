import Modal from "./Modal";

interface CaptureModalProps {
  jobId: string;
  onClose: () => void;
}

interface Experience {
  role: string;
  company: string;
  period: string;
  description: string[];
  tech?: string[];
}

// Job data indexed by creature ID
const JOBS: Record<string, Experience> = {
  "job-0": {
    role: "Senior Software Engineer",
    company: "Company Name",
    period: "2023 - Present",
    description: [
      "Led development of key features that improved user engagement by X%",
      "Mentored junior developers and conducted code reviews",
      "Architected scalable solutions handling thousands of concurrent users",
    ],
    tech: ["React", "Node.js", "AWS", "TypeScript"],
  },
  "job-1": {
    role: "Software Engineer",
    company: "Previous Company",
    period: "2021 - 2023",
    description: [
      "Built and maintained customer-facing web applications",
      "Implemented CI/CD pipelines reducing deployment time by 50%",
      "Collaborated with design team to improve UX across products",
    ],
    tech: ["Vue.js", "Python", "PostgreSQL", "Docker"],
  },
  "job-2": {
    role: "Junior Developer",
    company: "First Company",
    period: "2019 - 2021",
    description: [
      "Developed features for internal tools and dashboards",
      "Participated in agile sprints and daily standups",
      "Learned best practices for clean, maintainable code",
    ],
    tech: ["JavaScript", "HTML/CSS", "MySQL", "Git"],
  },
};

export default function CaptureModal({ jobId, onClose }: CaptureModalProps) {
  const job = JOBS[jobId];

  if (!job) {
    return (
      <Modal title="Captured!" onClose={onClose}>
        <p>Unknown creature captured.</p>
      </Modal>
    );
  }

  return (
    <Modal title="Got it!" onClose={onClose}>
      <div className="space-y-4">
        {/* Capture celebration header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">*</div>
          <p className="text-yellow-400 font-bold text-lg">Experience Captured!</p>
        </div>

        {/* Job card */}
        <div className="bg-slate-800 rounded-lg p-5 border-2 border-yellow-500/50">
          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
            <div>
              <h3 className="text-xl font-bold text-white">{job.role}</h3>
              <p className="text-blue-400 font-medium">{job.company}</p>
            </div>
            <span className="text-slate-300 text-sm bg-slate-700 px-3 py-1 rounded-full">
              {job.period}
            </span>
          </div>

          <ul className="space-y-2 text-slate-300 mb-4">
            {job.description.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-yellow-500">-</span>
                {item}
              </li>
            ))}
          </ul>

          {job.tech && (
            <div className="pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Technologies:</p>
              <div className="flex flex-wrap gap-2">
                {job.tech.map((tech, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Close instruction */}
        <p className="text-center text-slate-400 text-sm mt-4">
          Press ESC or click outside to continue
        </p>
      </div>
    </Modal>
  );
}
