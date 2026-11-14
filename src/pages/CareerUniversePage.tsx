import React, { useState, useMemo, useCallback } from "react";
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
} from "../services/careerScoring.service";
import { CAREER_UNIVERSE_CATALOG } from "../data/careerUniverseData";

export function CareerUniversePage() {
  // Right Panel Collapse State (expanded by default on desktop)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Selected Career Hierarchy State
  const [selectedState, setSelectedState] = useState<SelectedCareerState>({
    domainId: null,
    occupationId: null,
    specializationId: null,
  });

  // Focused / Selected Node ID (for canvas camera centering & highlighting)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Modal State: Only opened AFTER camera centering animation completes
  const [modalNode, setModalNode] = useState<CareerNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine if we are in skeleton state (when NO domain is selected)
  const isSkeleton = !selectedState.domainId;

  // Build Graph Nodes & Edges dynamically
  const { nodes, edges } = useMemo(() => {
    if (isSkeleton) {
      return buildSkeletonGraph();
    }
    return buildActiveDomainGraph(selectedState);
  }, [isSkeleton, selectedState]);

  // Handler: Select Domain (Mandatory selection)
  const handleSelectDomain = useCallback((domainId: string) => {
    setSelectedState({
      domainId,
      occupationId: null,
      specializationId: null,
    });
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
        setSelectedState({
          domainId: node.domainId || node.id,
          occupationId: null,
          specializationId: null,
        });
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

  return (
    <div className="relative flex h-full w-full min-w-0 overflow-hidden bg-background">
      {/* 1. Main Canvas Area */}
      <div className="relative flex-1 min-w-0 h-full overflow-hidden">
        <RadialCanvas
          nodes={nodes}
          edges={edges}
          selectedState={selectedState}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNodeFromCanvas}
          onNodeCenteredAndOpenModal={handleNodeCenteredAndOpenModal}
          isSkeleton={isSkeleton}
        />
      </div>

      {/* 2. Right Collapsible Sub-Sidebar */}
      <CareerRightPanel
        isOpen={isRightPanelOpen}
        onToggleOpen={() => setIsRightPanelOpen((prev) => !prev)}
        selectedState={selectedState}
        onSelectDomain={handleSelectDomain}
        onSelectOccupation={handleSelectOccupation}
        onSelectSpecialization={handleSelectSpecialization}
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
