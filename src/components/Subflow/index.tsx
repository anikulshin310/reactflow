import { NodeProps } from "@xyflow/react";
import styles from "./index.module.scss";
import CustomNodeResizer from "../CustomNodeResizer";
import { useSubflowResize } from "../../hooks/useSubflowResize";
import { Subflow } from "./types";
import SubflowHeader from "../SubflowHeader";

export default function SubflowNode({ data }: NodeProps<Subflow>) {
  const { onResizeStart, onResizeEnd, onResize } = useSubflowResize(data.subflowId);

  return (
    <>
      <CustomNodeResizer
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        onResize={onResize}
      />
      <div className={styles.subflow_container}>
        <SubflowHeader label={data.label} />
        <div className={styles.subflow_content}>
          {/* Content will be rendered here */}
        </div>
      </div>
    </>
  );
}
