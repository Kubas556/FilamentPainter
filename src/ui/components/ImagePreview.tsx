import React, { useContext, useEffect, useRef, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { getComputeFunction } from "../../gl/compute/Heights";
import { GLImage } from "../../gl/Image";
import { FilamentData } from "../Filaments";
import { Filament } from "../../Filament";
import { getTopographyFunction, resizePaintImage } from "../UpdateImage";
import { IComponentProjectData } from "../ExportProject";
import { useSyncState } from "../useSyncState";

export function ImagePreview(props: IComponentProjectData) {
	const layoutManager = useContext(LayoutContext);
	const [sourceImage] = useSyncState("SourceImage", props.sourceImage);
	const [exportConfig] = useSyncState("ExportConfig", props.exportConfig);
	const [projectConfig] = useSyncState("ProjectConfig", props.projectConfig);
	const [filamentLayers] = useSyncState("FilamentLayers", props.filamentLayers);
	const [computedData, setComputedData] = useSyncState("ComputedData", props.computedData);

	const [glImage, setGlImage] = useState<GLImage | undefined>();
	const [ratio, setRatio] = useState<number | null>(null);

	const imageRef = useRef<HTMLCanvasElement>(null);
	const manipulationCanvasRef = useRef<HTMLCanvasElement>(null);

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	useEffect(() => {
		if (manipulationCanvasRef.current === null) {
			manipulationCanvasRef.current = document.createElement("canvas") as HTMLCanvasElement;
		}

		if (imageRef.current && sourceImage && exportConfig && projectConfig) {
			resizePaintImage(manipulationCanvasRef.current, sourceImage, exportConfig, (resizedImage) => {
				const resized = resizedImage;

				let heightFunction = getTopographyFunction(projectConfig.selectedTopographyFunction);

				let computeEngine = getComputeFunction(heightFunction);

				if (glImage !== undefined) {
					setGlImage((prev) => {
						if (prev) {
							prev.dispose();
							return undefined;
						}
					});
				}

				const canvas = imageRef.current as HTMLCanvasElement;
				const ctx = canvas.getContext("2d");
				const newGlImage = new GLImage(resized);

				canvas.width = resized.width;
				canvas.height = resized.height;
				setRatio(resized.width / resized.height);

				let filaments: FilamentData[] = structuredClone(filamentLayers).reverse(); //getFilamentListElements().reverse();
				let layerHeight = projectConfig.baseLayerHeight;
				const usedFilaments: Filament[] = [];
				for (let i = 0; i < filaments.length; i++) {
					usedFilaments.push(
						new Filament(
							filaments[i].color,
							filaments[i].layerHeight + layerHeight, //Math.round((filaments[i].layerHeight + layerHeight) * 100) / 100,
							filaments[i].name,
							filaments[i].opacity,
						),
					);
					layerHeight += filaments[i].layerHeight;
				}

				const startHeight = projectConfig.baseLayerHeight;
				const endHeight = layerHeight;
				const increment = projectConfig.layerHeight;

				let computedResult = computeEngine.compute(newGlImage, {
					filaments: usedFilaments,
					startHeight,
					endHeight,
					increment,
				});

				setComputedData((prev) => ({ computedResult, filaments: usedFilaments }));

				if (!ctx) {
					throw new Error("Canvas 2D context not available.");
				}

				setGlImage(newGlImage);

				const imageData = ctx.createImageData(resized.width, resized.height);
				const data = imageData.data;

				data.set(computedResult.map((val, i) => (i % 4 === 3 ? 255 : val * 255)));
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.putImageData(imageData, 0, 0);
			});
		}
	}, [imageRef.current, sourceImage, exportConfig, projectConfig, filamentLayers]);

	return (
		<div className="preview-container-observer">
			<style>
				{ratio !== null &&
					`
				@container canvas (max-aspect-ratio: ${ratio}) {
					.preview-canvas-container {
						flex-direction: column;
					}
				}
			`}
			</style>
			<div className="preview-canvas-container">
				<canvas id="canvas-preview" className="preview-canvas" ref={imageRef} />
			</div>
		</div>
	);
}
