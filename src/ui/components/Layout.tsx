import { ComponentContainer, ComponentItem, EventHub, GoldenLayout, Stack } from "golden-layout";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Counter, Test } from "./Test";
import { Project } from "./Project";
import { Sidebar } from "./Sidebar";
import { Layers } from "./Layers";
import { Export } from "./Export";
import { ImagePreview } from "./ImagePreview";
import { ImageSource } from "./ImageSource";
import { LayoutContext } from "../LayoutContext";
export interface ILyoutProps {
	container: ComponentContainer;
	eventHub: EventHub;
	state: any;
}

type ComponentMap = { [name: string]: () => React.JSX.Element };

const componentTypes: ComponentMap = {
	sidebar: Sidebar,
	layers: Layers,
	export: Export,
	imagePreview: ImagePreview,
	imageSource: ImageSource,
	project: Project,
	test: Test,
};

export function Layout(/*{ container, eventHub, state }: ILyoutProps*/) {
	const layoutRoot = useRef<HTMLDivElement>(null);
	const [layoutMan, setLayoutMan] = useState<GoldenLayout | null>(null);
	const [componentContainers, setComponentContainers] = useState<{ [name: string]: HTMLElement }>({});

	useEffect(() => {
		var layoutMan: GoldenLayout;
		if (layoutRoot.current) {
			layoutMan = new GoldenLayout(
				layoutRoot.current,
				(e, e2) => {
					console.log(e);
					console.log(e2);
					//const el = { type: "component", componentType: "bind", header: { show: false } };
					//e.element.innerText = "Binded";
					return { component: {}, virtual: false };
				},
				(e) => {
					//@ts-ignore
					//console.log(e.stateRequestEvent!("dd"));
					console.log(e);
				},
			);

			for (const componentName in componentTypes) {
				layoutMan.registerComponentFactoryFunction(componentName, (container, ..._) => {
					setComponentContainers((prev) => ({ ...prev, [componentName]: container.element }));
				});
			}
			layoutMan.on("tabCreated", (tab) => {
				if (tab.closeElement) {
					tab.closeElement.remove(); //.parentNode?.replaceChild(tab.closeElement.cloneNode(true), tab.closeElement);
				}
			});
			layoutMan.on("itemCreated", (item) => {
				if ((item.target as ComponentItem).isStack) {
					(item.target as Stack).header.controlsContainerElement.querySelector(".lm_close")?.remove();
				}
			});
			layoutMan.loadLayout({
				header: { popout: false },
				settings: { tabControlOffset: 20 },
				dimensions: { borderWidth: 1 },
				root: {
					type: "row",
					content: [
						{
							type: "stack",
							size: "15%",
							content: [
								{ type: "component", componentType: "sidebar" },
								{ type: "component", componentType: "project" },
								{ type: "component", componentType: "export" },
							],
						},
						{ type: "component", size: "15%", componentType: "layers" },
						{
							type: "column",
							content: [
								{ type: "component", componentType: "imagePreview" },
								{ type: "component", componentType: "imageSource" },
							],
						},
					],
				},
			});
			setLayoutMan(layoutMan);
		}
		return () => {
			if (layoutMan) {
				layoutMan.destroy();
			}
		};
	}, [layoutRoot]);

	return (
		<LayoutContext.Provider value={layoutMan}>
			<style>
				{`
				.lm_header .lm_tab.lm_active.lm_focused {
    				background-color: #a335e3;
				}
				`}
			</style>
			{layoutMan &&
				Object.keys(componentContainers).map((name) => {
					const Component = componentTypes[name];
					return createPortal(<Component />, componentContainers[name]);
				})}
			<div style={{ width: "100%", height: "100%" }} ref={layoutRoot} />
		</LayoutContext.Provider>
	);
}
