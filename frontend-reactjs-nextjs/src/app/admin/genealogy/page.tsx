'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Position,
    ConnectionLineType,
    MarkerType,
    Handle,
    Node,
    Edge,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { getGenealogyTree } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const nodeWidth = 300; // Wider for couples
const nodeHeight = 140; // Base height

// --- COMPONENTS ---

const MemberInfo = ({ data }: { data: any }) => (
    <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-12 w-12 border-2 border-muted shrink-0">
            <AvatarImage src={data.avatarUrl} alt={data.fullName} />
            <AvatarFallback>
                {data.fullName?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
            <span
                className="font-semibold text-sm truncate"
                title={data.fullName}
            >
                {data.fullName}
            </span>
            <div className="flex gap-1 mt-1 flex-wrap">
                {!data.isAlive && (
                    <Badge
                        variant="destructive"
                        className="text-[10px] px-1 h-4"
                    >
                        Mất
                    </Badge>
                )}
                <span className="text-xs text-muted-foreground mr-1">
                    {data.gender === 'MALE' ? 'Nam' : 'Nữ'}
                </span>
                {data.generationIndex && (
                    <span className="text-xs text-muted-foreground">
                        Đời {data.generationIndex}
                    </span>
                )}
            </div>
        </div>
    </div>
);

// Couple Node Component
// Displays one or two people in a single block
const CoupleNode = ({ data, id }: { data: any; id: string }) => {
    const { primary, spouse, onExpand, expanded, hasChildren } = data;

    return (
        <div className="relative group">
            {/* Top Handle - Incoming from Parents */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-slate-400! border-2 border-white dark:border-slate-900"
            />

            <Card
                className={cn(
                    'w-[300px] shadow-sm border hover:border-primary transition-all overflow-hidden bg-white dark:bg-slate-950',
                    expanded ? 'ring-2 ring-primary/20' : '',
                )}
            >
                <CardContent className="p-3 flex flex-col gap-3">
                    {/* Primary Member (Usually Husband/Male) */}
                    <MemberInfo data={primary} />

                    {/* Spouse (if exists) */}
                    {spouse && (
                        <>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
                            <MemberInfo data={spouse} />
                        </>
                    )}
                </CardContent>

                {/* Expand/Collapse Button */}
                {hasChildren && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 text-center">
                        <div className="bg-white dark:bg-slate-950 rounded-full p-0.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 rounded-full border shadow-sm bg-background hover:bg-accent"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onExpand(id, !expanded);
                                }}
                            >
                                {expanded ? (
                                    <Minus className="h-3 w-3" />
                                ) : (
                                    <Plus className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                        {/* Visual indicator line connecting to children if expanded */}
                        {/* Removed manual line, letting ReactFlow edges handle it */}
                    </div>
                )}
            </Card>

            {/* Bottom Handle - Outgoing to Children */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-transparent! border-none" // Hide actual handle, use button visual
                style={{ top: '100%', transform: 'translate(-50%, 10px)' }} // Move down slightly, keep centered
            />
        </div>
    );
};

const nodeTypes = {
    couple: CoupleNode,
};

// --- LAYOUT LOGIC ---

const getLayoutedElements = (
    nodes: Node[],
    edges: Edge[],
    direction = 'TB',
) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    // Use a fixed max height for layout to ensure top-alignment
    // This makes edges entering nodes of the same generation consistent in length
    const maxNodeHeight = 160;

    // Add nodes to dagre
    nodes.forEach((node) => {
        g.setNode(node.id, { width: nodeWidth, height: maxNodeHeight });
    });

    // Add edges to dagre
    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    // Run layout
    dagre.layout(g);

    // Apply positions
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);

        // Handle case where node might not be in graph (unlikely if passed correctly)
        if (!nodeWithPosition) return node;

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                // Align top edge based on the fixed max height used in layout
                y: nodeWithPosition.y - maxNodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

// --- MAIN COMPONENT ---

function GenealogyGraph() {
    const { setCenter } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [loading, setLoading] = useState(true);
    const [centeredInitial, setCenteredInitial] = useState(false);
    const [focusTarget, setFocusTarget] = useState<string | null>(null);

    // Raw data store
    const [rawNodes, setRawNodes] = useState<any[]>([]);
    const [rawEdges, setRawEdges] = useState<any[]>([]);
    const [expansionState, setExpansionState] = useState<
        Record<string, boolean>
    >({}); // NodeId -> isExpanded

    // Process raw data into couple nodes
    const processData = useCallback((apiNodes: any[], apiEdges: any[]) => {
        const coupleMap = new Map<string, any>(); // CoupleId -> { primary, spouse, childrenIds }
        const memberToCoupleId = new Map<string, string>(); // MemberId -> CoupleId

        // 1. Identify Couples
        const visitedMembers = new Set<string>();

        // Sort: Process older generations first to ensure root stability
        const sortedMembers = [...apiNodes].sort(
            (a, b) =>
                (a.data.generationIndex || 0) - (b.data.generationIndex || 0),
        );

        sortedMembers.forEach((member) => {
            if (visitedMembers.has(member.id)) return;

            // Find spouse edge
            const marriageEdge = apiEdges.find(
                (e) =>
                    e.type === 'MARRIED_TO' &&
                    (e.from === member.id || e.to === member.id),
            );

            let spouse = null;
            if (marriageEdge) {
                const spouseId =
                    marriageEdge.from === member.id
                        ? marriageEdge.to
                        : marriageEdge.from;
                spouse = apiNodes.find((n) => n.id === spouseId);
            }

            // Determine Primary (Male prefers, or first found)
            let primary = member;
            let currentSpouse = spouse;

            if (
                spouse &&
                member.data.gender !== 'MALE' &&
                spouse.data.gender === 'MALE'
            ) {
                primary = spouse;
                currentSpouse = member;
            }

            const coupleId = primary.id;

            coupleMap.set(coupleId, {
                id: coupleId,
                primary: primary.data,
                spouse: currentSpouse ? currentSpouse.data : null,
                childrenIds: [],
                generationIndex: primary.data.generationIndex,
            });

            memberToCoupleId.set(primary.id, coupleId);
            visitedMembers.add(primary.id);
            if (currentSpouse) {
                memberToCoupleId.set(currentSpouse.id, coupleId);
                visitedMembers.add(currentSpouse.id);
            }
        });

        // 2. Map Parent Relationships to Couple IDs
        const coupleEdges: { source: string; target: string }[] = [];
        const relationships = new Set<string>(); // To avoid dupes

        apiEdges.forEach((edge) => {
            if (edge.type === 'PARENT_OF') {
                const parentId = edge.from;
                const childId = edge.to;

                const parentCoupleId = memberToCoupleId.get(parentId);
                const childCoupleId = memberToCoupleId.get(childId);

                // Valid edge if both ends exist and are different couples
                if (
                    parentCoupleId &&
                    childCoupleId &&
                    parentCoupleId !== childCoupleId
                ) {
                    const key = `${parentCoupleId}-${childCoupleId}`;
                    if (!relationships.has(key)) {
                        coupleEdges.push({
                            source: parentCoupleId,
                            target: childCoupleId,
                        });
                        relationships.add(key);

                        // Mark parent as having children
                        const parentCouple = coupleMap.get(parentCoupleId);
                        if (parentCouple) {
                            parentCouple.childrenIds.push(childCoupleId);
                        }
                    }
                }
            }
        });

        return {
            couples: Array.from(coupleMap.values()),
            relationships: coupleEdges,
        };
    }, []);

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getGenealogyTree();
                setRawNodes(data.nodes);
                setRawEdges(data.edges);

                // Initialize expansion state:
                // Rule: "Mặc định vẽ 3 đời đầu tiên"
                const initialExpanded: Record<string, boolean> = {};
                data.nodes.forEach((n: any) => {
                    const gen = n.data.generationIndex || 1;
                    if (gen < 3) {
                        initialExpanded[n.id] = true;
                    }
                });
                setExpansionState(initialExpanded);
            } catch (err) {
                console.error('Failed to load tree', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Expand Handler
    const handleExpand = useCallback((nodeId: string, isExpanded: boolean) => {
        setExpansionState((prev) => ({
            ...prev,
            [nodeId]: isExpanded,
        }));
        setFocusTarget(nodeId);
    }, []);

    // Re-calculate graph when expansion state or raw data changes
    useEffect(() => {
        if (rawNodes.length === 0) return;

        const { couples, relationships } = processData(rawNodes, rawEdges);

        // Filter visible nodes/edges based on expansion state

        const visibleNodeIds = new Set<string>();
        // Always add Root nodes (Gen 1)
        const roots = couples.filter((c) => (c.generationIndex || 1) === 1);
        const queue = roots.map((c) => c.id);

        queue.forEach((id) => visibleNodeIds.add(id));

        // BFS to find all visible nodes
        // Expand if parent is expanded
        const workingQueue = [...queue];
        const processed = new Set<string>();

        while (workingQueue.length > 0) {
            const currentId = workingQueue.shift()!;
            if (processed.has(currentId)) continue;
            processed.add(currentId);

            visibleNodeIds.add(currentId);

            // If this node is expanded, add its children to queue to be made visible
            if (expansionState[currentId]) {
                const currentCouple = couples.find((c) => c.id === currentId);
                if (currentCouple && currentCouple.childrenIds) {
                    currentCouple.childrenIds.forEach((childId: string) => {
                        workingQueue.push(childId);
                    });
                }
            }
        }

        const filteredCouples = couples.filter((c) => visibleNodeIds.has(c.id));
        const filteredEdges = relationships.filter(
            (r) => visibleNodeIds.has(r.source) && visibleNodeIds.has(r.target),
        );

        // Convert to React Flow
        const flowNodes: Node[] = filteredCouples.map((c) => ({
            id: c.id,
            type: 'couple',
            draggable: false,
            connectable: false,
            data: {
                primary: c.primary,
                spouse: c.spouse,
                generationIndex: c.generationIndex,
                hasChildren: c.childrenIds.length > 0,
                expanded: !!expansionState[c.id],
                onExpand: handleExpand,
            },
            position: { x: 0, y: 0 },
        }));

        const flowEdges: Edge[] = filteredEdges.map((e, idx) => ({
            id: `e-${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            type: ConnectionLineType.Step,
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        }));

        const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(
            flowNodes,
            flowEdges,
        );

        setNodes(layoutNodes);
        setEdges(layoutEdges);

        // Focus on Root Ancestor (Center View)
        if (!centeredInitial && layoutNodes.length > 0) {
            // Find root node (gen index 1)
            const rootNode = layoutNodes.find(
                (n) => n.data.generationIndex === 1,
            );
            if (rootNode) {
                // Wait slightly for render cycle
                setTimeout(() => {
                    const centerX = rootNode.position.x + nodeWidth / 2;
                    const centerY = rootNode.position.y + nodeHeight / 2;
                    setCenter(centerX, centerY, { zoom: 1, duration: 800 });
                }, 100);
                setCenteredInitial(true);
            }
        }

        // Handle explicit focus (e.g., on expand/collapse)
        if (focusTarget && layoutNodes.length > 0) {
            const targetNode = layoutNodes.find((n) => n.id === focusTarget);
            if (targetNode) {
                setTimeout(() => {
                    const centerX = targetNode.position.x + nodeWidth / 2;
                    const centerY = targetNode.position.y + nodeHeight / 2;
                    setCenter(centerX, centerY, { zoom: 1, duration: 800 });
                }, 100);
                setFocusTarget(null);
            }
        }
    }, [
        rawNodes,
        rawEdges,
        expansionState,
        processData,
        handleExpand,
        setNodes,
        setEdges,
        centeredInitial,
        focusTarget,
        setCenter,
    ]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] w-full bg-slate-50 dark:bg-slate-900">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                // fitView // Removed to prevent zooming out
                className="bg-slate-50 dark:bg-slate-900"
                minZoom={0.1}
                attributionPosition="bottom-right"
                nodesDraggable={false}
            >
                <Controls />
                <Background color="#aaa" gap={16} />
            </ReactFlow>
        </div>
    );
}

export default function GenealogyPage() {
    return (
        <ReactFlowProvider>
            <GenealogyGraph />
        </ReactFlowProvider>
    );
}
