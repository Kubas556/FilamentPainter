import { useContext, useEffect } from "react";
import { LayoutContext } from "./LayoutContext";
import { LayoutManager } from "golden-layout";
import { ImageUpload } from "../Upload";
import { FilamentData } from "./Filaments";
import { Filament } from "../Filament";
import { ExportedProjectData } from "./ExportProject";

interface ISize {
	x: number;
	y: number;
}

export interface IComputedData {
	computedResult: Float32Array<ArrayBuffer> | undefined;
	filaments: Filament[];
}

export interface IExportConfig {
	imageResolution: ISize;
	physicalSize: ISize;
	detailSize: number;
	aspectRatio: number;
}

export interface IProjectConfig {
	selectedTopographyFunction: string;
	layerHeight: number;
	baseLayerHeight: number;
}

export interface IFilamentAdded {
	data: FilamentData[];
}

type Events = {
	imageChanged: ImageUpload;
	exportConfigChanged: IExportConfig;
	projectConfigChanged: IProjectConfig;
	layersChanged: IFilamentAdded;
	layerAdded: FilamentData;
	computedDataChanged: IComputedData;
	projectLoaded: ExportedProjectData;
};

export function useEvent<E extends keyof Events>(name: E, callback: (arg: Events[E]) => void) {
	const context = useContext(LayoutContext);
	const checkEvent = (event: any, data: any) => {
		if (event === name) {
			callback(data);
		}
	};

	useEffect(() => {
		if (context) {
			context.eventHub.on("userBroadcast", checkEvent);
		}

		return () => {
			if (context) {
				context.eventHub.off("userBroadcast", checkEvent);
			}
		};
	}, [context]);
}

export function useLayoutEvent<E extends keyof Events>(
	layoutManager: LayoutManager | null,
	name: E,
	callback: (arg: Events[E]) => void,
) {
	const checkEvent = (event: any, data: any) => {
		if (event === name) {
			callback(data);
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
}

export function emitEvent<E extends keyof Events>(layoutManager: LayoutManager, event: E, config: Events[E]) {
	layoutManager.eventHub.emitUserBroadcast(event, config);
}
