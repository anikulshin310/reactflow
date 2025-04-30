import { NodeResizeControl, ResizeControlProps } from "@xyflow/react";

export default function CustomNodeResizer(props: ResizeControlProps) {
  return (
    <NodeResizeControl
      minWidth={200}
      minHeight={100}
      position="bottom-right"
      style={{
        background: "transparent",
        border: "none",
        position: "absolute",
        zIndex: 10000,
      }}
      {...props}
    >
      <div
        style={{
          width: 20,
          height: 20,
          background: "#2196f3",
          borderRadius: "50%",
          position: "absolute",
          right: 0,
          bottom: 0,
          cursor: "nwse-resize",
          zIndex: 10001,
        }}
      />
    </NodeResizeControl>
  );
}
