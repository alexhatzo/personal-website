import Modal from "./Modal";
import { usePortfolioData } from "../context/PortfolioContext";

type Section = "about" | "projects" | "skills" | "experience" | "contact";

interface ContactModalProps {
  onClose: () => void;
  showNav?: boolean;
  currentSection?: Section;
  onNavigate?: (section: Section) => void;
}

export default function ContactModal({ onClose, showNav, currentSection, onNavigate }: ContactModalProps) {
  const { contact } = usePortfolioData();

  return (
    <Modal 
      title="Contact" 
      onClose={onClose}
      showNav={showNav}
      currentSection={currentSection}
      onNavigate={onNavigate}
    >
      <div className="space-y-8">
        <p className="text-slate-300 text-center text-lg leading-relaxed">
          {contact.intro}
        </p>

        {/* Social Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contact.socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 sm:p-6 bg-slate-800/80 rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all group"
            >
              <span className="text-3xl">{link.icon}</span>
              <div>
                <p className="font-semibold text-white text-lg group-hover:text-blue-400 transition-colors">
                  {link.name}
                </p>
                <p className="text-slate-400">{link.handle}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Contact Form Placeholder */}
        <div className="p-6 sm:p-8 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
          <h4 className="font-semibold text-white text-lg mb-3">Quick Message</h4>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Prefer email? Click below to send me a message directly.
          </p>
          <a
            href={`mailto:${contact.email}?subject=Hello from your portfolio!`}
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-semibold text-lg"
          >
            📨 Send Email
          </a>
        </div>

        {/* Fun message */}
        <p className="text-slate-500 text-center italic pt-2">
          Thanks for exploring my portfolio! Hope you enjoyed the walk around the city
        </p>
      </div>
    </Modal>
  );
}
