import React, { useContext, useEffect, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { emitEvent, IProjectConfig, useEvent } from "../EventHub";
import { FilamentData } from "../Filaments";
import { DefaultProjectConfig } from "./Project";

export function Layers() {
	const layoutManager = useContext(LayoutContext);
	const [filamentLayers, setFilamentLayers] = useState<FilamentData[]>([]);
	const [projectConfig, setProjectConfig] = useState<IProjectConfig>(DefaultProjectConfig);

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	useEvent("layerAdded", (layer) => {
		setFilamentLayers((prev) => [...prev, layer]);
	});

	useEvent("projectConfigChanged", (config) => {
		setProjectConfig(config);
	});

	useEffect(() => {
		emitEvent(layoutManager, "layersChanged", { data: filamentLayers });
	}, [filamentLayers]);

	return (
		<div id="layers-section">
			<div className="row filament-list-item" id="end-layer-height-label">
				{`End height: ${filamentLayers
					.reduce((sum, layer) => sum + layer.layerHeight, projectConfig.baseLayerHeight)
					.toFixed(2)} mm`}
			</div>
			<ul className="draggable-list" id="draggable-list">
				{projectConfig &&
					filamentLayers.map((layer) => (
						<FillamentLayer
							key={layer.name}
							filamentData={layer}
							onDelete={() => {
								console.log("Delete layer", layer.name);
								setFilamentLayers((prev) => prev.filter((l) => l.name !== layer.name));
							}}
							onDataChange={(newData) => {
								setFilamentLayers((prev) => {
									const i = prev.findIndex((l) => l.name === layer.name);
									if (i !== -1) {
										prev[i] = newData;
										return [...prev];
									}
									return prev;
								});
							}}
							projectConfig={projectConfig}
						/>
					))}
			</ul>
			<div className="row filament-list-item">Build Plate: 0 mm</div>
		</div>
	);
}

function FillamentLayer({
	filamentData,
	projectConfig,
	onDataChange,
	onDelete,
}: {
	filamentData: FilamentData;
	projectConfig: IProjectConfig;
	onDataChange: (data: FilamentData) => void;
	onDelete: () => void;
}) {
	return (
		<li className="filament-list-item">
			<div className="drag-handle">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M3 9H21V11H3V9ZM3 15H21V17H3V15Z" fill="currentColor" />
				</svg>
			</div>
			<div className="row">
				<span>
					Name: <input type="text" value={filamentData.name} readOnly />
				</span>
			</div>
			<div className="row">
				Colour: <div className="h-gap-small"></div>{" "}
				<input
					type="color"
					value={filamentData.color}
					onChange={(e) => {
						onDataChange({ ...filamentData, color: e.target.value });
					}}
				/>
				<div className="h-gap"></div>
				Opacity: <div className="h-gap-small"></div>{" "}
				<input
					type="number"
					step="0.01"
					min="0"
					max="5"
					value={filamentData.opacity.toFixed(2)}
					onChange={(e) => {
						onDataChange({ ...filamentData, opacity: parseFloat(e.target.value) });
					}}
					className="filament-layer-opacity"
				/>
			</div>
			<div className="row">
				Layer Height:
				<div className="h-gap-small"></div>
				<input
					type="range"
					min="0.00"
					max="2"
					step={projectConfig.layerHeight}
					value={filamentData.layerHeight}
					onChange={(e) => {
						onDataChange({ ...filamentData, layerHeight: parseFloat(e.target.value) });
					}}
					className="layer-height-slider"
				/>
				<div className="h-gap"></div>
				<input
					type="number"
					min="0.00"
					max="2"
					step="0.01"
					value={filamentData.layerHeight}
					onChange={(e) => {
						onDataChange({ ...filamentData, layerHeight: parseFloat(e.target.value) });
					}}
					className="layer-height-number"
				/>
				<div className="h-gap-small"></div> mm
			</div>
			<button className="delete-layer-button" onClick={onDelete}>
				Delete
			</button>
		</li>
	);
}
