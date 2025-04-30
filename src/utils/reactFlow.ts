import { Edge, Node } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";

export const applyElkLayout = async (
  nodes: Node[],
  edges: Edge[],
  subflowId: string
) => {
  const elk = new ELK();
  const children = nodes;
  const subflowEdges = edges.filter(
    (e) =>
      children.some((n) => n.id === e.source) &&
      children.some((n) => n.id === e.target)
  );

  // Get the subflow node to calculate its dimensions
  const subflowNode = nodes.find((n) => n.id === subflowId);
  if (!subflowNode) return nodes;

  // Find OR nodes and their connections
  const orNodes = children.filter(
    (node) => node.type === "or" && node.parentId === subflowId
  );

  // Group nodes by their connections
  const nodeGroups = new Map<string, Set<string>>();
  subflowEdges.forEach((edge) => {
    if (!nodeGroups.has(edge.source)) {
      nodeGroups.set(edge.source, new Set());
    }
    if (!nodeGroups.has(edge.target)) {
      nodeGroups.set(edge.target, new Set());
    }
    nodeGroups.get(edge.source)?.add(edge.target);
    nodeGroups.get(edge.target)?.add(edge.source);
  });

  // Find nodes that should be on the same level (connected to OR)
  const sameLevelNodes = new Set<string>();
  orNodes.forEach((orNode) => {
    const connectedNodes = nodeGroups.get(orNode.id) || new Set();
    connectedNodes.forEach((nodeId) => {
      sameLevelNodes.add(nodeId);
    });
  });

  // Find vertically connected nodes and their levels
  const nodeLevels = new Map<string, number>();
  const verticalConnections = new Map<string, string>();

  // First pass: identify all vertical connections
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (sourceNode && targetNode) {
      verticalConnections.set(edge.target, edge.source);
    }
  });

  // Second pass: calculate levels for each node
  const calculateNodeLevel = (
    nodeId: string,
    visited = new Set<string>()
  ): number => {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const parentId = verticalConnections.get(nodeId);
    if (!parentId) {
      nodeLevels.set(nodeId, 0);
      return 0;
    }

    const parentLevel = calculateNodeLevel(parentId, visited);
    const currentLevel = parentLevel + 1;
    nodeLevels.set(nodeId, currentLevel);
    return currentLevel;
  };

  // Calculate levels for all nodes
  nodes.forEach((node) => {
    if (!nodeLevels.has(node.id)) {
      calculateNodeLevel(node.id);
    }
  });

  // Group nodes by their levels
  const nodesByLevel = new Map<number, Node[]>();
  children.forEach((node) => {
    if (node.parentId === subflowId) {
      const level = nodeLevels.get(node.id) || 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)?.push(node);
    }
  });

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "mrtree",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "50",
      "elk.layered.spacing.nodeNodeBetweenLayers": "150",
      "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      "elk.layered.spacing.edgeNodeBetweenLayers": "150",
      "elk.layered.spacing.baseValue": "150",
    },
    children: children.map((node) => ({
      id: node.id,
      width: node.width || 150,
      height: node.height || 50,
    })),
    edges: subflowEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  try {
    const layout = await elk.layout(graph);

    // Calculate the center offset for the subflow
    let subflowWidth = Number(subflowNode.style?.width) || 400;
    const headerHeight = 50;
    const levelStep = 150; // Fixed step between levels

    // Update node positions
    return nodes.map((node) => {
      if (node.id === subflowId) {
        return {
          ...node,
          style: {
            ...node.style,
            width: subflowWidth,
          },
        };
      }

      if (node.parentId !== subflowId) return node;

      const level = nodeLevels.get(node.id) || 0;
      const levelNodes = nodesByLevel.get(level) || [];
      const yPosition = headerHeight + level * levelStep;

      // If node is connected to OR, place it on the same level as other connected nodes
      if (sameLevelNodes.has(node.id)) {
        const orNode = orNodes.find((or) =>
          nodeGroups.get(or.id)?.has(node.id)
        );
        if (orNode) {
          // Find all edges connected to this OR node
          const orEdges = subflowEdges.filter(
            (edge) => edge.source === orNode.id || edge.target === orNode.id
          );

          // Get all connected nodes
          const connectedNodes = Array.from(nodeGroups.get(orNode.id) || [])
            .map((id) => nodes.find((n) => n.id === id))
            .filter(Boolean) as Node[];

          // Determine connection direction for each node
          const leftNodes: Node[] = [];
          const rightNodes: Node[] = [];

          connectedNodes.forEach((connectedNode) => {
            const edge = orEdges.find(
              (e) =>
                e.source === connectedNode.id || e.target === connectedNode.id
            );
            if (edge) {
              // Determine direction based on handles
              if (edge.source === orNode.id) {
                // If OR is source, check sourceHandle
                if (edge.sourceHandle === "left") {
                  rightNodes.push(connectedNode);
                } else {
                  leftNodes.push(connectedNode);
                }
              } else {
                // If OR is target, check targetHandle
                if (edge.targetHandle === "left") {
                  rightNodes.push(connectedNode);
                } else {
                  leftNodes.push(connectedNode);
                }
              }
            }
          });

          // Calculate total width needed
          const orNodeWidth = orNode.width || 150;
          const spacing = 50;
          const leftTotalWidth = leftNodes.reduce(
            (sum, n) => sum + (n.width || 150),
            0
          );
          const rightTotalWidth = rightNodes.reduce(
            (sum, n) => sum + (n.width || 150),
            0
          );
          const totalWidth =
            leftTotalWidth +
            rightTotalWidth +
            orNodeWidth +
            spacing * (leftNodes.length + rightNodes.length);

          // Resize subflow if needed
          if (totalWidth > subflowWidth) {
            subflowWidth = totalWidth + 100; // Add some padding
          }

          // Position OR node in the center
          const orNodeX = (subflowWidth - orNodeWidth) / 2;

          // Position left nodes
          let currentX = orNodeX - leftTotalWidth - spacing * leftNodes.length;
          for (const n of leftNodes) {
            if (n.id === node.id) {
              return {
                ...node,
                position: {
                  x: currentX,
                  y: yPosition,
                },
              };
            }
            currentX += (n.width || 150) + spacing;
          }

          // Position right nodes
          currentX = orNodeX + orNodeWidth + spacing;
          for (const n of rightNodes) {
            if (n.id === node.id) {
              return {
                ...node,
                position: {
                  x: currentX,
                  y: yPosition,
                },
              };
            }
            currentX += (n.width || 150) + spacing;
          }
        }
      }

      // For vertically connected nodes, align with parent
      const parentId = verticalConnections.get(node.id);
      if (parentId) {
        const parentNode = nodes.find((n) => n.id === parentId);
        if (parentNode) {
          // For nodes connected within the same subflow, align with parent
          return {
            ...node,
            position: {
              x: parentNode.position.x,
              y: yPosition,
            },
          };
        }
      }

      // For other nodes, distribute them evenly on their level
      if (levelNodes.length === 1) {
        // Center single block in the subflow
        return {
          ...node,
          position: {
            x: (subflowWidth - (node.width || 150)) / 2,
            y: yPosition,
          },
        };
      }

      // Calculate positions for multiple nodes on the same level
      const nodeWidth = node.width || 150;
      const spacing = 50; // Fixed spacing between nodes

      // Calculate total width of all nodes and spacing
      const totalWidth = levelNodes.reduce(
        (sum, n) => sum + (n.width || 150),
        0
      );
      const totalSpacing = spacing * (levelNodes.length - 1);
      const totalGroupWidth = totalWidth + totalSpacing;

      // Calculate start position to center the group
      const groupStart = (subflowWidth - totalGroupWidth) / 2;

      // Find current node's index
      const nodeIndex = levelNodes.findIndex((n) => n.id === node.id);

      // Calculate width of all previous nodes
      const previousWidth = levelNodes
        .slice(0, nodeIndex)
        .reduce((sum, n) => sum + (n.width || 150), 0);

      // Calculate position
      const x = groupStart + previousWidth + spacing * nodeIndex;

      return {
        ...node,
        position: {
          x,
          y: yPosition,
        },
      };
    });
  } catch (err) {
    console.error("ELK layout error:", err);
    return nodes;
  }
};
