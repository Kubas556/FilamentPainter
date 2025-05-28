import React, { useContext, useEffect, useRef, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { emitEvent, IExportConfig, IProjectConfig, useEvent } from "../EventHub";
import { getComputeFunction } from "../../gl/compute/Heights";
import { GLImage } from "../../gl/Image";
import { FilamentData } from "../Filaments";
import { Filament } from "../../Filament";
import { getTopographyFunction, resizePaintImage } from "../UpdateImage";
import { DefaultProjectConfig } from "./Project";

export function ImagePreview() {
	const layoutManager = useContext(LayoutContext);
	const [sourceImage, setSourceImage] = useState<HTMLImageElement>();
	const [exportConfig, setExportConfig] = useState<IExportConfig>();
	const [projectConfig, setProjectConfig] = useState<IProjectConfig>(DefaultProjectConfig);
	const [filamentLayers, setFilamentLayers] = useState<FilamentData[]>([]);
	const [glImage, setGlImage] = useState<GLImage | undefined>();

	const [computedResult, setComputedResult] = useState<Float32Array>();
	const [filaments, setFilaments] = useState<Filament[]>([]);

	const imageRef = useRef<HTMLCanvasElement>(null);

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	useEffect(() => {
		emitEvent(layoutManager, "computedDataChanged", { computedResult, filaments });
	}, [computedResult, filaments]);

	useEvent("imageChanged", (image) => {
		if (image.imageElement) {
			setSourceImage(image.imageElement);
		}
	});

	useEvent("layersChanged", (layers) => {
		setFilamentLayers(layers.data);
	});

	useEvent("projectConfigChanged", (config) => {
		setProjectConfig(config);
	});

	useEvent("exportConfigChanged", (config) => {
		setExportConfig(config);
	});

	useEffect(() => {
		if (imageRef.current && sourceImage && exportConfig && projectConfig) {
			resizePaintImage(sourceImage, exportConfig, (resizedImage) => {
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

				let filaments: FilamentData[] = [...filamentLayers].reverse(); //getFilamentListElements().reverse();
				let layerHeight = projectConfig.baseLayerHeight;
				const usedFilaments = [];
				for (let i = 0; i < filaments.length; i++) {
					usedFilaments.push(
						new Filament(
							filaments[i].color,
							filaments[i].layerHeight + layerHeight,
							filaments[i].name,
							filaments[i].opacity,
						),
					);
					layerHeight += filaments[i].layerHeight;
				}
				setFilaments(usedFilaments);

				const startHeight = projectConfig.baseLayerHeight;
				const endHeight = layerHeight;
				const increment = projectConfig.layerHeight;

				let computedResult = computeEngine.compute(newGlImage, {
					filaments: usedFilaments,
					startHeight,
					endHeight,
					increment,
				});
				setComputedResult(computedResult);

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
		<div className="preview-canvas-container">
			<canvas id="canvas-preview" className="preview-canvas" ref={imageRef} />
		</div>
	);
}
