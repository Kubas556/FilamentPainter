import React, { useContext, useEffect, useState } from "react";
import { loadProject } from "../ImportProject";
import { handleImageUpload } from "../../Upload";
import { LayoutContext } from "../LayoutContext";
import { emitEvent } from "../EventHub";

export const DefaultProjectConfig = {
	selectedTopographyFunction: "nearest",
	layerHeight: 0.08,
	baseLayerHeight: 0.2,
};

export function Project() {
	const layoutManager = useContext(LayoutContext);
	const [selectedTopographyFunction, setSelectedTopographyFunction] = useState(
		DefaultProjectConfig.selectedTopographyFunction,
	);
	const [layerHeight, setLayerHeight] = useState(DefaultProjectConfig.layerHeight);
	const [baseLayerHeight, setBaseLayerHeight] = useState(DefaultProjectConfig.baseLayerHeight);

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	useEffect(() => {
		emitEvent(layoutManager, "projectConfigChanged", {
			selectedTopographyFunction,
			layerHeight,
			baseLayerHeight,
		});
	}, [layoutManager, selectedTopographyFunction, layerHeight, baseLayerHeight]);

	return (
		<section id="project-section">
			<h3>Import Options</h3>
			<div className="import-option-row">
				<label> Import Image: </label>
				<input
					id="image-upload"
					type="file"
					onChange={(e) =>
						handleImageUpload(e, (result) => {
							if (result.error) {
								console.error("Image upload error:", result.error);
							} else if (result.imageElement) {
								if (result.file) emitEvent(layoutManager, "imageChanged", result);
							}
						})
					}
					name="file"
					accept="image/*"
					className="image-input"
				/>
			</div>
			<div className="import-option-row">
				<button
					id="import-project"
					onClick={() =>
						loadProject((e) => {
							console.log(e);
						})
					}
				>
					Open Project
				</button>
			</div>
			<div className="h-divider"></div>
			<h3>Filament Options</h3>
			<div>
				<label htmlFor="height-option-selection">Topography Function: </label>

				<select
					name="height-option"
					id="height-option-selection"
					value={selectedTopographyFunction}
					onChange={(e) => {
						setSelectedTopographyFunction(e.target.value);
					}}
				>
					<option value="nearest">Nearest Match</option>
					<option value="greyscale-luminance">Greyscale (Luminance)</option>
					<option value="greyscale-max">Greyscale (Max)</option>
					<option value="custom" disabled>
						Custom (In Development)
					</option>
				</select>
			</div>
			<div>
				<label>Layer height: </label>
				<input
					className="input-number"
					id="layer-height-input"
					type="number"
					step="0.01"
					value={layerHeight}
					onChange={(e) => setLayerHeight(parseFloat(e.target.value))}
				/>{" "}
				mm
			</div>

			<div>
				<label>Base layer height: </label>
				<input
					className="input-number"
					id="base-layer-height-input"
					type="number"
					step="0.01"
					value={baseLayerHeight}
					onChange={(e) => setBaseLayerHeight(parseFloat(e.target.value))}
				/>{" "}
				mm
			</div>
		</section>
	);
}
