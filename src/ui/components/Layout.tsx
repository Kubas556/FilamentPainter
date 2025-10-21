import { ComponentContainer, ComponentItem, EventHub, GoldenLayout, LayoutConfig, Stack } from "golden-layout";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Test } from "./Test";
import { DefaultProjectConfig, Project } from "./Project";
import { Sidebar } from "./Sidebar";
import { Layers } from "./Layers";
import { defaultExportConfig, Export } from "./Export";
import { ImagePreview } from "./ImagePreview";
import { ImageSource } from "./ImageSource";
import { LayoutContext } from "../LayoutContext";
import { useLayoutEvent } from "../EventHub";
import { IComponentProjectData } from "../ExportProject";
import { getImageFromStringAsync } from "../../Upload";
import { LayersGraph } from "./LayersGraph";
import { Button, Dialog, DialogTrigger, Heading, Modal, Pressable } from "react-aria-components";

const defaultLayout: LayoutConfig = {
	header: { popout: false, maximise: false },
	settings: { tabControlOffset: 20, popInOnClose: true },
	dimensions: { borderWidth: 1 },
	root: {
		type: "row",
		content: [
			{
				type: "stack",
				size: "15%",
				content: [
					{ type: "component", componentType: "filament" },
					{ type: "component", componentType: "project" },
					{ type: "component", componentType: "export" },
				],
			},
			{ type: "component", size: "15%", componentType: "layers" },
			{
				type: "column",
				content: [
					{ type: "component", componentType: "imagePreview", title: "image preview" },
					{ type: "component", componentType: "imageSource", title: "image source" },
				],
			},
			{ type: "component", size: "10%", componentType: "layersGraph", title: "layers graph", reorderEnabled: false },
		],
	},
};
export interface ILyoutProps {
	container: ComponentContainer;
	eventHub: EventHub;
	state: any;
}

type ComponentMap = { [name: string]: (props: IComponentProjectData) => React.JSX.Element };

const componentTypes: ComponentMap = {
	filament: Sidebar,
	layers: Layers,
	layersGraph: LayersGraph,
	export: Export,
	imagePreview: ImagePreview,
	imageSource: ImageSource,
	project: Project,
	test: Test,
};

export function Layout() {
	const layoutRoot = useRef<HTMLDivElement>(null);
	const initialized = useRef(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [layoutMan, setLayoutMan] = useState<GoldenLayout | null>(null);
	const [componentContainers, setComponentContainers] = useState<{ [name: string]: ComponentContainer | null }>({});
	const [projectData, setProjectData] = useState<IComponentProjectData>({
		projectConfig: DefaultProjectConfig,
		exportConfig: defaultExportConfig,
		filamentLayers: [],
		image: undefined,
		computedData: undefined,
		sourceImage: undefined,
	});

	useLayoutEvent(layoutMan, "projectLoaded", (data) => {
		getImageFromStringAsync(data.image).then((imageGeneratedResult) => {
			if (imageGeneratedResult.imageElement) {
				setProjectData({
					projectConfig: data.projectConfig,
					exportConfig: data.exportConfig,
					filamentLayers: data.filaments,
					image: data.image,
					computedData: data.computedData,
					sourceImage: imageGeneratedResult.imageElement,
				});
			}
		});
	});

	useEffect(() => {
		if (initialized.current === true && layoutMan?.isInitialised) layoutMan.loadLayout(defaultLayout);
	}, [projectData]);

	useEffect(() => {
		var layoutMan: GoldenLayout;
		if (layoutRoot.current) {
			layoutMan = new GoldenLayout(
				layoutRoot.current,
				(container, component) => {
					if (new URL(document.location.href).searchParams.get("gl-window") !== null) {
						setComponentContainers((prev) => ({ ...prev, [component.componentType as string]: container }));
						return { component, virtual: false };
					}
					return { component, virtual: false };
				},
				(container) => {
					if (new URL(document.location.href).searchParams.get("gl-window") !== null) {
						setComponentContainers((prev) => ({ ...prev, [container.componentType as string]: null }));
					}
				},
			);

			for (const componentName in componentTypes) {
				layoutMan.registerComponentFactoryFunction(componentName, (container, state) => {
					setComponentContainers((prev) => ({ ...prev, [componentName]: container }));
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
			layoutMan.resizeWithContainerAutomatically = true;
			if (!layoutMan.isSubWindow) layoutMan.loadLayout(defaultLayout);
			setLayoutMan(layoutMan);
			initialized.current = true;
			setTimeout(() => setDialogOpen(true), 3000);
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
    				background-color: #500f81;
				}
				`}
			</style>
			{layoutMan &&
				Object.keys(componentContainers).map((name) => {
					const Component = componentTypes[name];
					const container = componentContainers[name];
					if (container != null) return createPortal(<Component {...projectData} />, container.element);
				})}
			<Modal isOpen={dialogOpen}>
				<Dialog>
					<Heading slot="title">Dialog</Heading>
					<p>This dialog was triggered by a custom button.</p>
					<Button slot="close" onClick={() => setDialogOpen(false)}>
						Close
					</Button>
				</Dialog>
			</Modal>

			<div style={{ width: "100%", height: "100%" }} ref={layoutRoot} />
		</LayoutContext.Provider>
	);
}
