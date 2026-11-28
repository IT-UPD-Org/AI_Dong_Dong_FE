import React, { useState, useMemo, useCallback, useEffect } from "react";
import { RadialCanvas } from "../components/career/RadialCanvas";
import { CareerRightPanel } from "../components/career/CareerRightPanel";
import { NodeDetailModal } from "../components/career/NodeDetailModal";
import {
  CareerNode,
  SelectedCareerState,
} from "../types/careerUniverse";
import {
  buildActiveDomainGraph,
  buildSkeletonGraph,
  StudentAcademicRecord,
} from "../services/careerScoring.service";
import { CAREER_UNIVERSE_CATALOG } from "../data/careerUniverseData";

export function CareerUniversePage() {
  // Desktop breakpoint (lg = 1024px): docked right panel on desktop, overlay drawer (closed by default) on mobile/tablet
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024
  );
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const nextDesktop = window.innerWidth >= 1024;
      setIsDesktop((prev) => {
        if (prev !== nextDesktop) {
          setIsRightPanelOpen(nextDesktop);
        }
        return nextDesktop;
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Selected Career Hierarchy State
  const [selectedState, setSelectedState] = useState<SelectedCareerState>({
    facultyId: "cns-tt",
    majorId: "cntt",
    domainId: null,
    occupationId: null,
    specializationId: null,
  });

  // Focused / Selected Node ID (for canvas camera centering & highlighting)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Modal State: Only opened AFTER camera centering animation completes
  const [modalNode, setModalNode] = useState<CareerNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Student academic record (loaded from localStorage, set by Excel parser)
  const [studentRecord, setStudentRecord] = useState<StudentAcademicRecord | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('career_student_record');
      if (stored) {
        setStudentRecord(JSON.parse(stored) as StudentAcademicRecord);
      }
    } catch {
      // ignore
    }
  }, []);

  // Determine if we are in skeleton state (when NO domain is selected)
  const isSkeleton = !selectedState.domainId;

  // Build Graph Nodes & Edges dynamically
  const { nodes, edges } = useMemo(() => {
    if (isSkeleton) {
      return buildSkeletonGraph(studentRecord);
    }
    return buildActiveDomainGraph(selectedState, studentRecord);
  }, [isSkeleton, selectedState, studentRecord]);

  // Handler: Select Faculty
  const handleSelectFaculty = useCallback((facultyId: string) => {
    setSelectedState((prev) => ({
      ...prev,
      facultyId,
    }));
  }, []);

  // Handler: Select Major
  const handleSelectMajor = useCallback((majorId: string) => {
    setSelectedState((prev) => ({
      ...prev,
      majorId,
    }));
  }, []);

  // Handler: Select Domain (Mandatory selection)
  const handleSelectDomain = useCallback((domainId: string) => {
    setSelectedState((prev) => ({
      ...prev,
      domainId,
      occupationId: null,
      specializationId: null,
    }));
    setSelectedNodeId(domainId);
  }, []);

  // Handler: Select Occupation (Optional)
  const handleSelectOccupation = useCallback((occupationId: string | null) => {
    setSelectedState((prev) => ({
      ...prev,
      occupationId,
      specializationId: null, // Reset specialization when occupation changes
    }));
    if (occupationId) {
      setSelectedNodeId(occupationId);
    } else if (selectedState.domainId) {
      setSelectedNodeId(selectedState.domainId);
    }
  }, [selectedState.domainId]);

  // Handler: Select Specialization (Optional)
  const handleSelectSpecialization = useCallback(
    (specializationId: string | null) => {
      setSelectedState((prev) => ({
        ...prev,
        specializationId,
      }));
      if (specializationId) {
        setSelectedNodeId(specializationId);
      } else if (selectedState.occupationId) {
        setSelectedNodeId(selectedState.occupationId);
      }
    },
    [selectedState.occupationId]
  );

  // Handler: User clicks a node directly on the radial canvas
  const handleSelectNodeFromCanvas = useCallback(
    (node: CareerNode) => {
      setSelectedNodeId(node.id);

      if (node.type === "domain") {
        setSelectedState((prev) => ({
          ...prev,
          domainId: node.domainId || node.id,
          occupationId: null,
          specializationId: null,
        }));
      } else if (node.type === "occupation") {
        setSelectedState((prev) => ({
          ...prev,
          domainId: node.domainId || prev.domainId,
          occupationId: node.id,
          specializationId: null,
        }));
      } else if (node.type === "specialization") {
        setSelectedState((prev) => ({
          ...prev,
          domainId: node.domainId || prev.domainId,
          occupationId: node.occupationId || prev.occupationId,
          specializationId: node.id,
        }));
      }
    },
    []
  );

  // Handler: Triggered only AFTER camera centering finishes
  const handleNodeCenteredAndOpenModal = useCallback((node: CareerNode) => {
    setModalNode(node);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Note: Do NOT reset camera or selectedNodeId, allow user to keep exploring
  }, []);

  // Handler: Full Career Tree reset (returns to skeleton overview while preserving faculty/major/transcript)
  const handleResetTree = useCallback(() => {
    setSelectedState((prev) => ({
      ...prev,
      domainId: null,
      occupationId: null,
      specializationId: null,
    }));
    setSelectedNodeId(null);
    setIsModalOpen(false);
    setModalNode(null);
  }, []);

  return (
    <div className="relative flex h-full w-full min-h-0 min-w-0 overflow-hidden bg-background">
      {/* 1. Main Canvas Area */}
      <div className="relative flex-1 min-h-0 min-w-0 h-full overflow-hidden">
        <RadialCanvas
          nodes={nodes}
          edges={edges}
          selectedState={selectedState}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNodeFromCanvas}
          onNodeCenteredAndOpenModal={handleNodeCenteredAndOpenModal}
          onReset={handleResetTree}
          isSkeleton={isSkeleton}
        />
      </div>

      {/* 2. Right Collapsible Sub-Sidebar (docked on lg+, overlay slide-over drawer on mobile/tablet) */}
      <CareerRightPanel
        isOpen={isRightPanelOpen}
        isDesktop={isDesktop}
        onToggleOpen={() => setIsRightPanelOpen((prev) => !prev)}
        onClose={() => setIsRightPanelOpen(false)}
        selectedState={selectedState}
        onSelectFaculty={handleSelectFaculty}
        onSelectMajor={handleSelectMajor}
        onSelectDomain={handleSelectDomain}
        onSelectOccupation={handleSelectOccupation}
        onSelectSpecialization={handleSelectSpecialization}
        onUpdateStudentRecord={setStudentRecord}
      />

      {/* 3. Node Information Modal (Opens only after centering) */}
      <NodeDetailModal
        node={modalNode}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default CareerUniversePage;
