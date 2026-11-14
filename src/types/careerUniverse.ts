export type NodeType = "bachelor" | "domain" | "occupation" | "specialization";

export interface AcademicCourse {
  code: string;
  name: string;
  credits: number;
  completed?: boolean;
  grade?: number; // scale 4.0
  relevanceWeight?: number; // 0.0 - 1.0 weight for career fit
}

export interface CareerProject {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  techStack: string[];
}

export interface CareerNode {
  id: string;
  name: string;
  englishName?: string;
  code?: string;
  type: NodeType;
  layer: 1 | 2 | 3 | 4;
  domainId?: string;
  occupationId?: string;
  icon?: string;
  description: string;
  
  // Coordinates in radial graph
  x: number;
  y: number;
  radius?: number;
  angle?: number; // radians

  // Feasibility & Competency scores (0-100 or null if insufficient data)
  feasibilityScore?: number | null;
  academicFitScore?: number | null;
  practicalSkillScore?: number | null;

  // Metadata for detail modal
  skills?: {
    core: string[];
    supporting: string[];
  };
  technologies?: string[];
  relevantCourses?: AcademicCourse[];
  priorityCourses?: string[];
  recommendedProjects?: CareerProject[];
  skillGaps?: string[];
}

export interface CareerEdge {
  id: string;
  source: string;
  target: string;
  progressPercent: number; // 0 - 100 representing completed competency
  isSelected?: boolean;
}

export interface BachelorCurriculumStats {
  degreeName: string;
  totalCourses: number;
  completedCourses: number;
  remainingCourses: number;
  progressPercent: number;
  gpa?: number | null;
  completedList: string[];
}

export interface SelectedCareerState {
  domainId: string | null;
  occupationId: string | null;
  specializationId: string | null;
}
