import {
  BACHELOR_STATS,
  CAREER_UNIVERSE_CATALOG,
  DomainName,
  DomainRawDefinition,
} from "../data/careerUniverseData";
import {
  BachelorCurriculumStats,
  CareerEdge,
  CareerNode,
  SelectedCareerState,
} from "../types/careerUniverse";

export interface StudentAcademicRecord {
  studentId?: string;
  totalCompletedCourses: number;
  completedCourseCodes: string[];
  gpa?: number;
  transcriptUploadedAt?: string;
}

// Local mock/fallback state based on Bachelor stats
const DEFAULT_STUDENT_RECORD: StudentAcademicRecord = {
  totalCompletedCourses: BACHELOR_STATS.completedCourses,
  completedCourseCodes: ["IT101", "IT102", "IT201", "IT202", "IT203", "IT204"],
  gpa: BACHELOR_STATS.gpa ?? 3.25,
};

/**
 * Deterministically computes the Academic Career Fit score (0 - 100)
 * based on courses completed vs required relevant courses and weights.
 */
export function calculateAcademicFit(
  relevantCourses: { code: string; relevanceWeight?: number; completed?: boolean }[],
  completedCodes: string[]
): number {
  if (!relevantCourses || relevantCourses.length === 0) return 0;

  let totalWeight = 0;
  let achievedWeight = 0;

  for (const c of relevantCourses) {
    const weight = c.relevanceWeight ?? 1.0;
    totalWeight += weight;
    const isDone = completedCodes.includes(c.code) || Boolean(c.completed);
    if (isDone) {
      achievedWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  const ratio = (achievedWeight / totalWeight) * 100;
  return Math.round(ratio * 10) / 10;
}

/**
 * Builds nodes and edges for the SKELETON STATE
 * Shown when NO Career Domain is selected.
 * Displays a large central Bachelor node surrounded by the 9 domains as subtle placeholder nodes.
 */
export function buildSkeletonGraph(): { nodes: CareerNode[]; edges: CareerEdge[] } {
  const nodes: CareerNode[] = [];
  const edges: CareerEdge[] = [];

  // Central Bachelor Node at (0, 0)
  nodes.push({
    id: "bachelor-root",
    name: "Bachelor of IT",
    englishName: "Bachelor of Information Technology",
    code: "BIT",
    type: "bachelor",
    layer: 1,
    x: 0,
    y: 0,
    description: "Nền tảng học thuật chuẩn 52 môn học ngành Công nghệ Thông tin - Trường Đại học Phương Đông.",
    feasibilityScore: null,
    academicFitScore: BACHELOR_STATS.progressPercent,
    skills: {
      core: ["Khoa học Máy tính Cơ sở", "Toán học & Giải thuật", "Lập trình Căn bản", "Hệ thống Máy tính"],
      supporting: ["Tiếng Anh Chuyên ngành", "Kỹ năng Làm việc Nhóm", "Đạo đức Nghề nghiệp"],
    },
    priorityCourses: ["IT202 - Cấu trúc Dữ liệu & Giải thuật", "IT204 - Lập trình Hướng đối tượng"],
  });

  // 9 domains in a circle around Bachelor node
  const radius = 280;
  const total = CAREER_UNIVERSE_CATALOG.length;

  CAREER_UNIVERSE_CATALOG.forEach((domain, idx) => {
    const angle = (idx * 2 * Math.PI) / total - Math.PI / 2;
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));

    nodes.push({
      id: domain.id,
      name: domain.name,
      englishName: domain.name,
      type: "domain",
      layer: 2,
      domainId: domain.id,
      x,
      y,
      radius,
      angle,
      icon: domain.icon,
      description: domain.description,
      feasibilityScore: null,
      academicFitScore: null,
    });

    edges.push({
      id: `edge-skeleton-bachelor-${domain.id}`,
      source: "bachelor-root",
      target: domain.id,
      progressPercent: 0,
      isSelected: false,
    });
  });

  return { nodes, edges };
}

/**
 * Builds nodes and edges for an ACTIVE CAREER DOMAIN
 * Selected Domain sits at (0, 0) with Bachelor node above it as academic foundation,
 * Occupations branch radially outward, and Specializations branch further outward.
 */
