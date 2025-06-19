import React, { useContext, useEffect, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { FilamentData, getOpacityFromColor } from "../Filaments";
import { emitEvent, useEvent } from "../EventHub";
import { IComponentProjectData } from "../ExportProject";

import {
	ColorArea,
	ColorField,
	ColorPicker,
	ColorSlider,
	ColorThumb,
	Input,
	Label,
	parseColor,
	SliderOutput,
	SliderTrack,
} from "react-aria-components";

export function Sidebar(props: IComponentProjectData) {
	const layoutManager = useContext(LayoutContext);
	const [filamentToAdd, setFilamentToAdd] = useState<FilamentData>({
		color: "#000000",
		name: "Filament 1",
		opacity: 0.1,
		layerHeight: props.projectConfig.layerHeight,
	});
	const [recentFilaments, setRecentFilaments] = useState<FilamentData[]>(props.filamentLayers);
	const [_, setFilamentCounter] = useState(1);
	const [selectedColor, setSelectedColor] = useState(parseColor("#000000"));

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
							<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
								<ColorPicker
									value={selectedColor.toString("hsl")}
									onChange={(color) => {
										setFilamentToAdd((old) => ({ ...old, color: color.toString("hex") }));
										setSelectedColor(color);
									}}
								>
									<ColorArea colorSpace="hsb" xChannel="saturation" yChannel="brightness">
										<ColorThumb />
									</ColorArea>
									<ColorSlider channel="hue">
										<Label />
										<SliderOutput />
										<SliderTrack>
											<ColorThumb />
										</SliderTrack>
									</ColorSlider>
									<ColorField>
										<Input />
									</ColorField>
								</ColorPicker>
							</div>
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
							setFilamentCounter((old) => {
								const increased = old + 1;
								setFilamentToAdd((old) => ({ ...old, name: `Filament ${increased}` }));
								return increased;
							});
							setRecentFilaments((old) => {
								old.push(structuredClone(filamentToAdd));
								return [...old];
							});
						}}
					>
						Add Filament Layer
					</button>
				</li>
			</ul>
			<h3>Recently Created Filaments</h3>
			<ul className="sidebar-list">
				{recentFilaments.map((filament) => (
					<FilamentView
						key={filament.name}
						filamentData={filament}
						onAdd={(filamentData) => {
							const newFilament = { ...filamentData, name: filamentToAdd.name };
							emitEvent(layoutManager, "layerAdded", newFilament);
							setFilamentCounter((old) => {
								const increased = old + 1;
								setFilamentToAdd((old) => ({ ...old, name: `Filament ${increased}` }));
								return increased;
							});
						}}
						onDelete={(id) => {
							setRecentFilaments((old) => old.filter((f) => f.name !== id));
						}}
					/>
				))}
			</ul>
		</section>
	);
}

function FilamentView({
	filamentData,
	onAdd,
	onDelete,
}: {
	filamentData: FilamentData;
	onAdd: (data: FilamentData) => void;
	onDelete: (id: string) => void;
}) {
	return (
		<li className="filament-list-item">
			<div className="filament-list-item-header">
				<span rel="name">{filamentData.name}</span>
			</div>
			<div className="row color-props">
				<div className="list-item-group">
					Colour: <div className="h-gap-small"></div> <input type="color" value={filamentData.color} readOnly />
				</div>
				<div className="h-gap"></div>
				<div className="list-item-group">
					Opacity: <div className="h-gap-small"></div>{" "}
					<input
						type="number"
						step="0.01"
						min="0"
						max="5"
						value={filamentData.opacity.toFixed(2)}
						className="filament-layer-opacity"
						readOnly
					/>
				</div>
			</div>
			<div className="row">
				<button className="delete-layer-button" onClick={() => onDelete(filamentData.name)}>
					Delete
				</button>
				<div className="h-gap" />
				<button className="delete-layer-button" onClick={() => onAdd(filamentData)}>
					Add
				</button>
			</div>
		</li>
	);
}
