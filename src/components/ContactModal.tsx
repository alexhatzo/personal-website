import Modal from "./Modal";

interface ContactModalProps {
  onClose: () => void;
}

interface SocialLink {
  name: string;
  icon: string;
  url: string;
  handle: string;
}

const socialLinks: SocialLink[] = [
  {
    name: "GitHub",
    icon: "📂",
    url: "https://github.com/yourusername",
    handle: "@yourusername",
  },
  {
    name: "LinkedIn",
    icon: "💼",
    url: "https://linkedin.com/in/yourusername",
    handle: "/in/yourusername",
  },
  {
    name: "Twitter",
    icon: "🐦",
    url: "https://twitter.com/yourusername",
    handle: "@yourusername",
  },
  {
    name: "Email",
    icon: "📧",
    url: "mailto:your.email@example.com",
    handle: "your.email@example.com",
  },
];

export default function ContactModal({ onClose }: ContactModalProps) {
  return (
    <Modal title="Contact" onClose={onClose}>
      <div className="space-y-6">
        <p className="text-slate-300 text-center">
          I'm always open to discussing new opportunities, interesting projects,
          or just having a chat about technology. Feel free to reach out!
        </p>

        {/* Social Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all group"
            >
              <span className="text-2xl">{link.icon}</span>
              <div>
                <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {link.name}
                </p>
                <p className="text-slate-400 text-sm">{link.handle}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Contact Form Placeholder */}
        <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
          <h4 className="font-semibold text-white mb-2">Quick Message</h4>
          <p className="text-slate-400 text-sm mb-4">
            Prefer email? Click below to send me a message directly.
          </p>
          <a
            href="mailto:your.email@example.com?subject=Hello from your portfolio!"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold"
          >
            📨 Send Email
          </a>
        </div>

        {/* Fun message */}
        <p className="text-slate-500 text-sm text-center italic">
          Thanks for exploring my portfolio! Hope you enjoyed the walk around the city 🏙️
        </p>
      </div>
    </Modal>
  );
}
