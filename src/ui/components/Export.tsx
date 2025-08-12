import React, { useContext, useEffect, useState } from "react";
import { IComputedData, useEvent } from "../EventHub";
import { LayoutContext } from "../LayoutContext";
import { generateSTL } from "../Export";
import { exportProject, IComponentProjectData } from "../ExportProject";
import { useSyncState } from "../useSyncState";

export const defaultExportConfig = {
	imageResolution: { x: 0, y: 0 },
	physicalSize: { x: 100, y: 0 },
	detailSize: 0.2,
	aspectRatio: 1,
};

export function Export(props: IComponentProjectData) {
	const layoutManager = useContext(LayoutContext);
	const [exportConfig, setExportConfig] = useSyncState("ExportConfig", props.exportConfig);
	const [projectConfig] = useSyncState("ProjectConfig", props.projectConfig);
	const [sourceImage] = useSyncState("SourceImage", props.sourceImage);
	const [filamentLayers] = useSyncState("FilamentLayers", props.filamentLayers);
	const [computedData, setComputedData] = useState<IComputedData | undefined>(props.computedData);

	const [instructions, setInstructions] = useState<string>("");

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	const handlePhysicalSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		const parsedValue = parseFloat(value);
		if (id === "physical-x") {
			setExportConfig((prev) => {
				return { ...prev, physicalSize: { x: parsedValue, y: parsedValue / exportConfig.aspectRatio } };
			});
		} else if (id === "physical-y") {
			setExportConfig((prev) => {
				return { ...prev, physicalSize: { x: parsedValue * exportConfig.aspectRatio, y: parsedValue } };
			});
		}
	};

	useEvent("computedDataChanged", (data) => {
		setComputedData(data);
	});

	useEffect(() => {
		if (sourceImage) {
			const newAspectRatio = sourceImage.width / sourceImage.height;
			setExportConfig((prev) => {
				return {
					...exportConfig,
					aspectRatio: newAspectRatio,
					physicalSize: {
						x: exportConfig.physicalSize.x,
						y: exportConfig.physicalSize.x / newAspectRatio,
					},
				};
			});
		}
	}, [sourceImage]);

	useEffect(() => {
		const newImageResulution = {
			x: Math.round(exportConfig.physicalSize.x / exportConfig.detailSize),
			y: Math.round(exportConfig.physicalSize.y / exportConfig.detailSize),
		};

		setExportConfig((prev) => ({ ...prev, imageResolution: newImageResulution }));
	}, [exportConfig.physicalSize, exportConfig.detailSize]);

	return (
		<section id="export-section">
			<h3>Export options</h3>
			<div className="row" style={{ gap: "1rem" }}>
				<div>
					<h4>Image Resolution:</h4>
					<div>
						width:{" "}
						<input
							className="input-number"
							type="number"
							id="image-resolution-x"
							readOnly
							value={exportConfig.imageResolution.x}
						/>{" "}
						px
					</div>
					<div>
						height:{" "}
						<input
							className="input-number"
							type="number"
							id="image-resolution-y"
							readOnly
							value={exportConfig.imageResolution.y}
						/>{" "}
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
							value={exportConfig.physicalSize.x}
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
							value={exportConfig.physicalSize.y}
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
					value={exportConfig.detailSize}
					onChange={(v) => setExportConfig((prev) => ({ ...prev, detailSize: parseFloat(v.target.value) }))}
					min="0.05"
					id="detail-size"
				/>
				<div className="h-gap-small"></div>
				mm
			</div>
			<span id="file-size-estimate">{`Estimated file size: ${
				(exportConfig.imageResolution.x * exportConfig.imageResolution.y * 200) / 1000000
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
							generateSTL(computedData.computedResult, exportConfig, projectConfig, computedData.filaments) ?? "",
						);
				}}
			>
				Export as STL
			</button>
			<button
				id="export-project"
				onClick={() => {
					if (sourceImage && computedData) {
						exportProject(sourceImage.src, projectConfig, exportConfig, filamentLayers, computedData);
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
