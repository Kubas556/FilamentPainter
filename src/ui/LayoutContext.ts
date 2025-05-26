import { LayoutManager } from "golden-layout";
import { createContext } from "react";

export const LayoutContext = createContext<LayoutManager | null>(null);
