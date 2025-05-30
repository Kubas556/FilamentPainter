import React, { useContext, useEffect, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { FilamentData, getOpacityFromColor } from "../Filaments";
import { emitEvent, useEvent } from "../EventHub";
import { IComponentProjectData } from "../ExportProject";

export function Sidebar(props: IComponentProjectData) {
	const layoutManager = useContext(LayoutContext);
	const [filamentToAdd, setFilamentToAdd] = useState<FilamentData>({
		color: "#000000",
		name: "Filament 1",
		opacity: 0.1,
		layerHeight: props.projectConfig.layerHeight,
	});

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	useEvent("projectConfigChanged", (config) => {
		setFilamentToAdd((old) => ({ ...old, layerHeight: config.layerHeight }));
	});

	useEffect(() => {
		var newOpacity = getOpacityFromColor(filamentToAdd.color);
		if (newOpacity !== undefined && newOpacity !== filamentToAdd.opacity) {
			setFilamentToAdd((old) => ({ ...old, opacity: newOpacity! }));
		}
	}, [filamentToAdd.color]);

	return (
		<section id="sidebar">
			<h3>Add New Filament Layer</h3>
			<ul className="sidebar-list">
				<li className="filament-list-item">
					<span>Create New Filament</span>
					<div className="row">
						<span>
							Name:{" "}
							<input
								type="text"
								value={filamentToAdd.name}
								onChange={(e) => {
									setFilamentToAdd((old) => ({ ...old, name: e.target.value }));
								}}
							/>
						</span>
					</div>
					<div className="row">
						<span>
							Colour:{" "}
							<input
								type="color"
								value={filamentToAdd.color}
								onChange={(e) => {
									setFilamentToAdd((old) => ({ ...old, color: e.target.value }));
								}}
							/>{" "}
							<input
								type="text"
								placeholder="Hex Code"
								value={filamentToAdd.color}
								onChange={(e) => {
									setFilamentToAdd((old) => ({ ...old, color: e.target.value }));
								}}
							/>
						</span>
					</div>
					<div className="row">
						<span>
							Opacity:{" "}
							<input
								type="number"
								step="0.01"
								min="0"
								max="5"
								value={filamentToAdd.opacity.toFixed(2)}
								onChange={(e) => {
									setFilamentToAdd((old) => ({ ...old, opacity: parseFloat(e.target.value) }));
								}}
							/>{" "}
							mm
						</span>
					</div>
					<button
						className="filament-add-button"
						id="add-item-button-new"
						onClick={() => {
							emitEvent(layoutManager, "layerAdded", filamentToAdd);
						}}
					>
						Add Filament Layer
					</button>
				</li>

				{
					//TODO: Implement existing filament selection
					/*<li className="filament-list-item">
					<span>Choose Existing Filament</span>
					<select id="existing-filament-selection">
						<option value="None">Choose an existing filament</option>
					</select>
					<button className="filament-add-button" id="add-item-button-existing">
						Add Filament Layer
					</button>
				</li>*/
				}
			</ul>
			{
				//TODO: Implement filament list
				/*<ul id="existing-filament-list"></ul>

			<button id="update-painting-button" disabled>
				Update Painting
			</button>
			<div>
				<input type="checkbox" checked id="auto-update-checkbox" disabled onChange={() => {}} />
				Automatically Update Painting
			</div>*/
			}
		</section>
	);
}
