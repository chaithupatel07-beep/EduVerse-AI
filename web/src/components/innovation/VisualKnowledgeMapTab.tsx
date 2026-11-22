import React, { useState, useEffect } from 'react';
import innovationService, {
  KnowledgeMapGraph,
  KnowledgeNode,
  KnowledgeNodeDetail,
} from '../../services/innovationService';
import {
  Compass,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const VisualKnowledgeMapTab: React.FC = () => {
  const [graph, setGraph] = useState<KnowledgeMapGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [nodeDetail, setNodeDetail] = useState<KnowledgeNodeDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      const data = await innovationService.getKnowledgeMap();
      setGraph(data);
      if (data.nodes.length > 0) {
        handleSelectNode(data.nodes[0]);
      }
    } catch (e) {
      console.error('Failed to load knowledge map', e);
    }
  };

  const handleSelectNode = async (node: KnowledgeNode) => {
    setSelectedNode(node);
    setIsLoadingDetail(true);
    try {
      const details = await innovationService.getNodeDetails(node.id);
      setNodeDetail(details);
    } catch (e) {
      console.error('Failed to load node details', e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const getNodeColor = (state: string) => {
    switch (state) {
      case 'mastered':
        return '#10b981'; // emerald-500
      case 'in_progress':
        return '#3b82f6'; // blue-500
      case 'needs_attention':
        return '#f59e0b'; // amber-500
      default:
        return '#94a3b8'; // slate-400
    }
  };

  if (!graph) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
        Loading Visual Curriculum Knowledge Map...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-cyan-800 via-indigo-900 to-slate-950 text-white shadow-xl gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-2">
            <Compass size={14} className="text-cyan-300" />
            <span>Interactive Visual Knowledge Graph</span>
          </div>
          <h2 className="text-2xl font-black">Visual Curriculum Knowledge Map</h2>
          <p className="text-cyan-100 text-xs mt-1 max-w-xl">
            Explore topic dependencies, visualize prerequisite relationships, and identify unlocked
            concepts based on your verified learning telemetry.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Mastered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Needs Attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            <span>Unvisited</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Graph Area */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-4 overflow-hidden relative min-h-[480px]">
          <svg className="w-full h-full min-h-[440px]" viewBox="0 0 650 350">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
              </marker>
            </defs>

            {/* Edges */}
            {graph.edges.map((edge) => {
              const srcNode = graph.nodes.find((n) => n.id === edge.source_node_id);
              const tgtNode = graph.nodes.find((n) => n.id === edge.target_node_id);
              if (!srcNode || !tgtNode) return null;

              return (
                <line
                  key={edge.id}
                  x1={srcNode.pos_x}
                  y1={srcNode.pos_y}
                  x2={tgtNode.pos_x}
                  y2={tgtNode.pos_y}
                  stroke="#475569"
                  strokeWidth="2"
                  strokeDasharray={edge.relationship_type === 'prerequisite' ? 'none' : '4'}
                  markerEnd="url(#arrowhead)"
                  opacity="0.8"
                />
              );
            })}

            {/* Nodes */}
            {graph.nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.mastery_state);

              return (
                <g
                  key={node.id}
                  onClick={() => handleSelectNode(node)}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  {/* Outer selection ring */}
                  {isSelected && (
                    <circle
                      cx={node.pos_x}
                      cy={node.pos_y}
                      r="28"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      className="animate-pulse"
                    />
                  )}

                  {/* Core Node Circle */}
                  <circle
                    cx={node.pos_x}
                    cy={node.pos_y}
                    r="20"
                    fill={color}
                    stroke="#0f172a"
                    strokeWidth="3"
                  />

                  {/* Node Label */}
                  <text
                    x={node.pos_x}
                    y={node.pos_y + 35}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.pos_x}
                    y={node.pos_y + 48}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    className="select-none capitalize"
                  >
                    {node.mastery_state.replace('_', ' ')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Detail & Study Recommendations */}
        <div className="space-y-4">
          {selectedNode ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="border-b pb-3">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase"
                  style={{
                    backgroundColor: `${getNodeColor(selectedNode.mastery_state)}20`,
                    color: getNodeColor(selectedNode.mastery_state),
                  }}
                >
                  {selectedNode.mastery_state.replace('_', ' ')} • {selectedNode.difficulty}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1">{selectedNode.label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedNode.description}</p>
              </div>

              {isLoadingDetail ? (
                <p className="text-xs text-slate-400 py-6 text-center">Loading topic analysis...</p>
              ) : nodeDetail ? (
                <div className="space-y-4 text-xs">
                  {/* Prerequisites */}
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                      Prerequisites
                    </h4>
                    {nodeDetail.prerequisites.length === 0 ? (
                      <p className="text-slate-400 text-[11px]">Foundational concept (No prerequisites required)</p>
                    ) : (
                      <div className="space-y-1.5">
                        {nodeDetail.prerequisites.map((p) => (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800">{p.label}</span>
                            <span className="text-[10px] font-bold text-emerald-600">✓ Completed</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Unlocked Subsequent Topics */}
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                      Unlocked Next Concepts
                    </h4>
                    {nodeDetail.unlocked_topics.length === 0 ? (
                      <p className="text-slate-400 text-[11px]">Terminal advanced concept</p>
                    ) : (
                      <div className="space-y-1.5">
                        {nodeDetail.unlocked_topics.map((u) => (
                          <div
                            key={u.id}
                            className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between"
                          >
                            <span className="font-semibold text-indigo-950">{u.label}</span>
                            <ArrowRight size={13} className="text-indigo-600" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Related Study Materials */}
                  {nodeDetail.related_study_materials && (
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                        Recommended Study Materials
                      </h4>
                      <div className="space-y-1.5">
                        {nodeDetail.related_study_materials.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <BookOpen size={14} className="text-blue-600" />
                              <span className="font-semibold text-slate-800">{m.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{m.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              Click any node in the curriculum graph to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualKnowledgeMapTab;
