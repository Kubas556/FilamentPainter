import React, { useCallback, useContext, useEffect, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { FilamentData, getOpacityFromColor } from "../Filaments";
import { IComponentProjectData } from "../ExportProject";

import {
	Button,
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
import { useSyncState } from "../useSyncState";
import { ModalDialogContext } from "../ModalDialogContext";

const nameWithIndexRegex = /^(?<name>\D*)(?<index>\d+)$/;

export function Sidebar(props: IComponentProjectData) {
	const layoutManager = useContext(LayoutContext);
	const showDialog = useContext(ModalDialogContext);
	const [filamentCounter, setFilamentCounter] = useState(1);
	const [filamentToAdd, setFilamentToAdd] = useState<FilamentData>({
		color: "#000000",
		name: `Filament ${filamentCounter}`,
		opacity: 0.1,
		layerHeight: props.projectConfig.layerHeight,
	});
	const [filamentLibrary, setFilamentsInLibrary] = useSyncState("FilamentLibrary", props.filamentLibrary);
	const [selectedColor, setSelectedColor] = useState(parseColor("#000000"));
	const [projectConfig, setProjectConfig] = useSyncState("ProjectConfig", props.projectConfig);
	const [filamentLayers, setFilamentLayers] = useSyncState("FilamentLayers", props.filamentLayers);

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	const increaseIndexInName = useCallback(() => {
		var match = filamentToAdd.name.match(nameWithIndexRegex);
		if (match) {
			const name = match[1];
			const index = parseInt(match[2]);

			setFilamentToAdd((old) => ({ ...old, name: `${name}${index + 1}` }));
		}
	}, [filamentToAdd]);

	const addLayerCallback = () => {
		if (filamentLibrary.some((f) => f.name == filamentToAdd.name)) {
			showDialog((close) => ({
				title: `Filament with name ${filamentToAdd.name} already exists.`,
				isError: true,
				body: (
					<div style={{ display: "flex", gap: 8 }}>
						<Button onPress={() => close()}>Ok</Button>
					</div>
				),
			}));
		} else {
			setFilamentsInLibrary((prev) => {
				return [...prev, structuredClone(filamentToAdd)];
			});

			setFilamentLayers((prev) => {
				return [structuredClone(filamentToAdd), ...prev];
			});

			increaseIndexInName();
		}
	};

	useEffect(() => {
		setFilamentToAdd((old) => ({ ...old, layerHeight: projectConfig.layerHeight }));
	}, [projectConfig]);

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
							<a className="label">Name: </a>
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
							<a className="label">Colour: </a>
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
										<Input style={{ maxWidth: "10rem" }} />
									</ColorField>
								</ColorPicker>
							</div>
						</span>
					</div>
					<div className="row">
						<span>
							<a className="label">TD: </a>
							<input
								type="number"
								step="0.01"
								min="0"
								max="50"
								value={(filamentToAdd.opacity * 10).toFixed(2)}
								onChange={(e) => {
									setFilamentToAdd((old) => ({ ...old, opacity: parseFloat(e.target.value) / 10 }));
								}}
							/>{" "}
							mm
						</span>
					</div>
					<button className="filament-add-button" id="add-item-button-new" onClick={addLayerCallback}>
						Add Filament Layer
					</button>
				</li>
			</ul>
			<h3>Filament Library</h3>
			<ul className="sidebar-list">
				{filamentLibrary.map((filament, i) => (
					<FilamentView
						key={`${filament.name}|${i}`}
						filamentData={filament}
						onAdd={(existingFilament) => {
							setFilamentLayers((prev) => {
								return [structuredClone(existingFilament), ...prev];
							});
							increaseIndexInName();
						}}
						onDelete={() => {
							setFilamentsInLibrary((old) => {
								old.splice(i, 1);
								return [...old];
							});
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
	onDelete: () => void;
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
					TD: <div className="h-gap-small"></div>{" "}
					<input
						type="number"
						step="0.01"
						min="0"
						max="50"
						value={(filamentData.opacity * 10).toFixed(2)}
						className="filament-layer-opacity"
						readOnly
					/>
				</div>
			</div>
			<div className="row">
				<button className="delete-layer-button" onClick={() => onDelete()}>
					Delete
				</button>
				<div className="h-gap" />
				<button className="delete-layer-button" onClick={() => onAdd(filamentData)}>
					Add layer
				</button>
			</div>
		</li>
	);
}
