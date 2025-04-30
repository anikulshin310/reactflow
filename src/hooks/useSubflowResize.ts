import { useState, useCallback } from "react";
import { useReactFlow, Node } from "@xyflow/react";
import { rearrangeSubflows, updateSubflowSize, updateAllSubflowsHeight } from "../utils/subflowUtils";

export const useSubflowResize = (subflowId: string) => {
  const { getNodes, setNodes } = useReactFlow();
  const [initialX, setInitialX] = useState<number>();
  const [newX, setNewX] = useState<number>();
  const [initialY, setInitialY] = useState<number>();
  const [newY, setNewY] = useState<number>();

  const onResizeStart = useCallback((_: any, params: { width: number; height: number }) => {
    setInitialX(params.width);
    setInitialY(params.height);
  }, []);

  const onResizeEnd = useCallback((_: any, params: { width: number; height: number }) => {
    setNewX(params.width);
    setNewY(params.height);
  }, []);

  const onResize = useCallback((_: any, params: { width: number; height: number }) => {
    const nodes = getNodes();
    const currentNode = nodes.find(({ id }) => id === subflowId);
    if (!currentNode) return;

    // Сохраняем относительные позиции дочерних узлов
    const childNodes = nodes.filter(node => node.parentId === subflowId);
    const relativePositions = childNodes.map(node => ({
      id: node.id,
      relativeX: node.position.x / (Number(currentNode.style?.width) || 1),
      relativeY: node.position.y / (Number(currentNode.style?.height) || 1),
    }));

    // Обновляем размер текущего сабфлоу
    const updatedNodes = updateSubflowSize(nodes, subflowId, params.width, params.height);

    // Обновляем размеры всех сабфлоу
    const nodesWithUpdatedSize = updateAllSubflowsHeight(updatedNodes, params.height);

    // Восстанавливаем относительные позиции дочерних узлов
    const nodesWithRestoredPositions = nodesWithUpdatedSize.map(node => {
      if (node.parentId === subflowId) {
        const relativePos = relativePositions.find(pos => pos.id === node.id);
        if (relativePos) {
          return {
            ...node,
            position: {
              x: relativePos.relativeX * params.width,
              y: relativePos.relativeY * params.height,
            },
          };
        }
      }
      return node;
    });

    // Перестраиваем сабфлоу
    const finalNodes = rearrangeSubflows(nodesWithRestoredPositions, currentNode, subflowId);
    setNodes(finalNodes);
  }, [getNodes, setNodes, subflowId]);

  return {
    onResizeStart,
    onResizeEnd,
    onResize,
    initialX,
    newX,
    initialY,
    newY,
  };
}; 