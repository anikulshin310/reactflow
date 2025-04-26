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

  const [draggedNode, setDraggedNode] = useState<Node | null>(null);

  const addSubflow = useCallback(() => {
    const newSubflowId = `subflow-${Date.now()}`;
    const subflows = nodes.filter((n) => n.type === "subflow");
    const subflowCount = subflows.length;

    const lastSubflowX = subflows.reduce((maxX, subflow) => {
      return Math.max(maxX, subflow.position.x);
    }, 0);
    const lastSubflowY = subflows.reduce((maxX, subflow) => {
      return Math.max(maxX, subflow.position.y);
    }, 0);

    const newSubflow: Subflow = {
      id: newSubflowId,
      type: "subflow",
      position: {
        x: lastSubflowX + 400,
        y: lastSubflowY,
      },
      data: {
        label: `Прикладная подсистема ${subflowCount + 1}`,
        subflowId: newSubflowId,
      },
      draggable: false,
      style: {
        border: "2px solid #555",
        padding: "10px",
        height: "100%",
        width: "400px",
      },
    };

    setNodes((nds) => [...nds, newSubflow]);
  }, [nodes]);

  const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    setDraggedNode(node);
  }, []);

  const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
    );
  }, []);

  const onNodeDragStop = useCallback(
    async (e: React.MouseEvent, node: Node) => {
      if (!draggedNode) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      if (node.type !== "subflow") {
        const targetSubflow = nodes.find(
          (n) =>
            n.type === "subflow" &&
            position.x >= n.position.x &&
            position.x <= n.position.x + 400 &&
            position.y >= n.position.y &&
            position.y <= n.position.y + Number(n.style?.height)
        );

        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              if (targetSubflow?.id) {
                return {
                  ...n,
                  parentId: targetSubflow?.id,
                  extent: targetSubflow?.id ? "parent" : undefined,
                };
              }
            }
            return n;
          })
        );

        setDraggedNode(null);
      }
    },
    [draggedNode, nodes, edges, screenToFlowPosition]
  );
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

      // 1. Находим subflow под курсором
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      const subflowId = dropTarget
        ?.closest(".react-flow__node-subflow")
        ?.getAttribute("data-id");
      if (!subflowId || !type) return;

      // 2. Преобразуем координаты мыши в координаты React Flow
      const flowPosition = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      // 3. Находим родительский subflow для корректировки позиции
      const parentSubflow = nodes.find((n) => n.id === subflowId);
      if (!parentSubflow) return;

      // 4. Корректируем позицию относительно subflow
      const relativePosition = {
        x: flowPosition.x - parentSubflow.position.x,
        y: flowPosition.y - parentSubflow.position.y,
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position: relativePosition, // Используем относительные координаты
        data: { label: `${type} ${nodes.length}` },
        parentId: subflowId,
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
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onDragOver={(e) => e.preventDefault()}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes} // Добавляем правильные типы соединений
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
