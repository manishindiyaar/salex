import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  Edge,
  ReactFlowInstance,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, Play, Upload, Wand2 } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { FlowDefinition, FlowNode, FlowEdge, EdgeCondition } from '@/api/flows';
import { adminFlowsApi } from '@/api/adminFlows';
import {
  NodePalette,
  NodeConfigPanel,
  EdgeConditionEditor,
  ReadinessChecklist,
  SimulatorPanel,
  MessageNode,
  QuestionNode,
  ServicePickerNode,
  StaffPickerNode,
  TimePickerNode,
  ConfirmationNode,
  BookingNode,
} from '@/components/flow';

// Map node type strings to React Flow custom node components
const nodeTypes = {
  message: MessageNode,
  question: QuestionNode,
  service_picker: ServicePickerNode,
  staff_picker: StaffPickerNode,
  time_picker: TimePickerNode,
  confirmation: ConfirmationNode,
  booking: BookingNode,
};

// Default labels for new nodes
const NODE_LABELS: Record<string, string> = {
  message: 'Message',
  question: 'Question',
  service_picker: 'Service Picker',
  staff_picker: 'Staff Picker',
  time_picker: 'Time Picker',
  confirmation: 'Confirmation',
  booking: 'Booking',
};

let nodeIdCounter = 0;
function generateNodeId(): string {
  nodeIdCounter += 1;
  return `node_${Date.now()}_${nodeIdCounter}`;
}

/**
 * Convert a FlowDefinition (API format) to React Flow nodes/edges.
 */
function definitionToReactFlow(definition: FlowDefinition) {
  const nodes: Node[] = definition.nodes.map((n, idx) => ({
    id: n.id,
    type: n.type,
    position: (n.config as Record<string, unknown>)?.position as { x: number; y: number } || { x: 250, y: idx * 150 },
    data: {
      label: (n.config as Record<string, unknown>)?.label || NODE_LABELS[n.type] || n.type,
      config: n.config,
      isEntry: n.id === definition.entryNodeId,
    },
  }));

  const edges: Edge[] = definition.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    animated: !!e.condition,
    style: e.condition ? { stroke: '#E67E22' } : undefined,
    data: { condition: e.condition },
  }));

  return { nodes, edges };
}

/**
 * Convert React Flow nodes/edges back to a FlowDefinition (API format).
 */
function reactFlowToDefinition(nodes: Node[], edges: Edge[]): FlowDefinition {
  const entryNode = nodes.find((n) => n.data.isEntry) || nodes[0];

  const flowNodes: FlowNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type as FlowNode['type'],
    config: {
      ...((n.data.config as Record<string, unknown>) || {}),
      label: n.data.label,
      position: n.position,
    },
  }));

  const flowEdges: FlowEdge[] = edges.map((e) => ({
    id: e.id,
    from: e.source,
    to: e.target,
    condition: (e.data?.condition as EdgeCondition) || undefined,
  }));

  return {
    entryNodeId: entryNode?.id || '',
    nodes: flowNodes,
    edges: flowEdges,
  };
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

/**
 * Generates a complete default booking flow with all nodes positioned,
 * edges connected with proper conditions, and variables pre-configured.
 * This is the standard Salex booking flow: Greeting → Service Picker → Time Picker → Confirmation → Booking
 */
