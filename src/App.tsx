import { ReactFlowProvider } from "@xyflow/react";
import { FlowComponent } from "./components/Flow";





export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlowProvider>
        <FlowComponent />
      </ReactFlowProvider>
    </div>
  );
}
