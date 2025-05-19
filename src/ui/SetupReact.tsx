import React from "react";
import { createRoot } from "react-dom/client";
import { Layout } from "./components/Layout";
export function setupReact() {
    const root = createRoot(document.getElementById('app') as HTMLElement);
    root.render(<Layout />);
}