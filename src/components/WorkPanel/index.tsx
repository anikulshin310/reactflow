interface Props {
  addSubflow: () => void;
  applyLayoutToAllSubflows: () => void;
}

export default function WorkPanel({
  addSubflow,
  applyLayoutToAllSubflows,
}: Props) {
  return (
    <>
      <div style={{ display: "flex", gap: "10px", zIndex: 1000 }}>
        <button onClick={addSubflow}>Добавить ПП</button>
        <button onClick={applyLayoutToAllSubflows}>Автолэйаут</button>
        <div
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData("application/reactflow", "default")
          }
          style={{
            padding: "8px",
            border: "1px solid #333",
            borderRadius: "3px",
            cursor: "grab",
          }}
        >
          Событие
        </div>
        <div
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData("application/reactflow", "start")
          }
          style={{
            padding: "8px",
            border: "1px solid #333",
            borderRadius: "3px",
            cursor: "grab",
          }}
        >
          Старт
        </div>
        <div
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData("application/reactflow", "or")
          }
          style={{
            padding: "8px",
            border: "1px solid #333",
            borderRadius: "3px",
            cursor: "grab",
          }}
        >
          Или
        </div>
      </div>
    </>
  );
}
