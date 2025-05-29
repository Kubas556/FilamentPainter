import React, { useContext, useEffect, useRef, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { IExportConfig, useEvent } from "../EventHub";
import { IComponentProjectData } from "../ExportProject";

export function ImageSource(props: IComponentProjectData) {
	const layoutManager = useContext(LayoutContext);
	const [sourceImage, setSourceImage] = useState<HTMLImageElement | undefined>(props.sourceImage);
	const [exportConfig, setExportConfig] = useState<IExportConfig>(props.exportConfig);
	const imageRef = useRef<HTMLCanvasElement>(null);

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	useEvent("imageChanged", (image) => {
		if (image.imageElement) {
			setSourceImage(image.imageElement);
		}
	});

	useEvent("exportConfigChanged", (config) => {
		setExportConfig(config);
	});

	useEffect(() => {
		if (imageRef.current && sourceImage && exportConfig) {
			const pixelWidth = exportConfig.imageResolution.x;
			const pixelHeight = exportConfig.imageResolution.y;

			const canvas = imageRef.current;
			canvas.width = pixelWidth;
			canvas.height = pixelHeight;

			const ctx = canvas.getContext("2d");

			if (ctx) {
				// Draw the source image onto the canvas, scaling it to the new dimensions
				ctx.drawImage(sourceImage, 0, 0, pixelWidth, pixelHeight);
			} else {
				console.error("Could not get 2D rendering context for canvas.");
			}
		}
	}, [imageRef, sourceImage, exportConfig]);

	return (
		<div className="preview-container-observer">
			<style>
				{`
				@container canvas (max-aspect-ratio: ${(imageRef.current?.width ?? 0) / (imageRef.current?.height ?? 0)}) {
					.preview-canvas-container {
						flex-direction: column;
					}
				}
			`}
			</style>
			<div className="preview-canvas-container">
				<canvas id="canvas-source" className="preview-canvas" ref={imageRef} />
			</div>
		</div>
	);
}
