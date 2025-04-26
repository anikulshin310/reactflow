import { Handle, Position } from "@xyflow/react";
import styles from "./index.module.scss";

export default function OrNode() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.start}>
        <Handle type="target" position={Position.Top} className={styles.top} />
        <Handle type="source" position={Position.Left} id="right" />
        <Handle type="source" position={Position.Right} id="left" />
        <div className={styles.rotated}></div>
      </div>
    </div>
  );
}
