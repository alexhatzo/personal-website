export type Section = "about" | "projects" | "skills" | "experience" | "contact";

export interface ModalContentProps {
  onClose: () => void;
  showNav?: boolean;
  currentSection?: Section;
  onNavigate?: (section: Section) => void;
}
