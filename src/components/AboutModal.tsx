import Modal from "./Modal";

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <Modal title="About Me" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center text-4xl">
            👨‍💻
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Your Name</h3>
            <p className="text-slate-400">Software Engineer / Developer</p>
          </div>
        </div>

        <p className="leading-relaxed">
          Welcome to my interactive portfolio! I'm a passionate developer who loves
          building creative and engaging web experiences. This website itself is a
          testament to my belief that portfolios should be more than just a list of
          projects – they should be an experience.
        </p>

        <p className="leading-relaxed">
          When I'm not coding, you can find me exploring new technologies,
          contributing to open source, or playing video games (which clearly
          influenced this portfolio design).
        </p>

        <div className="pt-4 border-t border-slate-700">
          <h4 className="font-semibold text-white mb-2">Quick Facts</h4>
          <ul className="space-y-1 text-slate-300">
            <li>📍 Location: Your City, Country</li>
            <li>🎓 Education: Your University / Self-taught</li>
            <li>💼 Currently: Open to opportunities</li>
            <li>🎮 Fun fact: Built this portfolio as a mini-game!</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