export function buildActiveDomainGraph(
  selectedState: SelectedCareerState,
  studentRecord: StudentAcademicRecord = DEFAULT_STUDENT_RECORD
): { nodes: CareerNode[]; edges: CareerEdge[] } {
  if (!selectedState.domainId) {
    return buildSkeletonGraph();
  }

  const domain = CAREER_UNIVERSE_CATALOG.find((d) => d.id === selectedState.domainId);
  if (!domain) return buildSkeletonGraph();

  const nodes: CareerNode[] = [];
  const edges: CareerEdge[] = [];
  const completedCodes = studentRecord.completedCourseCodes;

  // 1. Bachelor Node (Academic Foundation) anchored at (0, -220)
  const bachelorProgress = Math.round((studentRecord.totalCompletedCourses / BACHELOR_STATS.totalCourses) * 1000) / 10;
  nodes.push({
    id: "bachelor-root",
    name: "Bachelor of IT",
    englishName: "Bachelor of Information Technology",
    code: "BIT",
    type: "bachelor",
    layer: 1,
    x: 0,
    y: -220,
    description: "Cơ sở học thuật nền tảng: Đã hoàn thành " + studentRecord.totalCompletedCourses + " / 52 môn học trong chương trình đào tạo.",
    academicFitScore: bachelorProgress,
    feasibilityScore: null,
    skills: {
      core: ["Khoa học Máy tính", "Toán ứng dụng & Giải thuật", "Lập trình C/C++, Java", "Kiến trúc Máy tính"],
      supporting: ["Tiếng Anh Kỹ thuật", "Kỹ năng Thuyết trình & Báo cáo", "Tư duy Logic"],
    },
    priorityCourses: ["IT202 - Cấu trúc Dữ liệu", "IT204 - Lập trình OOP"],
  });

  // Calculate domain-level feasibility by averaging its occupations' fit scores
  let domainTotalFit = 0;
  let domainOccCount = 0;
  domain.occupations.forEach((occ) => {
    domainTotalFit += calculateAcademicFit(occ.relevantCourses, completedCodes);
    domainOccCount += 1;
  });
  const domainFeasibility = domainOccCount > 0 ? Math.round(domainTotalFit / domainOccCount) : 0;

  // 2. Central Selected Domain Node at (0, 0)
  nodes.push({
    id: domain.id,
    name: domain.name,
    englishName: domain.name,
    type: "domain",
    layer: 2,
    domainId: domain.id,
    x: 0,
    y: 0,
    icon: domain.icon,
    description: domain.description,
    feasibilityScore: domainFeasibility,
    academicFitScore: domainFeasibility,
    practicalSkillScore: 40,
    skills: {
      core: domain.occupations.flatMap((o) => o.coreSkills).slice(0, 8),
      supporting: domain.occupations.flatMap((o) => o.supportingSkills).slice(0, 6),
    },
  });

  // Edge Bachelor -> Selected Domain
  const isBachelorDomainActive = Boolean(selectedState.domainId);
  edges.push({
    id: `edge-bachelor-${domain.id}`,
    source: "bachelor-root",
    target: domain.id,
    progressPercent: bachelorProgress,
    isSelected: isBachelorDomainActive,
  });

  // 3. Occupations (Layer 3) positioned radially around (0, 0)
  const occCount = domain.occupations.length;
  // Arc angle distribution (spanning around the bottom/sides, avoiding top where Bachelor sits)
  // Let's use angles from 0.2*PI to 0.8*PI, or full circular with angle offset
  const R_OCC = 340;
  const R_SPEC = 560;

  domain.occupations.forEach((occ, oIdx) => {
    // Angular distribution: spread evenly around the lower arc/circle
    // E.g. start from 0.15 * Math.PI to 0.85 * Math.PI if count is 1-3, or full circle avoiding top
    let occAngle: number;
    if (occCount === 1) {
      occAngle = Math.PI / 2; // directly downward
    } else if (occCount === 2) {
      occAngle = oIdx === 0 ? Math.PI * 0.35 : Math.PI * 0.65;
    } else if (occCount === 3) {
      occAngle = Math.PI * 0.25 + oIdx * (Math.PI * 0.25); // 0.25pi, 0.5pi, 0.75pi
    } else {
      const startAngle = 0.15 * Math.PI;
      const endAngle = 0.85 * Math.PI;
      occAngle = startAngle + (oIdx / (occCount - 1)) * (endAngle - startAngle);
    }

    const occX = Math.round(R_OCC * Math.cos(occAngle));
    const occY = Math.round(R_OCC * Math.sin(occAngle));

    const occFitScore = calculateAcademicFit(occ.relevantCourses, completedCodes);
    const isOccSelected = selectedState.occupationId === occ.id;
    const isChildSelected = selectedState.specializationId
      ? occ.specializations.some((s) => s.id === selectedState.specializationId)
      : false;
    const isOccPathActive = isOccSelected || isChildSelected;

    nodes.push({
      id: occ.id,
      name: occ.name,
      englishName: occ.name,
      type: "occupation",
      layer: 3,
      domainId: domain.id,
      x: occX,
      y: occY,
      description: occ.description,
      feasibilityScore: occFitScore,
      academicFitScore: occFitScore,
      practicalSkillScore: 45,
      skills: {
        core: occ.coreSkills,
        supporting: occ.supportingSkills,
      },
      priorityCourses: occ.priorityCourses,
      relevantCourses: occ.relevantCourses.map((c) => ({
        ...c,
        completed: completedCodes.includes(c.code) || Boolean(c.completed),
      })),
      recommendedProjects: occ.recommendedProjects,
    });

    // Edge Domain -> Occupation
    edges.push({
      id: `edge-${domain.id}-${occ.id}`,
      source: domain.id,
      target: occ.id,
      progressPercent: occFitScore,
      isSelected: isOccPathActive,
    });

    // 4. Specializations (Layer 4) branching outward from this Occupation
    const specCount = occ.specializations.length;
    occ.specializations.forEach((spec, sIdx) => {
      // Angular spread centered around parent occupation angle
      const spread = specCount > 1 ? 0.25 : 0;
      const specAngle =
        specCount > 1
          ? occAngle - spread / 2 + (sIdx / (specCount - 1)) * spread
          : occAngle;

      const specX = Math.round(R_SPEC * Math.cos(specAngle));
      const specY = Math.round(R_SPEC * Math.sin(specAngle));

      // Spec feasibility derived from occupation with minor specialization adjustment
      const specScore = Math.max(10, Math.min(100, Math.round(occFitScore * 0.95)));
      const isSpecSelected = selectedState.specializationId === spec.id;

      nodes.push({
        id: spec.id,
        name: spec.name,
        englishName: spec.name,
        type: "specialization",
        layer: 4,
        domainId: domain.id,
        occupationId: occ.id,
        x: specX,
        y: specY,
        description: spec.description,
        feasibilityScore: specScore,
        academicFitScore: specScore,
        practicalSkillScore: 50,
        technologies: spec.technologies,
        skills: {
          core: spec.coreSkills,
          supporting: occ.supportingSkills.slice(0, 3),
        },
        priorityCourses: spec.recommendedCourses,
        recommendedProjects: spec.suggestedProjects,
        skillGaps: spec.skillGaps,
      });

      // Edge Occupation -> Specialization
      edges.push({
        id: `edge-${occ.id}-${spec.id}`,
        source: occ.id,
        target: spec.id,
        progressPercent: specScore,
        isSelected: isSpecSelected,
      });
    });
  });

  return { nodes, edges };
}

/**
 * Backend API integration wrapper.
 * Can be hooked to a real REST endpoint or WebSocket in future backend iterations.
 */
export const careerApiService = {
  async getStudentAcademicRecord(): Promise<StudentAcademicRecord> {
    // Integration point: call backend /api/career/transcript or read localStorage
    try {
      const stored = localStorage.getItem("career_student_record");
      if (stored) {
        return JSON.parse(stored) as StudentAcademicRecord;
      }
    } catch {
      // ignore
    }
    return DEFAULT_STUDENT_RECORD;
  },

  async saveStudentAcademicRecord(record: StudentAcademicRecord): Promise<void> {
    try {
      localStorage.setItem("career_student_record", JSON.stringify(record));
    } catch {
      // ignore
    }
  },
};
