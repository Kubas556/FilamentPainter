import { IComputedData, IExportConfig, IProjectConfig } from "./EventHub.js";
import { downloadTextFile } from "./Export.js";
import { FilamentData } from "./Filaments.js";
import { IFilemantStore } from "./filamentStore.js";

export interface IComponentProjectData {
	image?: string;
	projectConfig: IProjectConfig;
	exportConfig: IExportConfig;
	filamentLayers: FilamentData[];
	sourceImage?: HTMLImageElement;
	computedData?: IComputedData;
	filamentStore?: IFilemantStore;
}

export interface ExportedProjectData {
	image: string;
	projectConfig: IProjectConfig;
	exportConfig: IExportConfig;
	filaments: FilamentData[];
	computedData: IComputedData;
}

export function exportProject(
	image: string,
	projectConfig: IProjectConfig,
	exportConfig: IExportConfig,
	filaments: FilamentData[],
	computedData: IComputedData,
) {
	downloadTextFile(
		"project.json",
		JSON.stringify({
			image,
			projectConfig,
			exportConfig,
			filaments,
			computedData,
		} as ExportedProjectData),
	);
}
