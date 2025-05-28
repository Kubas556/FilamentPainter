import React, { useContext, useEffect, useState } from "react";
import { emitEvent, IComputedDataChanged, useEvent } from "../EventHub";
import { LayoutContext } from "../LayoutContext";
import { DefaultProjectConfig } from "./Project";
import { generateSTL } from "../Export";

export const defaultExportConfig = {
	imageResolution: { x: 0, y: 0 },
	physicalSize: { x: 0, y: 0 },
	detailSize: 0.2,
	aspectRatio: 1,
};

const defaultPhsicalSizeX = 100;

export function Export() {
	const layoutManager = useContext(LayoutContext);
	const [imageResolution, setImageResolution] = useState(defaultExportConfig.imageResolution);
	const [physicalSize, setPhysicalSize] = useState(defaultExportConfig.physicalSize);
	const [detailSize, setDetailSize] = useState(defaultExportConfig.detailSize);
	const [aspectRatio, setAspectRatio] = useState(defaultExportConfig.aspectRatio);
	const [projectConfig, setProjectConfig] = useState(DefaultProjectConfig);
	const [computedData, setComputedData] = useState<IComputedDataChanged>();

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

	useEvent("imageChanged", (image) => {
		if (image.imageElement) {
			const newAspectRatio = image.imageElement.width / image.imageElement.height;
			setAspectRatio(newAspectRatio);
			setPhysicalSize({ x: defaultPhsicalSizeX, y: defaultPhsicalSizeX / newAspectRatio });
		}
	});

	useEffect(() => {
		emitEvent(layoutManager, "exportConfigChanged", { imageResolution, physicalSize, detailSize, aspectRatio });
	}, [layoutManager, imageResolution, physicalSize, detailSize, aspectRatio]);

	useEffect(() => {
		const newImageResulution = {
			x: Math.round(physicalSize.x / detailSize),
			y: Math.round(physicalSize.y / detailSize),
		};

		setImageResolution(newImageResulution);
	}, [physicalSize, detailSize]);

	return (
		<div id="export-section">
			<div>
				<label>Image Resolution:</label>
				w <input className="input-number" type="number" id="image-resolution-x" readOnly value={imageResolution.x} /> px
				by h <input className="input-number" type="number" id="image-resolution-y" readOnly value={imageResolution.y} />{" "}
				px
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
			<div>
				<label>Physical Size:</label>w{" "}
				<input
					className="input-number"
					type="number"
					id="physical-x"
					min="1"
					value={physicalSize.x}
					onChange={handlePhysicalSizeChange}
				/>{" "}
				mm by h{" "}
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
			<span id="file-size-estimate">{`Estimated file size: ${
				(imageResolution.x * imageResolution.y * 200) / 1000000
			} MB`}</span>
			<div className="inline-div">
				<h3>Print Instructions</h3>
			</div>
			<textarea id="instructions" rows={30}></textarea>
			ℹ️ Notice: This software is only free for non-commercial use.
			<br></br>
			If you would like to purchase a commercial license, click the button below.
			<button id="buy-commercial">Buy Commercial License ($20)</button>
			<button
				id="export-stl"
				onClick={() => {
					if (computedData?.computedResult && computedData.filaments)
						generateSTL(
							computedData.computedResult,
							{ aspectRatio, detailSize, imageResolution, physicalSize },
							projectConfig,
							computedData.filaments,
						);
				}}
			>
				Export as STL
			</button>
			<button id="export-project">Export as Project (In Development)</button>
			<br></br>
			<a href="https://github.com/hpnrep6/FilamentPainter" target="_blank">
				Check out the source code on GitHub.
			</a>
			<a href="https://www.reddit.com/r/FilamentPainter" target="_blank">
				Join the Filament Painter subreddit.
			</a>
			<a>For any inquiries, please contact: hpnrep9@gmail.com</a>
		</div>
	);
}
