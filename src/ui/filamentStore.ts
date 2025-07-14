import { LayoutManager } from "golden-layout";
import { createContext, useContext, useEffect, useState } from "react";
import { LayoutContext } from "./LayoutContext";

/*export const FilamentStore = createContext(function (layoutManager: LayoutManager) {
    let filamentNames: string[] = [];
    setFilamentNames: (newNames: string[]) => {
        layoutManager.eventHub.emitUserBroadcast("filamentStore", newNames);
        filamentNames = newNames;
    }
});

interface TestInstance {
    name: string;
}

interface TestConstructor {
    new(): TestInstance;
}

const Test: TestConstructor = function (this: TestInstance) {
    this.name = "test";
} as any;*/

export interface IFilemantStore {
    stored: string[];
    setStored: (val: string[]) => void;
}

export function FilamentStore(/*layout: LayoutManager | null,*/ init: string[]): IFilemantStore {
    const layoutManager = useContext(LayoutContext);
    //const layoutManager = layout;

    const [stored, setStored] = useState(init);

    const checkEvent = (event: any, data: any) => {
        if (event === "filamentStoreSync") {
            setStored(data.stored);
        }
    };

    useEffect(() => {
        if (layoutManager) {
            layoutManager.eventHub.on("userBroadcast", checkEvent);
        }

        return () => {
            if (layoutManager) {
                layoutManager.eventHub.off("userBroadcast", checkEvent);
            }
        };
    }, [layoutManager]);

    if (!layoutManager) throw new Error("missing layout context");

    return {
        stored, setStored: (newVal: string[]) => {
            layoutManager.eventHub.emitUserBroadcast("filamentStoreSync", { stored: newVal });
        }
    };
}