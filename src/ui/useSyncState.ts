import { useCallback, useContext, useEffect, useState } from "react";
import { LayoutContext } from "./LayoutContext";
import { IExportConfig, IProjectConfig } from "./EventHub";
import { FilamentData } from "./Filaments";

export interface ISyncableState {
	SourceImage: HTMLImageElement | undefined;
	ExportConfig: IExportConfig;
	ProjectConfig: IProjectConfig;
	FilamentLayers: FilamentData[];
}

export function useSyncState<E extends keyof ISyncableState>(
	name: E,
	initValue: ISyncableState[E],
): [ISyncableState[E], (value: (v: ISyncableState[E]) => ISyncableState[E]) => void] {
	const layoutManager = useContext(LayoutContext);

	if (!layoutManager) throw new Error("missing layout context");

	const [value, setValue] = useState(initValue);

	const eventCallback = useCallback((eventName: any, eventValue: any) => {
		if (eventName === name) {
			setValue(eventValue);
		}
	}, []);

	useEffect(() => {
		layoutManager.eventHub.on("userBroadcast", eventCallback);

		return () => {
			layoutManager.eventHub.off("userBroadcast", eventCallback);
		};
	}, [layoutManager]);

	return [
		value,
		(newVal) => {
			layoutManager.eventHub.emitUserBroadcast(name, newVal);
		},
	];
}
