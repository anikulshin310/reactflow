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
  console.log(nodes);
  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "mrtree",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "50",
      "elk.layered.spacing.nodeNodeBetweenLayers": "50",
      "org.eclipse.elk.portConstraints": "FIXED_ORDER",
    },
    children: children.map((node) => ({
      id: node.id,
      width: 150,
      height: 50,
    })),
    edges: subflowEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  try {
    const layout = await elk.layout(graph);

    return nodes.map((node) => {
      const layoutNode = layout.children?.find((n) => n.id === node.id);
      if (layoutNode && node.parentId === subflowId) {
        console.log(layoutNode);
        return {
          ...node,
          position: {
            x: layoutNode.x || 0,
            y: layoutNode.y || 0,
          },
        };
      }
      return node;
    });
  } catch (err) {
    console.error("ELK layout error:", err);
    return nodes;
  }
};
