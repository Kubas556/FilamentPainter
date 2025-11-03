import React, { useContext, useEffect, useRef, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { IComponentProjectData } from "../ExportProject";
import { useSyncState } from "../useSyncState";

export function ImageSource(props: IComponentProjectData) {
	const layoutManager = useContext(LayoutContext);
	const [sourceImage, setSourceImage] = useSyncState("SourceImage", props.sourceImage);
	const [exportConfig, setExportConfig] = useSyncState("ExportConfig", props.exportConfig);
	const [ratio, setRatio] = useState<number | null>(null);
	const imageRef = useRef<HTMLCanvasElement>(null);

	if (!layoutManager) {
		return <div>Layout manager not found</div>;
	}

	useEffect(() => {
		if (imageRef.current && sourceImage && exportConfig) {
			const pixelWidth = exportConfig.imageResolution.x;
			const pixelHeight = exportConfig.imageResolution.y;

			if (pixelWidth === 0 || pixelHeight === 0) return;

			const canvas = imageRef.current;
			canvas.width = pixelWidth;
			canvas.height = pixelHeight;
			setRatio(pixelWidth / pixelHeight);

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
				<canvas id="canvas-source" className="preview-canvas" ref={imageRef} />
			</div>
		</div>
	);
}
