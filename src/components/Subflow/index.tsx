import {
  OnResize,
  ResizeParams,
  ResizeParamsWithDirection,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import styles from "./index.module.scss";
import CustomNodeResizer from "../CustomNodeResizer";
import { useEffect, useState } from "react";

type SubflowData = {
  label: string;
  subflowId: string;
  children?: React.ReactNode;
};
export type Subflow = Node<SubflowData>;

export default function SubflowNode({ data }: NodeProps<Subflow>) {
  const { getNodes, setNodes } = useReactFlow();
  const [directionX, setDirectionX] = useState<"left" | "right" | undefined>();
  const [initialX, setInitialX] = useState<number>();
  const [newX, setNewX] = useState<number>();

  const onResizeStart = (_, params: ResizeParams) => {
    setInitialX(params.width);
  };

  const onResizeEnd = (_, params: ResizeParams) => {
    setNewX(params.width);
  };

  const onResize = (_, params: ResizeParamsWithDirection) => {
    const [x, y] = params.direction;
    if (x < 0) {
      setDirectionX("left");
    }
    if (x > 0) {
      setDirectionX("right");
    }
  };

  useEffect(() => {
    if (initialX && newX && directionX) {
      const nodes = getNodes().filter(({ type }) => type === "subflow");
      const nodeIndex = nodes.findIndex(({ id }) => id === data.subflowId);
      const updatedNodes = nodes.map((node, index) => {
        if (directionX === "right" && index > nodeIndex) {
          return {
            ...node,
            position: {
              ...node.position,
              x: node.position.x + (newX - initialX),
            },
          };
        }
        if (directionX === "left" && index < nodeIndex) {
          return {
            ...node,
            position: {
              ...node.position,
              x: node.position.x - (newX - initialX),
            },
          };
        } else return node;
      });

      setNodes(updatedNodes);
    }
  }, [initialX, newX, directionX]);
  return (
    <>
      <CustomNodeResizer
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        onResize={onResize}
      />
      <div className={styles.subflow_container}>{data.label}</div>
    </>
  );
}
