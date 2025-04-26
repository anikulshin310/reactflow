import { Handle, Position } from "@xyflow/react";
import styles from "./index.module.scss";
export default function StartNode() {
  return (
    <>
      {" "}
      <div className={styles.wrapper}>
        {" "}
        <Handle type="source" position={Position.Bottom} />
        <div className={styles.start}>Начало</div>
      </div>
    </>
  );
}
