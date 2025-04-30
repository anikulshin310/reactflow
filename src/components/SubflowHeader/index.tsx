import styles from "./index.module.scss";

type SubflowHeaderProps = {
  label: string;
};

export default function SubflowHeader({ label }: SubflowHeaderProps) {
  return (
    <div className={styles.subflow_header}>
      {label}
    </div>
  );
} 