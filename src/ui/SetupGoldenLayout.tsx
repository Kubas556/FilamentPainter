import { GoldenLayout } from "golden-layout";
import { Layout } from "./components/Layout";
import React from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Test } from "./components/Test";

export function setupGoldenLayout() {
    var layers = document.getElementById("layers-section") as HTMLElement;
    var projectSection = document.getElementById("project-section") as HTMLElement;
    var sidebar = document.querySelector(".config-sidebar") as HTMLElement;
    var exportSection = document.getElementById("export-section") as HTMLElement;
    var canvasSource = document.querySelector("#canvas-source") as HTMLElement;
    var canvasPreview = document.querySelector("#canvas-preview") as HTMLElement;
    var f = new GoldenLayout(document.querySelector(".container") as HTMLDivElement, (e, e2) => { console.log(e, e2); return { component: document.createElement("div"), virtual: false } }, (e) => { console.log(e) });
    //window.addEventListener("resize", () => { f.updateRootSize() });
    f.loadLayout({
        header: { popout: "" },
        dimensions: { borderWidth: 1 },
        root: undefined
    });
    var root = createRoot(document.getElementById("app") as HTMLElement);
    const el = <>
        <Test />
    </>;
    root.render(el)
    f.registerComponentFactoryFunction("react", async (container, state, virtual) => {
        container.element.innerHTML = '<div id="copy"></div>'
    });
    f.registerComponentFactoryFunction("layers", (container, state, virtual) => {
        f.eventHub.addEventListener("value-added" as any, e => { console.log("layers", e, state) })
        container.element.appendChild(layers);
    });
    f.registerComponentFactoryFunction("project", (container, state, virtual) => {
        container.element.appendChild(projectSection);
    });
    f.registerComponentFactoryFunction("export", (container, state, virtual) => {
        container.element.appendChild(exportSection);
    });
    f.registerComponentFactoryFunction("sidebar", (container, state, virtual) => {
        container.element.appendChild(sidebar);
    });
    f.registerComponentFactoryFunction("source", (container, state, virtual) => {
        const element = document.createElement("div");
        element.appendChild(canvasSource);
        element.style.display = "flex";
        element.style.flexDirection = "row";
        element.style.height = "100%";
        container.element.appendChild(element);
    });
    f.registerComponentFactoryFunction("preview", (container, state, virtual) => {
        const element = document.createElement("div");
        element.appendChild(canvasPreview);
        element.style.display = "flex";
        element.style.flexDirection = "row";
        element.style.height = "100%";
        container.element.appendChild(element);
    });
    const location = f.addItem({
        type: "row",
        content: [
            { type: "stack", size: "15%", content: [{ type: "component", componentType: "sidebar" }, { type: "component", componentType: "project" }, { type: "component", componentType: "export" }] },
            { type: "component", size: "15%", componentType: "layers" },
            {
                type: "column",
                content: [
                    { type: "component", componentType: "preview" },
                    { type: "component", componentType: "source" },
                    { type: "component", componentType: "react" }
                ],
            },
        ],
    });
}