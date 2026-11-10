// Portfolio data types - matches the structure of /public/data/portfolio.json

export interface QuickFacts {
  location: string;
  hometown: string;
  education: string;
  status: string;
  funFact: string;
}

export interface AboutData {
  name: string;
  title: string;
  avatar: string;
  bio: string[];
  quickFacts: QuickFacts;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  location?: string;
  url?: string;
  description: string[];
  tech: string[];
}

export interface Project {
  title: string;
  description: string;
  tech: string[];
  link?: string;
  github?: string;
}

export interface ProjectCategory {
  name: string;
  icon: string;
  projects: Project[];
}

export interface ProjectsData {
  categories: ProjectCategory[];
}

export interface SkillCategory {
  name: string;
  icon: string;
  skills: string[];
}

export interface SkillsData {
  categories: SkillCategory[];
  currentlyLearning: string;
}

export interface SocialLink {
  name: string;
  icon: string;
  url: string;
  handle: string;
}

export interface ContactData {
  intro: string;
  email: string;
  socialLinks: SocialLink[];
}

export interface PortfolioData {
  about: AboutData;
  experience: Experience[];
  projects: ProjectsData;
  skills: SkillsData;
  contact: ContactData;
}