function generateDefaultBookingFlow(): { nodes: Node[]; edges: Edge[]; name: string } {
  const nodes: Node[] = [
    {
      id: 'greeting',
      type: 'message',
      position: { x: 250, y: 0 },
      data: {
        label: 'Welcome Message',
        config: {
          text: '👋 Welcome to {{business.name}}!\n\nI can help you book an appointment. Let me show you our available services.',
          label: 'Welcome Message',
          position: { x: 250, y: 0 },
        },
        isEntry: true,
      },
    },
    {
      id: 'service_selection',
      type: 'service_picker',
      position: { x: 250, y: 160 },
      data: {
        label: 'Choose Service',
        config: {
          header: '📋 {{business.name}}',
          body: 'Select a service to book:',
          buttonLabel: 'View Services',
          noServicesMessage: '😔 No services available at the moment.\n\nPlease try again later.',
          label: 'Choose Service',
          position: { x: 250, y: 160 },
        },
        isEntry: false,
      },
    },
    {
      id: 'time_selection',
      type: 'time_picker',
      position: { x: 250, y: 320 },
      data: {
        label: 'Pick Time',
        config: {
          parityMode: 'legacy',
          durationField: 'totalDuration',
          header: '⏰ Select Time',
          noSlotsText: 'No slots available right now. Please try again later or contact the business directly.',
          daysAhead: 7,
          startHour: 9,
          endHour: 18,
          durationMinutes: 30,
          maxSlots: 8,
          label: 'Pick Time',
          position: { x: 250, y: 320 },
        },
        isEntry: false,
      },
    },
    {
      id: 'confirmation',
      type: 'confirmation',
      position: { x: 250, y: 480 },
      data: {
        label: 'Confirm Booking',
        config: {
          header: '✅ Confirm Booking',
          confirmLabel: '✅ Confirm',
          cancelLabel: '❌ Cancel',
          text: '📍 {{business.name}}\n🧴 {{selectedService.name}}\n⏰ {{selectedTime}}\n💰 ₹{{selectedService.price}}\n\nConfirm your booking?',
          label: 'Confirm Booking',
          position: { x: 250, y: 480 },
        },
        isEntry: false,
      },
    },
    {
      id: 'booking',
      type: 'booking',
      position: { x: 250, y: 640 },
      data: {
        label: 'Finalize Booking',
        config: {
          summaryHeader: '🎉 Booking Confirmed!',
          label: 'Finalize Booking',
          position: { x: 250, y: 640 },
        },
        isEntry: false,
      },
    },
  ];

  const edges: Edge[] = [
    // greeting → service_selection (fallback, auto-advance from message node)
    {
      id: 'e1',
      source: 'greeting',
      target: 'service_selection',
      data: { condition: undefined },
    },
    // service_selection → time_selection (fallback after selection)
    {
      id: 'e2',
      source: 'service_selection',
      target: 'time_selection',
      data: { condition: undefined },
    },
    // time_selection → confirmation (fallback after slot choice)
    {
      id: 'e3',
      source: 'time_selection',
      target: 'confirmation',
      data: { condition: undefined },
    },
    // confirmation → booking (conditional: customer confirmed)
    {
      id: 'e4',
      source: 'confirmation',
      target: 'booking',
      animated: true,
      style: { stroke: '#E67E22' },
      data: { condition: { field: 'responses.confirmation', operator: 'eq', value: 'confirm' } },
    },
    // confirmation → time_selection (conditional: hold expired)
    {
      id: 'e5',
      source: 'confirmation',
      target: 'time_selection',
      animated: true,
      style: { stroke: '#E67E22' },
      data: { condition: { field: 'responses.confirmation', operator: 'eq', value: 'expired' } },
    },
    // confirmation → service_selection (fallback: cancel)
    {
      id: 'e6',
      source: 'confirmation',
      target: 'service_selection',
      data: { condition: undefined },
    },
  ];

  return { nodes, edges, name: 'Default Booking Flow' };
}

