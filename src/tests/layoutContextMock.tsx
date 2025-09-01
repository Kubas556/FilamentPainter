import React, { useEffect, useRef, useState } from "react";
import { LayoutContext } from "../ui/LayoutContext";
import { ComponentContainer, GoldenLayout, LayoutConfig } from "golden-layout";
import { IComponentProjectData } from "../ui/ExportProject";
import { createPortal } from "react-dom";
import { render } from "@testing-library/react";

type LayoutComponent = (props: IComponentProjectData) => React.JSX.Element;

export const LayoutMock = (props: { component: LayoutComponent; projectData: IComponentProjectData }) => {
	const layoutRoot = useRef<HTMLDivElement>(null);
	const initialized = useRef(false);
	const [layoutMan, setLayoutMan] = useState<GoldenLayout | null>(null);
	const [componentContainers, setComponentContainers] = useState<{ [name: string]: ComponentContainer | null }>({});
	const [projectData, setProjectData] = useState<IComponentProjectData>(props.projectData);
	const defaultLayout: LayoutConfig = {
		header: { popout: false, maximise: false },
		settings: { tabControlOffset: 20, popInOnClose: true },
		dimensions: { borderWidth: 1 },
		root: { type: "component", componentType: "componentTest", title: "component test" },
	};

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
						setComponentContainers(() => ({ ["componentTest"]: container }));
						return { component, virtual: false };
					}
					return { component, virtual: false };
				},
				(container) => {
					if (new URL(document.location.href).searchParams.get("gl-window") !== null) {
						setComponentContainers(() => ({ ["componentTest"]: null }));
					}
				},
			);

			layoutMan.registerComponentFactoryFunction("componentTest", (container, state) => {
				setComponentContainers(() => ({ ["componentTest"]: container }));
			});

			layoutMan.resizeWithContainerAutomatically = false;
			if (!layoutMan.isSubWindow) layoutMan.loadLayout(defaultLayout);
			setLayoutMan(layoutMan);
			initialized.current = true;
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
					const Component = props.component;
					const container = componentContainers[name];
					if (container != null) return createPortal(<Component {...projectData} />, container.element);
				})}
			<div style={{ width: "100%", height: "100%" }} ref={layoutRoot} />
		</LayoutContext.Provider>
	);
};

export const renderWithLayout = (component: LayoutComponent, data: IComponentProjectData) =>
	render(<LayoutMock component={component} projectData={data} />);
