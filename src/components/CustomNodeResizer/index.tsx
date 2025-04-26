import { NodeResizer, NodeResizerProps } from "@xyflow/react";

export default function CustomNodeResizer(props: NodeResizerProps) {
  return (
    <NodeResizer
      lineStyle={{ borderColor: "transparent" }}
      handleStyle={{
        backgroundColor: "transparent",
        width: 0,
        height: 0,
        border: "4px transparent",
      }}
      {...props}
    />
  );
}
