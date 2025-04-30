import { Node } from "@xyflow/react";

export const rearrangeSubflows = (nodes: Node[], currentNode: Node, subflowId: string) => {
  const subflows = nodes.filter(({ type }) => type === "subflow");
  const sortedSubflows = [...subflows].sort((a, b) => a.position.x - b.position.x);
  
  return nodes.map(node => {
    if (node.type !== "subflow") {
      // Для дочерних узлов сохраняем относительное положение
      if (node.parentId === subflowId) {
        const parentNode = nodes.find(n => n.id === subflowId);
        if (parentNode) {
          const relativeX = node.position.x / (Number(parentNode.style?.width) || 1);
          const relativeY = node.position.y / (Number(parentNode.style?.height) || 1);
          
          return {
            ...node,
            position: {
              x: relativeX * (Number(currentNode.style?.width) || 1),
              y: relativeY * (Number(currentNode.style?.height) || 1),
            },
          };
        }
      }
      return node;
    }
    
    const subflowIndex = sortedSubflows.findIndex(s => s.id === node.id);
    if (subflowIndex === 0) {
      return {
        ...node,
        position: {
          x: 0,
          y: currentNode.position.y
        }
      };
    }
    
    const prevSubflow = sortedSubflows[subflowIndex - 1];
    const prevWidth = typeof prevSubflow.style?.width === 'number' 
      ? prevSubflow.style.width 
      : parseInt(prevSubflow.style?.width as string) || 0;
    
    return {
      ...node,
      position: {
        x: prevSubflow.position.x + prevWidth,
        y: currentNode.position.y
      }
    };
  });
};

export const updateSubflowSize = (
  nodes: Node[],
  subflowId: string,
  width?: number,
  height?: number
) => {
  return nodes.map(node => {
    if (node.id === subflowId) {
      return {
        ...node,
        style: {
          ...node.style,
          ...(width !== undefined && { width }),
          ...(height !== undefined && { height }),
        },
      };
    }
    return node;
  });
};

export const updateAllSubflowsHeight = (nodes: Node[], height: number) => {
  return nodes.map(node => {
    if (node.type === "subflow") {
      return {
        ...node,
        style: {
          ...node.style,
          height,
        },
      };
    }
    return node;
  });
}; 