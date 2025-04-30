import {
  NodeTypes,
  EdgeTypes,
  StepEdge,
  Edge,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
  ReactFlow,
  Background,
  Node,
  Controls,
} from "@xyflow/react";
import { useState, useCallback } from "react";
import SubflowNode, { Subflow } from "../Subflow";

import "@xyflow/react/dist/style.css";
import { applyElkLayout } from "../../utils/reactFlow";
import WorkPanel from "../WorkPanel";
import StartNode from "../Nodes/StartNode";
import OrNode from "../Nodes/OrNode";

const nodeTypes: NodeTypes = {
  subflow: SubflowNode,
  start: StartNode,
  or: OrNode,
};

const edgeTypes: EdgeTypes = {
  step: StepEdge,
};

export const FlowComponent = () => {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const addSubflow = useCallback(() => {
    const newSubflowId = `subflow-${Date.now()}`;
    const subflows = nodes.filter((n) => n.type === "subflow");
    const subflowCount = subflows.length;

    // Находим последний сабфлоу
    const lastSubflow = subflows[subflows.length - 1];
    const startX = lastSubflow
      ? lastSubflow.position.x + ((lastSubflow.style?.width as number) || 400)
      : 0;

    // Получаем высоту существующих сабфлоу
    const existingHeight =
      subflows.length > 0 ? subflows[0].style?.height || 700 : 700;

    const newSubflow: Subflow = {
      id: newSubflowId,
      type: "subflow",
      position: {
        x: startX,
        y: 0,
      },
      data: {
        label: `Прикладная подсистема ${subflowCount + 1}`,
        subflowId: newSubflowId,
      },
      draggable: false,
      style: {
        padding: "0",
        height: existingHeight,
        width: "400px",
      },
    };

    // Добавляем новый сабфлоу и перерасполагаем все сабфлоу
    const updatedNodes = [...nodes, newSubflow];
    const sortedSubflows = [
      ...updatedNodes.filter((n) => n.type === "subflow"),
    ].sort((a, b) => a.position.x - b.position.x);

    const finalNodes = updatedNodes.map((node) => {
      if (node.type !== "subflow") return node;

      const subflowIndex = sortedSubflows.findIndex((s) => s.id === node.id);
      if (subflowIndex === 0) {
        return {
          ...node,
          position: { x: 0, y: 0 },
        };
      }

      const prevSubflow = sortedSubflows[subflowIndex - 1];
      const prevWidth =
        typeof prevSubflow.style?.width === "number"
          ? prevSubflow.style.width
          : parseInt(prevSubflow.style?.width as string) || 0;

      return {
        ...node,
        position: {
          x: prevSubflow.position.x + prevWidth,
          y: 0,
        },
      };
    });

    setNodes(finalNodes);
  }, [nodes]);

  const applyLayoutToAllSubflows = useCallback(async () => {
    const subflows = nodes.filter((n) => n.type === "subflow");
    let updatedNodes = [...nodes];

    for (const subflow of subflows) {
      updatedNodes = await applyElkLayout(updatedNodes, edges, subflow.id);
    }

    setNodes(updatedNodes);
  }, [nodes, edges]);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const type = e.dataTransfer.getData("application/reactflow");

      // Обработка добавления новых узлов
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      const targetSubflowId = dropTarget
        ?.closest(".react-flow__node-subflow")
        ?.getAttribute("data-id");
      if (!targetSubflowId || !type) return;

      const flowPosition = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const parentSubflow = nodes.find((n) => n.id === targetSubflowId);
      if (!parentSubflow) return;

      // Вычисляем позицию относительно сабфлоу с учетом шапки
      const relativePosition = {
        x: flowPosition.x - parentSubflow.position.x,
        y: flowPosition.y - parentSubflow.position.y - 50, // Учитываем высоту шапки
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position: relativePosition,
        data: { label: `${type} ${nodes.length}` },
        parentId: targetSubflowId,
        extent: "parent",
        draggable: true,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, screenToFlowPosition]
  );

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;

      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: "step",
        markerEnd: { type: MarkerType.ArrowClosed },
      };

      const newEdges = [...edges, newEdge];
      setEdges(newEdges);
    },
    [nodes, edges]
  );

  return (
    <>
      <WorkPanel
        addSubflow={addSubflow}
        applyLayoutToAllSubflows={applyLayoutToAllSubflows}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "step",
          style: { stroke: "#333", strokeWidth: 2 },
        }}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </>
  );
};
