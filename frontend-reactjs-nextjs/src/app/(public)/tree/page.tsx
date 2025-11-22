'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getMembers } from '@/lib/api';
import { Member } from '@/types';

// Dynamically import Tree to avoid SSR issues with D3
const Tree = dynamic(() => import('react-d3-tree'), {
    ssr: false,
    loading: () => (
        <p className="text-slate-500">Loading tree visualization...</p>
    ),
});

interface TreeNode {
    name: string;
    attributes?: Record<string, string>;
    children?: TreeNode[];
}

export default function TreePage() {
    const [treeData, setTreeData] = useState<TreeNode | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getMembers({ take: 1000 }); // Fetch all for tree
                const tree = buildTree(response.data);
                setTreeData(tree);
            } catch (error) {
                console.error('Failed to fetch members:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper to build tree from flat list
    const buildTree = (members: Member[]): TreeNode => {
        if (members.length === 0) return { name: 'No Members' };

        // 1. Create a map of id -> node
        const nodeMap = new Map<string, TreeNode>();
        members.forEach((m) => {
            nodeMap.set(m.id, {
                name: m.fullName,
                attributes: {
                    Gender: m.gender,
                    Status: m.isAlive ? 'Alive' : 'Deceased',
                    Branch: m.branch?.name || 'Unknown',
                },
                children: [],
            });
        });

        // 2. Build hierarchy
        const roots: TreeNode[] = [];
        members.forEach((m) => {
            const node = nodeMap.get(m.id)!;
            // If member has a father who is also in the list, add as child
            if (m.father && nodeMap.has(m.father.id)) {
                const fatherNode = nodeMap.get(m.father.id)!;
                fatherNode.children?.push(node);
            }
            // Else if member has a mother who is also in the list, add as child
            // (This is a simplification; real genealogy graphs are DAGs, not simple trees)
            else if (m.mother && nodeMap.has(m.mother.id)) {
                const motherNode = nodeMap.get(m.mother.id)!;
                motherNode.children?.push(node);
            } else {
                // No parents found in list -> treat as root
                roots.push(node);
            }
        });

        // 3. Return a single root wrapper if multiple roots exist
        if (roots.length === 1) return roots[0];
        return {
            name: 'Family Tree',
            children: roots,
        };
    };

    return (
        <div className="h-[calc(100vh-64px)] w-full bg-slate-50">
            {loading ? (
                <div className="flex h-full items-center justify-center">
                    <p className="text-slate-500">Loading family tree...</p>
                </div>
            ) : treeData ? (
                <Tree
                    data={treeData}
                    orientation="vertical"
                    pathFunc="step"
                    translate={{ x: 600, y: 50 }}
                    nodeSize={{ x: 200, y: 100 }}
                    renderCustomNodeElement={(rd3tProps) => (
                        <g>
                            <circle
                                r="15"
                                fill={
                                    rd3tProps.nodeDatum.attributes?.Gender ===
                                    'MALE'
                                        ? '#bfdbfe'
                                        : '#fbcfe8'
                                }
                                stroke="none"
                            />
                            <text
                                fill="black"
                                x="20"
                                dy="-5"
                                strokeWidth="0"
                                style={{ fontSize: '14px', fontWeight: 'bold' }}
                            >
                                {rd3tProps.nodeDatum.name}
                            </text>
                            <text
                                fill="gray"
                                x="20"
                                dy="15"
                                strokeWidth="0"
                                style={{ fontSize: '12px' }}
                            >
                                {rd3tProps.nodeDatum.attributes?.Branch}
                            </text>
                        </g>
                    )}
                />
            ) : (
                <div className="flex h-full items-center justify-center">
                    <p className="text-slate-500">No data available.</p>
                </div>
            )}
        </div>
    );
}
