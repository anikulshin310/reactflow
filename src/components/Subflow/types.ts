import { Node } from "@xyflow/react";

export type SubflowData = {
  label: string;
  subflowId: string;
  children?: React.ReactNode;
};

export type Subflow = Node<SubflowData>; 