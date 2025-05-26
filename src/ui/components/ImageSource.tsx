import React, { useContext, useEffect, useRef, useState } from "react";
import { LayoutContext } from "../LayoutContext";
import { IExportConfig, useEvent } from "../EventHub";

export function ImageSource() {
	const layoutManager = useContext(LayoutContext);
	const [sourceImage, setSourceImage] = useState<HTMLImageElement>();
	const [exportConfig, setExportConfig] = useState<IExportConfig>();
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
		<div className="preview-canvas-container">
			<canvas id="canvas-source" className="preview-canvas" ref={imageRef} />
		</div>
	);
}
