import type { ReactNode } from "react";
import "./SplitPane.css";

export function SplitPane({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="split-pane">
      <div className="split-pane__left">{left}</div>
      <div className="split-pane__right">{right}</div>
    </div>
  );
}
