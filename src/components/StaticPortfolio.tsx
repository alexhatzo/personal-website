import { usePortfolioData } from "../context/PortfolioContext";

interface StaticPortfolioProps {
  onBackToGame: () => void;
}

const SECTIONS = [
  { id: "about", label: "About", icon: "👤" },
  { id: "projects", label: "Projects", icon: "💼" },
  { id: "skills", label: "Skills", icon: "⚡" },
  { id: "experience", label: "Experience", icon: "📋" },
  { id: "contact", label: "Contact", icon: "📬" },
] as const;

export default function StaticPortfolio({ onBackToGame }: StaticPortfolioProps) {
  const { about, projects, skills, experience, contact } = usePortfolioData();

  return (
    <div className="fixed inset-0 overflow-y-auto bg-slate-900 text-slate-200 z-50">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-b from-slate-800 to-slate-900 pt-12 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Back to game button */}
          <button
            onClick={onBackToGame}
            className="absolute top-4 right-4 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🎮</span>
            <span className="hidden sm:inline">Back to Game</span>
          </button>

          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-700/80 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl mx-auto mb-6 shadow-xl">
            {about.avatar}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 pixel-text">
            {about.name}
          </h1>
          <p className="text-lg sm:text-xl text-slate-400">
            {about.title}
          </p>
        </div>
      </header>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <ul className="flex overflow-x-auto gap-1 py-3 scrollbar-hide">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-20">
        {/* About Section */}
        <section id="about" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 pixel-text">
            <span className="text-3xl">👤</span>
            About Me
          </h2>
          
          <div className="space-y-6">
            <div className="space-y-4">
              {about.bio.map((paragraph, index) => (
                <p key={index} className="leading-relaxed text-slate-300 text-lg">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
              <h3 className="font-semibold text-white text-lg mb-4">Quick Facts</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <span><span className="text-slate-400">Location:</span> {about.quickFacts.location}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">🎓</span>
                  <span><span className="text-slate-400">Education:</span> {about.quickFacts.education}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">💼</span>
                  <span><span className="text-slate-400">Currently:</span> {about.quickFacts.status}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">🎮</span>
                  <span><span className="text-slate-400">Fun fact:</span> {about.quickFacts.funFact}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 pixel-text">
            <span className="text-3xl">💼</span>
            Projects
          </h2>
          
          <div className="space-y-6">
            {projects.map((project, index) => (
              <div
                key={index}
                className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 hover:border-slate-500 transition-colors"
              >
                <h3 className="text-xl font-bold text-white mb-3">{project.title}</h3>
                <p className="text-slate-300 mb-5 leading-relaxed">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1.5 bg-slate-700/80 text-slate-300 text-sm rounded-lg"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex gap-5">
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
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 pixel-text">
            <span className="text-3xl">⚡</span>
            Skills
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.categories.map((category, index) => (
              <div
                key={index}
                className="bg-slate-800/80 rounded-xl p-6 border border-slate-700"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  {category.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-3.5 py-1.5 bg-slate-700/80 text-slate-200 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="font-semibold text-white text-lg mb-3">Currently Learning 📚</h3>
            <p className="text-slate-300 leading-relaxed">
              {skills.currentlyLearning}
            </p>
          </div>
        </section>

        {/* Experience Section */}
        <section id="experience" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 pixel-text">
            <span className="text-3xl">📋</span>
            Experience
          </h2>
          
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
                    {exp.description.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-3 leading-relaxed">
                        <span className="text-slate-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {exp.tech && exp.tech.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {exp.tech.map((tech, techIndex) => (
                        <span
                          key={techIndex}
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

          <div className="text-center pt-8">
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
            >
              📄 Download Resume
            </a>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 pixel-text">
            <span className="text-3xl">📬</span>
            Contact
          </h2>
          
          <div className="space-y-8">
            <p className="text-slate-300 text-center text-lg leading-relaxed">
              {contact.intro}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contact.socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 sm:p-6 bg-slate-800/80 rounded-xl border border-slate-700 hover:border-blue-500 transition-all group"
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

            <div className="p-6 sm:p-8 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
              <h3 className="font-semibold text-white text-lg mb-3">Quick Message</h3>
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
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/50 border-t border-slate-700 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <button
            onClick={onBackToGame}
            className="inline-flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors mb-4"
          >
            <span>🎮</span>
            <span>Try the interactive game version</span>
          </button>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} {about.name}. Built with React + Kaplay.
          </p>
        </div>
      </footer>
    </div>
  );
}