export const FlowEditorPage: React.FC = () => {
  const { businessId, id } = useParams<{ businessId: string; id: string }>();
  const navigate = useNavigate();
  const { currentFlow, setCurrentFlow, isSaving, error } = useFlowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [flowName, setFlowName] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [canPublish, setCanPublish] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingFlow, setIsLoadingFlow] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Load existing flow if editing (using admin endpoint)
  useEffect(() => {
    if (id && id !== 'new' && businessId) {
      setIsLoadingFlow(true);
      adminFlowsApi
        .getFlow(businessId, id)
        .then((flow) => {
          setCurrentFlow(flow);
          setIsLoadingFlow(false);
        })
        .catch(() => {
          setIsLoadingFlow(false);
        });
    } else {
      setCurrentFlow(null);
    }
  }, [id, businessId, setCurrentFlow]);

  // Populate canvas from loaded flow
  useEffect(() => {
    if (currentFlow && id !== 'new') {
      setFlowName(currentFlow.name);
      const { nodes: rfNodes, edges: rfEdges } = definitionToReactFlow(
        currentFlow.definition
      );
      setNodes(rfNodes);
      setEdges(rfEdges);
    }
  }, [currentFlow, id, setNodes, setEdges]);

  // Custom node types memo
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `edge_${Date.now()}`,
            data: { condition: undefined },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Handle drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: generateNodeId(),
        type,
        position,
        data: {
          label: NODE_LABELS[type] || type,
          config: { text: '' },
          isEntry: nodes.length === 0,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, nodes.length, setNodes]
  );

  // Update node data from config panel
  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return { ...n, data };
          }
          // If the updated node is being set as entry, unset all others
          if (data.isEntry) {
            return { ...n, data: { ...n.data, isEntry: false } };
          }
          return n;
        })
      );
      setSelectedNode((prev) =>
        prev?.id === nodeId ? { ...prev, data } : prev
      );
    },
    [setNodes]
  );

  // Delete node
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  // Update edge condition
  const handleEdgeConditionUpdate = useCallback(
    (edgeId: string, condition: EdgeCondition | undefined) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId
            ? {
                ...e,
                animated: !!condition,
                style: condition ? { stroke: '#E67E22' } : undefined,
                data: { ...e.data, condition },
              }
            : e
        )
      );
      setSelectedEdge((prev) =>
        prev?.id === edgeId
          ? { ...prev, data: { ...prev.data, condition }, animated: !!condition }
          : prev
      );
    },
    [setEdges]
  );

  // Delete edge
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      setSelectedEdge(null);
    },
    [setEdges]
  );

  // Save Draft — calls admin endpoint (always enabled)
  const handleSaveDraft = useCallback(async () => {
    if (!businessId || !flowName.trim()) {
      setSaveMessage(!businessId ? 'Missing business context' : 'Please enter a flow name');
      return;
    }

    if (nodes.length === 0) {
      setSaveMessage('Add at least one node before saving');
      return;
    }

    const definition = reactFlowToDefinition(nodes, edges);
    setIsSavingDraft(true);

    try {
      if (id && id !== 'new' && currentFlow) {
        // Update existing flow via admin endpoint
        const flow = await adminFlowsApi.updateFlow(businessId, currentFlow.id, {
          name: flowName,
          definition,
        });
        setCurrentFlow(flow);
        setSaveMessage(`Draft saved (v${flow.version})`);
      } else {
        // Create new flow via admin endpoint
        const flow = await adminFlowsApi.createFlow(businessId, {
          name: flowName,
          definition,
        });
        setCurrentFlow(flow);
        setSaveMessage('Draft created');
        // Navigate to the edit URL so subsequent saves update
        navigate(`/businesses/${businessId}/flows/${flow.id}/edit`, { replace: true });
      }

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      const message = err.response?.data?.error?.message
        || err.response?.data?.message
        || 'Failed to save draft';
      setSaveMessage(message);
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSavingDraft(false);
    }
  }, [flowName, nodes, edges, id, currentFlow, businessId, navigate, setCurrentFlow]);

  // Publish — calls admin publish endpoint (disabled when readiness fails)
  const handlePublish = useCallback(async () => {
    if (!currentFlow || !businessId) {
      setSaveMessage('Save the flow as a draft first');
      return;
    }

    setIsPublishing(true);
    try {
      const flow = await adminFlowsApi.publishFlow(businessId, currentFlow.id);
      setCurrentFlow(flow);
      setSaveMessage('Flow published successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      const message = err.response?.data?.error?.message
        || err.response?.data?.message
        || 'Failed to publish flow';
      setSaveMessage(message);
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsPublishing(false);
    }
  }, [currentFlow, businessId, setCurrentFlow]);

  // Simulate — opens simulator slide-over panel (requires saved flow)
  const handleSimulate = useCallback(() => {
    if (!currentFlow) {
      setSaveMessage('Please save the flow as a draft first before simulating');
      setTimeout(() => setSaveMessage(null), 4000);
      return;
    }
    setShowSimulator(true);
  }, [currentFlow]);

  // Readiness callback
  const handleReadinessChange = useCallback((ready: boolean) => {
    setCanPublish(ready);
  }, []);

  // Generate default booking flow — pre-populates the canvas with a complete flow
  const handleGenerateDefault = useCallback(() => {
    const { nodes: defaultNodes, edges: defaultEdges, name } = generateDefaultBookingFlow();
    setNodes(defaultNodes);
    setEdges(defaultEdges);
    if (!flowName) {
      setFlowName(name);
    }
    setSaveMessage('Default booking flow generated! You can now edit any node.');
    setTimeout(() => setSaveMessage(null), 4000);
  }, [flowName, setNodes, setEdges]);

  // Redirect to /businesses if no businessId in route
  if (!businessId) {
    return <Navigate to="/businesses" replace />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: '#F0EFEE', background: '#FCFCFA' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/businesses/${businessId}/flows`)}
            className="p-1.5 rounded-salex-md hover:bg-[#F5F3F1] transition-colors"
          >
            <ArrowLeft size={16} style={{ color: '#6F6D7A' }} />
          </button>
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="font-serif text-[18px] bg-transparent border-none focus:outline-none min-w-[200px]"
            style={{ color: '#03031F' }}
            placeholder="Untitled Flow"
          />
          {currentFlow && id !== 'new' && (
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#F5F3F1]"
              style={{ color: '#A8A6B0' }}
            >
              v{currentFlow.version}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {(saveMessage || error) && (
            <span
              className="text-[12px] font-medium animate-fade-in"
              style={{ color: error ? '#C62020' : '#12A36D' }}
            >
              {error || saveMessage}
            </span>
          )}

          {/* Save Draft button — always enabled */}
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSaving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-salex-md font-sans font-semibold text-[13px] border border-[#E0DFDE] bg-white text-[#03031F] hover:bg-[#F5F3F1] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            {isSavingDraft ? (
              <span className="spinner" style={{ width: 14, height: 14 }} />
            ) : (
              <Save size={14} />
            )}
            Save Draft
          </button>

          {/* Simulate button */}
          <button
            onClick={handleSimulate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-salex-md font-sans font-semibold text-[13px] border border-[#E0DFDE] bg-white text-[#03031F] hover:bg-[#F5F3F1] active:scale-[0.98] transition-all duration-150"
          >
            <Play size={14} />
            Simulate
          </button>

          {/* Publish button — disabled when readiness fails */}
          <button
            onClick={handlePublish}
            disabled={!canPublish || isPublishing || !currentFlow}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-salex-md font-sans font-semibold text-[13px] bg-[#03031F] text-white hover:bg-[#1a1a3a] active:scale-[0.98] disabled:bg-[#C9C7CF] disabled:cursor-not-allowed transition-all duration-150"
            title={!canPublish ? 'Business readiness checks must pass before publishing' : undefined}
          >
            {isPublishing ? (
              <span className="spinner" style={{ width: 14, height: 14 }} />
            ) : (
              <Upload size={14} />
            )}
            Publish
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Node Palette + Readiness */}
        <aside className="w-[220px] flex-shrink-0 border-r border-[#F0EFEE] bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <NodePalette className="!w-full !border-0" />
          </div>
          <ReadinessChecklist
            businessId={businessId}
            onReadinessChange={handleReadinessChange}
          />
        </aside>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          {isLoadingFlow ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="spinner" style={{ width: 24, height: 24 }} />
                <span className="text-[12px]" style={{ color: '#A8A6B0' }}>Loading flow…</span>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onInit={setReactFlowInstance}
              nodeTypes={memoizedNodeTypes}
              fitView
              deleteKeyCode="Delete"
              className="bg-[#FAFAF9]"
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E0DFDE" />
              <Controls
                className="!border-[#F0EFEE] !rounded-salex-md !shadow-sm"
                showInteractive={false}
              />
              <MiniMap
                className="!border-[#F0EFEE] !rounded-salex-md !shadow-sm"
                nodeColor={(node) => {
                  const colors: Record<string, string> = {
                    message: '#0088CC',
                    question: '#9C7A4A',
                    service_picker: '#12A36D',
                    staff_picker: '#7C3AED',
                    time_picker: '#E67E22',
                    confirmation: '#2563EB',
                    booking: '#C62020',
                  };
                  return colors[node.type || ''] || '#6F6D7A';
                }}
                maskColor="rgba(252, 252, 250, 0.7)"
              />

              {/* Empty state: Generate Default Flow button */}
              {nodes.length === 0 && !isLoadingFlow && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="flex flex-col items-center gap-4 pointer-events-auto bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-[#E8E6E3]">
                    <div className="w-14 h-14 rounded-full bg-[#F5F3F1] flex items-center justify-center">
                      <Wand2 size={24} style={{ color: '#03031F' }} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-serif text-[18px]" style={{ color: '#03031F' }}>
                        Start with a template
                      </h3>
                      <p className="text-[13px] mt-1 max-w-[280px]" style={{ color: '#6F6D7A' }}>
                        Generate a complete booking flow with greeting, service selection, time picker, confirmation, and booking — all pre-configured with variables.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateDefault}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-salex-md font-sans font-semibold text-[14px] bg-[#03031F] text-white hover:bg-[#1a1a3a] active:scale-[0.98] transition-all duration-150"
                    >
                      <Wand2 size={16} />
                      Generate Default Booking Flow
                    </button>
                    <p className="text-[11px]" style={{ color: '#A8A6B0' }}>
                      Or drag nodes from the left panel to build from scratch
                    </p>
                  </div>
                </div>
              )}
            </ReactFlow>
          )}
        </div>

        {/* Config Panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
            onClose={() => setSelectedNode(null)}
            businessId={businessId}
          />
        )}

        {/* Edge Condition Editor */}
        {selectedEdge && (
          <EdgeConditionEditor
            edge={selectedEdge}
            onUpdate={handleEdgeConditionUpdate}
            onDelete={handleEdgeDelete}
            onClose={() => setSelectedEdge(null)}
          />
        )}

        {/* Simulator slide-over panel */}
        {showSimulator && currentFlow && (
          <SimulatorPanel
            businessId={businessId}
            flowId={currentFlow.id}
            onClose={() => setShowSimulator(false)}
          />
        )}
      </div>
    </div>
  );
};
