import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";

interface CaptureModalProps {
  jobId: string;
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

export default function CaptureModal({ jobId, onClose }: CaptureModalProps) {
  const { experience } = usePortfolioData();
  
  // Find the job by ID from the experience array
  const job = experience.find((exp) => exp.id === jobId);

  if (!job) {
    return (
      <Modal title="Captured!" onClose={onClose}>
        <p>Unknown creature captured.</p>
      </Modal>
    );
  }

  // Generate random sparkle positions
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

  return (
    <Modal title="Got it!" onClose={onClose}>
      <div className="space-y-4 relative">
        {/* Sparkle effects */}
        {sparkles.map((sparkle, i) => (
          <Sparkle key={i} {...sparkle} />
        ))}

        {/* Capture celebration header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2 animate-bounce">🎉</div>
          <p className="text-yellow-400 font-bold text-xl animate-pulse">
            Experience Captured!
          </p>
        </div>

        {/* Job card with shake animation */}
        <div className="bg-slate-800 rounded-lg p-5 border-2 border-yellow-500/50 animate-cardReveal shadow-lg shadow-yellow-500/20">
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
                <span className="text-yellow-500">★</span>
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
                    className="px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600 transition-colors"
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
          Press ESC or click outside to continue exploring
        </p>
      </div>
    </Modal>
  );
}
