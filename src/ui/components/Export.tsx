import React, { useContext, useEffect, useState } from "react";
import { emitEvent, IComputedData, useEvent } from "../EventHub";
import { LayoutContext } from "../LayoutContext";
import { DefaultProjectConfig } from "./Project";
import { generateSTL } from "../Export";
import { exportProject, IComponentProjectData } from "../ExportProject";
import { FilamentData } from "../Filaments";

export const defaultExportConfig = {
	imageResolution: { x: 0, y: 0 },
	physicalSize: { x: 0, y: 0 },
	detailSize: 0.2,
	aspectRatio: 1,
};

const defaultPhsicalSizeX = 100;

export function Export(props: IComponentProjectData) {
	const layoutManager = useContext(LayoutContext);
	const [imageResolution, setImageResolution] = useState(props.exportConfig.imageResolution);
	const [physicalSize, setPhysicalSize] = useState(props.exportConfig.physicalSize);
	const [detailSize, setDetailSize] = useState(props.exportConfig.detailSize);
	const [aspectRatio, setAspectRatio] = useState(props.exportConfig.aspectRatio);
	const [projectConfig, setProjectConfig] = useState(DefaultProjectConfig);
	const [sourceImage, setSourceImage] = useState<string | undefined>(props.image);
	const [layers, setLayers] = useState<FilamentData[]>(props.filamentLayers);
	const [computedData, setComputedData] = useState<IComputedData | undefined>(props.computedData);

	const [instructions, setInstructions] = useState<string>("");

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	const handlePhysicalSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		const parsedValue = parseFloat(value);
		if (id === "physical-x") {
			setPhysicalSize({ x: parsedValue, y: parsedValue / aspectRatio });
		} else if (id === "physical-y") {
			setPhysicalSize({ x: parsedValue * aspectRatio, y: parsedValue });
		}
	};

	useEvent("projectConfigChanged", (config) => {
		setProjectConfig(config);
	});

	useEvent("computedDataChanged", (data) => {
		setComputedData(data);
	});

	useEvent("layersChanged", (layers) => {
		setLayers(layers.data);
	});

	useEvent("imageChanged", (image) => {
		if (image.imageElement) {
			setSourceImage(image.imageElement.src);

			const newAspectRatio = image.imageElement.width / image.imageElement.height;
			setAspectRatio(newAspectRatio);
			setPhysicalSize({ x: defaultPhsicalSizeX, y: defaultPhsicalSizeX / newAspectRatio });
		}
	});

	useEffect(() => {
		emitEvent(
			layoutManager,
			"exportConfigChanged",
			structuredClone({ imageResolution, physicalSize, detailSize, aspectRatio }),
		);
	}, [layoutManager, imageResolution, physicalSize, detailSize, aspectRatio]);

	useEffect(() => {
		const newImageResulution = {
			x: Math.round(physicalSize.x / detailSize),
			y: Math.round(physicalSize.y / detailSize),
		};

		setImageResolution(newImageResulution);
	}, [physicalSize, detailSize]);

	return (
		<section id="export-section">
			<h3>Export options</h3>
			<div className="row" style={{ gap: "1rem" }}>
				<div>
					<h4>Image Resolution:</h4>
					<div>
						width:{" "}
						<input className="input-number" type="number" id="image-resolution-x" readOnly value={imageResolution.x} />{" "}
						px
					</div>
					<div>
						height:{" "}
						<input className="input-number" type="number" id="image-resolution-y" readOnly value={imageResolution.y} />{" "}
						px
					</div>
				</div>
				<div className="v-divider" />
				<div>
					<h4>Physical Size:</h4>
					<div>
						width:{" "}
						<input
							className="input-number"
							type="number"
							id="physical-x"
							min="1"
							value={physicalSize.x}
							onChange={handlePhysicalSizeChange}
						/>{" "}
						mm
					</div>{" "}
					<div>
						height:{" "}
						<input
							className="input-number"
							type="number"
							id="physical-y"
							min="1"
							value={physicalSize.y}
							onChange={handlePhysicalSizeChange}
						/>{" "}
						mm
					</div>
				</div>
			</div>
			<div className="row">
				<label>Detail Size: </label>
				<div className="h-gap-small"></div>
				<input
					className="input-number"
					type="number"
					step="0.05"
					value={detailSize}
					onChange={(v) => setDetailSize(parseFloat(v.target.value))}
					min="0.05"
					id="detail-size"
				/>
				<div className="h-gap-small"></div>
				mm
			</div>
			<span id="file-size-estimate">{`Estimated file size: ${
				(imageResolution.x * imageResolution.y * 200) / 1000000
			} MB`}</span>
			<div className="h-divider"></div>
			<div className="inline-div">
				<h3>Print Instructions</h3>
			</div>
			<textarea
				id="instructions"
				rows={30}
				readOnly
				value={instructions}
				onChange={(e) => {
					setInstructions(e.target.value);
				}}
			></textarea>
			<button
				id="export-stl"
				onClick={() => {
					if (computedData?.computedResult && computedData.filaments)
						setInstructions(
							generateSTL(
								computedData.computedResult,
								{ aspectRatio, detailSize, imageResolution, physicalSize },
								projectConfig,
								computedData.filaments,
							) ?? "",
						);
				}}
			>
				Export as STL
			</button>
			<button
				id="export-project"
				onClick={() => {
					if (sourceImage && computedData) {
						exportProject(
							sourceImage,
							projectConfig,
							{ imageResolution, physicalSize, detailSize, aspectRatio },
							layers,
							computedData,
						);
					}
				}}
			>
				Export as Project
			</button>
			<br></br>
			<a href="https://github.com/Kubas556/FilamentPainter" target="_blank">
				Check out the source code on GitHub.
			</a>
			<a href="https://www.reddit.com/r/FilamentPainter" target="_blank">
				Join the Filament Painter subreddit.
			</a>
			<a>For any inquiries, please contact: hpnrep9@gmail.com</a>
		</section>
	);
}
