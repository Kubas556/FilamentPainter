import { ComponentContainer, EventHub, GoldenLayout, JsonValue } from "golden-layout";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Counter } from "./Test";
export interface ILyoutProps {
    container: ComponentContainer,
    eventHub: EventHub,
    state: any
}
export function Layout(/*{ container, eventHub, state }: ILyoutProps*/) {
    const layoutRoot = useRef<HTMLDivElement>(null);
    const [containerRoot, setContainerRoot] = useState<HTMLElement>();

    useEffect(() => {
        var layoutMan: GoldenLayout;
        if (layoutRoot.current) {
            layoutMan = new GoldenLayout(layoutRoot.current, (e, e2) => { console.log(e, e2); return { component: document.createElement("div"), virtual: false } }, (e) => { console.log(e) });
            layoutMan.loadLayout({
                header: { popout: false },
                dimensions: { borderWidth: 1 },
                root: undefined
            });
            layoutMan.registerComponentFactoryFunction("layers", (container, state, virtual) => {
                setContainerRoot(container.element);
            });
            layoutMan.addItem({
                type: "row",
                content: [
                    { type: "component", size: "15%", componentType: "layers" },
                ],
            });
        }
        return () => {
            if (layoutMan) {
                layoutMan.destroy();
            }
        }
    }, [layoutRoot])
    return (
        <>
            {containerRoot && createPortal(<Counter />, containerRoot)}
            <div className="container" ref={layoutRoot}>
            </div>
        </>
    )
}